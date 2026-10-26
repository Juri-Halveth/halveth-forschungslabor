import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { MAX_CHECKPOINT_BYTES, readCheckpointFile, writeCheckpointFile } from '../src/node-checkpoint-store.mjs';

const sha = text => createHash('sha256').update(text).digest('hex');
async function fixture(t) {
  const root = await fs.realpath(await fs.mkdtemp(path.join(tmpdir(), 'halveth-checkpoint-test-')));
  const owned = new Map();
  function entry(name, kind = 'file') {
    const result = path.resolve(root, name), relative = path.relative(root, result);
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    owned.set(result, kind); return result;
  }
  t.after(async () => {
    assert.equal(await fs.realpath(root), root);
    assert.equal((await fs.lstat(root)).isSymbolicLink(), false);
    // Only explicitly registered fixture entries; no recursive delete.
    for (const [item, kind] of [...owned].reverse()) {
      try { if (kind === 'directory') await fs.rmdir(item); else await fs.unlink(item); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    await fs.rmdir(root);
  });
  return { root, file: name => entry(name), directory: name => entry(name, 'directory') };
}

test('checkpoint create/read preserve exact UTF-8 bytes and report sync scope', async t => {
  const f = await fixture(t), target = f.file('checkpoint.json');
  const text = '{\n  "schema": "synthetic-checkpoint", "text": "Licht 🧬", "n": 4\n}\n';
  const written = await writeCheckpointFile(target, text);
  assert.equal(written.path, target); assert.equal(written.sha256, sha(text));
  assert.equal(written.bytes, Buffer.byteLength(text));
  assert.equal(written.fsyncRequested, true); assert.equal(written.fileSyncCompleted, true);
  assert.equal(written.publication, 'EXCLUSIVE_LINK_NO_REPLACE');
  assert.equal(written.publicationConfirmed, true); assert.equal(written.overwrite, false);
  assert.equal(typeof written.directorySyncCompleted, 'boolean');
  const read = await readCheckpointFile(target);
  assert.equal(read.text, text); assert.equal(read.receipt.sha256, written.sha256);
  assert.equal(read.receipt.bytes, written.bytes); assert.equal(read.receipt.fsyncRequested, false);
  assert.deepEqual(await fs.readdir(f.root), ['checkpoint.json']);
});

test('invalid JSON, duplicate decoded keys and non-scalar text never create a file', async t => {
  const f = await fixture(t), target = f.file('invalid.json');
  for (const text of ['{"a":1,"a":2}', '{"a":1,"\\u0061":2}', '{"x":"\\ud800"}',
    '"\ud800"', '{"x":1e309}', '{"__proto__":{}}', '{"x":true} tail', '\uFEFF{}']) {
    await assert.rejects(writeCheckpointFile(target, text), undefined, text);
  }
  await assert.rejects(writeCheckpointFile(target, Buffer.from('{}')), /string/);
  await assert.rejects(writeCheckpointFile(target, '{}', { overwrite: 1 }), /boolean/);
  await assert.rejects(writeCheckpointFile(target, '{}', { unexpected: true }), /overwrite/);
  await assert.rejects(writeCheckpointFile('relative.json', '{}'), /absolute/);
  assert.deepEqual(await fs.readdir(f.root), []);
});

test('read rejects malformed UTF-8, BOM and duplicate keys without rewriting bytes', async t => {
  const f = await fixture(t), target = f.file('malformed.json');
  for (const bytes of [Buffer.from([0x22, 0xc0, 0xaf, 0x22]), Buffer.from([0x22, 0xe2, 0x82]),
    Buffer.from('\uFEFF{}'), Buffer.from('{"x":1,"x":2}')]) {
    await fs.writeFile(target, bytes);
    await assert.rejects(readCheckpointFile(target));
    assert.deepEqual(await fs.readFile(target), bytes);
  }
});

test('16 MiB is an inclusive byte limit and excess UTF-8 bytes are rejected', async t => {
  const f = await fixture(t), target = f.file('bounded.json');
  const exact = '"' + 'x'.repeat(MAX_CHECKPOINT_BYTES - 2) + '"';
  const written = await writeCheckpointFile(target, exact);
  assert.equal(written.bytes, MAX_CHECKPOINT_BYTES);
  const read = await readCheckpointFile(target); assert.equal(read.text, exact);
  await assert.rejects(writeCheckpointFile(target, exact + ' ', { overwrite: true }), /16 MiB/);
  await assert.rejects(writeCheckpointFile(target, '"' + '🧬'.repeat(MAX_CHECKPOINT_BYTES / 4) + '"', { overwrite: true }), /16 MiB/);
  assert.equal((await readCheckpointFile(target)).receipt.sha256, written.sha256);
  await fs.appendFile(target, ' ');
  await assert.rejects(readCheckpointFile(target), /16 MiB/);
});

test('bounded read also caps a file that grows after fstat', async t => {
  const f = await fixture(t), target = f.file('growing.json');
  await fs.writeFile(target, '{}');
  const originalOpen = fs.open;
  let observed = 0;
  t.mock.method(fs, 'open', async function (...args) {
    const handle = await originalOpen.apply(this, args);
    if (args[0] === target) {
      const originalStat = handle.stat.bind(handle), originalRead = handle.read.bind(handle);
      let first = true;
      t.mock.method(handle, 'stat', async options => {
        const result = await originalStat(options);
        if (first) { first = false; await fs.appendFile(target, Buffer.alloc(MAX_CHECKPOINT_BYTES)); }
        return result;
      });
      t.mock.method(handle, 'read', async (...readArgs) => {
        const result = await originalRead(...readArgs); observed += result.bytesRead; return result;
      });
    }
    return handle;
  });
  await assert.rejects(readCheckpointFile(target), /grew beyond 16 MiB/);
  assert.equal(observed, MAX_CHECKPOINT_BYTES + 1);
});

test('existing target requires explicit overwrite and invalid replacement preserves it', async t => {
  const f = await fixture(t), target = f.file('accepted.json');
  const original = '{"accepted":"first"}\n';
  await writeCheckpointFile(target, original);
  await assert.rejects(writeCheckpointFile(target, '{"next":true}'), { code: 'EEXIST' });
  await assert.rejects(writeCheckpointFile(target, '{"a":1,"a":2}', { overwrite: true }));
  assert.equal(await fs.readFile(target, 'utf8'), original);
  const replacement = await writeCheckpointFile(target, '{"accepted":"second"}', { overwrite: true });
  assert.equal(replacement.publication, 'RENAME_REPLACE'); assert.equal(replacement.replacedExisting, true);
  assert.equal((await readCheckpointFile(target)).text, '{"accepted":"second"}');
  assert.deepEqual(await fs.readdir(f.root), ['accepted.json']);
});

test('a partial temporary write or sync failure preserves the accepted target', async t => {
  const f = await fixture(t), target = f.file('accepted.json');
  const original = '{"accepted":true}';
  await writeCheckpointFile(target, original);
  const originalOpen = fs.open;
  for (const stage of ['write', 'sync']) {
    const mock = t.mock.method(fs, 'open', async function (...args) {
      const handle = await originalOpen.apply(this, args);
      if (path.basename(args[0]).startsWith('.halveth-checkpoint-')) {
        if (stage === 'write') t.mock.method(handle, 'writeFile', async () => {
          await handle.write('partial'); throw Object.assign(new Error('synthetic write failure'), { code: 'EIO' });
        });
        else t.mock.method(handle, 'sync', async () => { throw Object.assign(new Error('synthetic sync failure'), { code: 'EIO' }); });
      }
      return handle;
    });
    await assert.rejects(writeCheckpointFile(target, '{"replacement":true}', { overwrite: true }), { code: 'EIO' });
    mock.mock.restore();
    assert.equal(await fs.readFile(target, 'utf8'), original);
    assert.deepEqual(await fs.readdir(f.root), ['accepted.json']);
  }
});

test('missing parents and directory destinations are rejected without creating folders', async t => {
  const f = await fixture(t), directory = f.directory('existing'); await fs.mkdir(directory);
  await assert.rejects(writeCheckpointFile(path.join(f.root, 'absent', 'checkpoint.json'), '{}'), { code: 'ENOENT' });
  await assert.rejects(writeCheckpointFile(directory, '{}', { overwrite: true }), { code: 'ERR_CHECKPOINT_NOT_FILE' });
  await assert.rejects(readCheckpointFile(directory), { code: 'ERR_CHECKPOINT_NOT_FILE' });
  assert.deepEqual(await fs.readdir(f.root), ['existing']);
});

test('unsupported link and failed rename publication leave accepted state intact', async t => {
  const f = await fixture(t), target = f.file('publication.json');
  const linkMock = t.mock.method(fs, 'link', async () => {
    throw Object.assign(new Error('synthetic unsupported hard link'), { code: 'ENOTSUP' });
  });
  await assert.rejects(writeCheckpointFile(target, '{}'), { code: 'ENOTSUP' });
  linkMock.mock.restore();
  assert.deepEqual(await fs.readdir(f.root), []);
  await writeCheckpointFile(target, '{"accepted":true}');
  const renameMock = t.mock.method(fs, 'rename', async () => {
    throw Object.assign(new Error('synthetic rename failure'), { code: 'EACCES' });
  });
  await assert.rejects(writeCheckpointFile(target, '{"replacement":true}', { overwrite: true }), { code: 'EACCES' });
  renameMock.mock.restore();
  assert.equal((await readCheckpointFile(target)).text, '{"accepted":true}');
  assert.deepEqual(await fs.readdir(f.root), ['publication.json']);
});

test('post-publication directory sync limits are reported without a false rollback', async t => {
  const f = await fixture(t), target = f.file('directory-sync.json');
  const originalOpen = fs.open;
  const openMock = t.mock.method(fs, 'open', async function (...args) {
    if (args[0] === f.root) throw Object.assign(new Error('synthetic directory sync denial'), { code: 'EACCES' });
    return originalOpen.apply(this, args);
  });
  const written = await writeCheckpointFile(target, '{"published":true}');
  openMock.mock.restore();
  assert.equal(written.publicationConfirmed, true);
  assert.equal(written.fileSyncCompleted, true);
  assert.equal(written.directorySyncCompleted, false);
  assert.equal(written.directorySyncErrorCode, 'EACCES');
  assert.equal((await readCheckpointFile(target)).text, '{"published":true}');
});

test('a directory symlink or junction cannot redirect checkpoint writes or reads', async t => {
  const f = await fixture(t), actual = f.directory('actual'); await fs.mkdir(actual);
  const realFile = f.file('actual/checkpoint.json'); await fs.writeFile(realFile, '{"kept":true}');
  const alias = f.file('alias');
  try { await fs.symlink(actual, alias, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) { t.skip('Symlink/junction creation unavailable: ' + error.code); return; } throw error; }
  const redirected = path.join(alias, 'checkpoint.json');
  await assert.rejects(readCheckpointFile(redirected), { code: 'ELOOP' });
  await assert.rejects(writeCheckpointFile(redirected, '{}', { overwrite: true }), { code: 'ELOOP' });
  assert.equal(await fs.readFile(realFile, 'utf8'), '{"kept":true}');
});

test('a final file symlink is rejected for read, create and explicit overwrite', async t => {
  const f = await fixture(t), actual = f.file('actual.json'), alias = f.file('alias.json');
  await fs.writeFile(actual, '{"kept":true}');
  try { await fs.symlink(actual, alias, 'file'); }
  catch (error) { if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) { t.skip('File symlink creation unavailable: ' + error.code); return; } throw error; }
  await assert.rejects(readCheckpointFile(alias), { code: 'ELOOP' });
  await assert.rejects(writeCheckpointFile(alias, '{}'), { code: 'ELOOP' });
  await assert.rejects(writeCheckpointFile(alias, '{}', { overwrite: true }), { code: 'ELOOP' });
  assert.equal(await fs.readFile(actual, 'utf8'), '{"kept":true}');
  assert.equal((await fs.lstat(alias)).isSymbolicLink(), true);
});

test('same-process writes serialize and no-replace has exactly one winner', async t => {
  const f = await fixture(t), target = f.file('winner.json');
  const texts = Array.from({ length: 8 }, (_, i) => JSON.stringify({ writer: i }));
  const results = await Promise.allSettled(texts.map(text => writeCheckpointFile(target, text)));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  for (const result of results.filter(result => result.status === 'rejected')) assert.equal(result.reason.code, 'EEXIST');
  const winner = results.findIndex(result => result.status === 'fulfilled');
  assert.equal((await readCheckpointFile(target)).text, texts[winner]);
  const replacements = await Promise.all(texts.map(text => writeCheckpointFile(target, text, { overwrite: true })));
  assert.equal(replacements.length, texts.length);
  assert.equal((await readCheckpointFile(target)).text, texts.at(-1));
  assert.deepEqual(await fs.readdir(f.root), ['winner.json']);
});

test('isolated worker writers have one exclusive-link winner', { timeout: 20000 }, async t => {
  const f = await fixture(t), target = f.file('worker-winner.json');
  const moduleUrl = new URL('../src/node-checkpoint-store.mjs', import.meta.url).href;
  const workers = [], ready = [], completed = [], exited = [];
  for (let i = 0; i < 4; i++) {
    const worker = new Worker(`
      const {parentPort,workerData}=require('node:worker_threads');
      import(workerData.moduleUrl).then(store=>{
        parentPort.once('message',async()=>{
          try { parentPort.postMessage({ok:true,receipt:await store.writeCheckpointFile(workerData.path,workerData.text)}); }
          catch(error) { parentPort.postMessage({ok:false,code:error.code,message:error.message}); }
          parentPort.close();
        });
        parentPort.postMessage({ready:true});
      }).catch(error=>{parentPort.postMessage({ok:false,message:error.message});parentPort.close();});
    `, { eval: true, workerData: { moduleUrl, path: target, text: JSON.stringify({ writer: i }) } });
    workers.push(worker);
    ready.push(new Promise((resolve, reject) => { worker.on('message', message => { if (message.ready) resolve(); }); worker.once('error', reject); }));
    completed.push(new Promise((resolve, reject) => { worker.on('message', message => { if (!message.ready) resolve(message); }); worker.once('error', reject); }));
    exited.push(new Promise((resolve, reject) => { worker.once('exit', code => code ? reject(new Error('Worker exited ' + code)) : resolve()); worker.once('error', reject); }));
  }
  try {
    await Promise.all(ready); for (const worker of workers) worker.postMessage('start');
    const results = await Promise.all(completed); await Promise.all(exited);
    assert.equal(results.filter(result => result.ok).length, 1);
    for (const result of results.filter(result => !result.ok)) assert.equal(result.code, 'EEXIST');
    const winner = results.find(result => result.ok);
    assert.equal((await readCheckpointFile(target)).receipt.sha256, winner.receipt.sha256);
    assert.deepEqual(await fs.readdir(f.root), ['worker-winner.json']);
  } finally { await Promise.all(workers.map(worker => worker.terminate())); }
});
