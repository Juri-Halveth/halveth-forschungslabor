import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
test('catalog has distinct modules with real source and test files',()=>{
 const c=read('catalog/branches.json'),u=read('branches/normenwerk-rule-universe/universe-catalog.json');
 assert.equal(c.branches.length,u.branchCount);
 assert.equal(c.branches.length,u.branches.length);
 assert.equal(new Set(c.branches.map(r=>r.id)).size,c.branches.length);
 for(const row of c.branches){
  assert.ok(fs.statSync(path.join(root,row.path,row.entry)).isFile());
  const x=u.branches.find(x=>x.id===row.id);assert.ok(x?.sourceFiles.length&&x.testFiles.length);
  for(const p of [...x.sourceFiles,...x.testFiles])assert.ok(fs.statSync(path.join(root,p)).isFile());
 }
});
test('provenance distinguishes unchanged bytes from adaptations',()=>{
 const p=read('SOURCE_PROVENANCE.json');
 assert.match(p.historicalSourceCommit,/^[0-9a-f]{40}$/);
 for(const row of p.records){
  const digest=createHash('sha256').update(fs.readFileSync(path.join(root,row.path))).digest('hex');
  assert.equal(digest,row.outputSha256,row.path);
  if(row.transfer==='EXACT_SOURCE_BYTES')assert.equal(digest,row.sourceSha256,row.path);
 }
});
