import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const runner=fileURLToPath(new URL('../examples/persisted-runner.mjs',import.meta.url));
async function run(args,flags=[]){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,[...flags,runner,...args],{stdio:['ignore','pipe','pipe']});let out='',err='';child.stdout.on('data',s=>out+=s);child.stderr.on('data',s=>err+=s);child.once('error',reject);child.once('close',code=>resolve({code,out,err}));});}
async function rootFor(t){const parent=await fs.realpath(os.tmpdir()),root=await fs.mkdtemp(path.join(parent,'halveth-runner-'));t.after(async()=>{const real=await fs.realpath(root);if(path.dirname(real)!==parent||!path.basename(real).startsWith('halveth-runner-'))throw Error('Cleanup boundary');await fs.rm(real,{recursive:true,force:true});});return root;}
test('runner help has no filesystem requirement and an implicit output is rejected',async()=>{
  const help=await run(['--help']);assert.equal(help.code,0);assert.match(help.out,/No autostart or external network/);
  const missing=await run([]);assert.notEqual(missing.code,0);assert.match(missing.err,/--output must name/);
});
test('runner rejects nonlocal path namespaces before the first filesystem call',async()=>{
  const tripwire=new URL('./fixtures/no-filesystem.mjs',import.meta.url).href;
  const paths=process.platform==='win32'?['\\\\example.invalid\\share\\output','\\\\?\\C:\\output','C:\\NUL','C:\\output:stream']:['relative-output'];
  for(const value of paths){const result=await run(['--output',value],['--import',tripwire]);assert.notEqual(result.code,0);assert(!result.err.includes('I/O_TRIPWIRE_BEFORE_PATH_VALIDATION'));}
});
test('two actual CLI processes persist and resume a full bound model without overwriting the first run',async t=>{
  const root=await rootFor(t),first=path.join(root,'first'),second=path.join(root,'second');await fs.mkdir(first);await fs.mkdir(second);
  const a=await run(['--output',first,'--duration-ms','1000','--checkpoint-ms','1000','--scenario','profiles','--profiles','2','--tick-ms','1000']);assert.equal(a.code,0,a.err);
  const old=await fs.readFile(path.join(first,'final.json'),'utf8'),one=JSON.parse(await fs.readFile(path.join(first,'run-result.json'),'utf8'));
  assert.equal(one.endTick,1);assert.equal(one.error,null);assert(one.audit.passed);assert.equal(one.sourceDigests.length,12);
  const b=await run(['--output',second,'--resume',path.join(first,'final.json'),'--duration-ms','1000']);assert.equal(b.code,0,b.err);
  const start=JSON.parse(await fs.readFile(path.join(second,'run-start.json'),'utf8')),two=JSON.parse(await fs.readFile(path.join(second,'run-result.json'),'utf8'));
  assert.equal(start.startTick,one.endTick);assert.equal(start.startHead,one.endHead);assert.equal(two.endTick,2);assert(two.audit.passed);
  assert.equal(await fs.readFile(path.join(first,'final.json'),'utf8'),old);
  const repeated=await run(['--output',first,'--duration-ms','1000']);assert.notEqual(repeated.code,0);assert.equal(await fs.readFile(path.join(first,'final.json'),'utf8'),old);
});
