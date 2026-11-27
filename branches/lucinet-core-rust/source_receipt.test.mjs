import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const root = import.meta.dirname;
const receipt = JSON.parse(readFileSync(join(root, 'SOURCE_RECEIPT.json'), 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

test('committed Rust source bytes match the bounded local copy receipt', () => {
  assert.equal(receipt.schema, 'halveth.source-copy-receipt.v1');
  assert.equal(receipt.copyMode, 'EXACT_COMMITTED_BYTES');
  assert.match(receipt.sourceCommit, /^[a-f0-9]{40}$/);
  assert.equal(receipt.files.length, 19);
  assert.equal(sha256(readFileSync(join(root, 'LICENSE'))), receipt.sourceLicenseSha256);
  const seen = new Set();
  for (const file of receipt.files) {
    assert.match(file.path, /^(src|tests)\/[A-Za-z0-9_./-]+\.rs$/);
    assert.ok(!file.path.includes('..'));
    assert.equal(seen.has(file.path), false);
    seen.add(file.path);
    const bytes = readFileSync(join(root, file.path));
    assert.equal(bytes.length, file.bytes, file.path);
    assert.equal(sha256(bytes), file.sha256, file.path);
  }
});
