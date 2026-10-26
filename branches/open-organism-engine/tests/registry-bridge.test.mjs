import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readHalvethRegistry,parseRegistryText} from '../src/registry-bridge.mjs';
const fixture=role=>JSON.stringify({schema:'halveth.universe.v1',entities:[{id:'p1',role}]});
test('registry path validation precedes I/O and rejects implicit or nonlocal namespaces',async t=>{
  let calls=0;t.mock.method(fs,'lstat',()=>{calls++;throw Error('I/O should not start');});
  const invalid=['relative.json','',null,Buffer.from('file.json')];
  if(process.platform==='win32')invalid.push('\\\\example.invalid\\share\\registry.json','\\\\?\\C:\\registry.json','C:\\registry.json:stream','C:\\NUL','C:\\alias.\\registry.json');
  for(const path of invalid)await assert.rejects(readHalvethRegistry(path));assert.equal(calls,0);
});
async function directory(t){
  const parent=await fs.realpath(os.tmpdir()),root=await fs.mkdtemp(path.join(parent,'halveth-registry-'));
  t.after(async()=>{const real=await fs.realpath(root);if(path.dirname(real)!==parent||!path.basename(real).startsWith('halveth-registry-'))throw Error('Cleanup boundary');await fs.rm(real,{recursive:true,force:true});});
  return root;
}
test('registry framing accepts only its declared ASCII whitespace and one static wrapper',()=>{
  const json=fixture('literal <script> data');assert.equal(parseRegistryText(' \n'+json+'\r\n').registry.entities[0].role,'literal <script> data');
  assert.equal(parseRegistryText('window.HalvethUniverse = '+json+' ;\n').receipt.sourceKind,'STATIC_ASSIGNMENT_WRAPPER');
  for(const text of ['\ufeff'+json,'\u00a0'+json,json+'\u00a0','window.HalvethUniverse = '+json+';;','window.HalvethUniverse = '+json+'; globalThis.injected=true'])assert.throws(()=>parseRegistryText(text));
});
test('registry reader decodes exact UTF-8 and rejects malformed files without rewriting them',async t=>{
  const root=await directory(t),file=path.join(root,'registry.json');const json=fixture('Grüße 🧬');await fs.writeFile(file,json);
  assert.equal((await readHalvethRegistry(file)).entities[0].role,'Grüße 🧬');
  for(const bytes of [Buffer.from([0xff]),Buffer.from('\ufeff'+json),Buffer.from('{"schema":1,"schema":2}')]){
    await fs.writeFile(file,bytes);await assert.rejects(readHalvethRegistry(file));assert.deepEqual(await fs.readFile(file),bytes);
  }
  await assert.rejects(readHalvethRegistry(root),/Regular registry file/);
});
test('registry read is actually capped when its own file grows after the bound fstat',async t=>{
  const root=await directory(t),file=path.join(root,'registry.json');await fs.writeFile(file,fixture('a'));
  const originalOpen=fs.open,originalWrite=fs.writeFile;let readBytes=0,largestRequest=0;
  t.mock.method(fs,'open',async(...args)=>{
    const handle=await originalOpen(...args);const stat=handle.stat.bind(handle),read=handle.read.bind(handle);let first=true;
    handle.stat=async(...args)=>{const result=await stat(...args);if(first){first=false;await originalWrite(file,Buffer.alloc(5*1024*1024,32));}return result;};
    handle.read=async(...args)=>{largestRequest=Math.max(largestRequest,args[2]);const result=await read(...args);readBytes+=result.bytesRead;return result;};
    return handle;
  });
  await assert.rejects(readHalvethRegistry(file),/grew beyond/);assert.equal(readBytes,4*1024*1024+1);assert(largestRequest<=65536);
});
test('registry identity change between lstat and open is rejected before any payload read',async t=>{
  const root=await directory(t),file=path.join(root,'registry.json'),replacement=path.join(root,'replacement.json');
  await fs.writeFile(file,fixture('a'));await fs.writeFile(replacement,fixture('b'));const time=new Date('2026-01-01T00:00:00Z');await fs.utimes(file,time,time);await fs.utimes(replacement,time,time);
  const a=await fs.stat(file),b=await fs.stat(replacement);assert.equal(a.size,b.size);assert.equal(a.mtimeMs,b.mtimeMs);assert.notEqual(a.ino,b.ino);
  const originalOpen=fs.open;let readCalls=0;
  t.mock.method(fs,'open',async(...args)=>{await fs.rename(replacement,file);const handle=await originalOpen(...args);const read=handle.read.bind(handle);handle.read=async(...args)=>{readCalls++;return read(...args);};return handle;});
  await assert.rejects(readHalvethRegistry(file),/changed before bounded read/);assert.equal(readCalls,0);
});
