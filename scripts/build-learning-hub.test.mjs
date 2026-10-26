// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { learningArtifacts, checkLearningArtifacts, safeSourcePath } from "./build-learning-hub.mjs";

const root=path.resolve(import.meta.dirname,"..");
test("every current module has real source and test bindings; generated knowledge stays current",async()=>{
  assert.equal(await checkLearningArtifacts(),3);
  const routes=JSON.parse(await fs.readFile(path.join(root,"catalog/wissen/routes.json"),"utf8"));
  assert.equal(routes.entries.length,22);
  assert.equal(routes.entries.find(entry=>entry.id==='open-organism-engine').demo,'systeme/');
  assert.equal(routes.entries.find(entry=>entry.id==='code-observation-lab').demo,'code/');
  assert.equal(routes.entries.find(entry=>entry.id==='security-workbench').demo,'sicherheitslabor/');
  assert.equal(routes.entries.find(entry=>entry.id==='security-research-hub').demo,'security/');
  assert.ok(routes.entries.every(entry=>entry.files.some(file=>file.path===entry.source)&&entry.files.some(file=>entry.tests.includes(file.path))));
});
test("missing test, unbound module and path traversal reject instead of producing a complete tunnel",async(t)=>{
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),"halveth-hub-"));
  t.after(async()=>{
    const real=await fs.realpath(temp), parent=await fs.realpath(os.tmpdir());
    if(path.dirname(real)!==parent||!path.basename(real).startsWith("halveth-hub-"))throw Error("Cleanup boundary");
    await fs.rm(real,{recursive:true,force:true});
  });
  await fs.mkdir(path.join(temp,"catalog"));await fs.mkdir(path.join(temp,"branches/a"),{recursive:true});await fs.mkdir(path.join(temp,"research"));
  const entry={id:"a",title:"Synthetic",description:"Synthetic",source:"branches/a/source.mjs",tests:["branches/a/test.mjs"],docs:"branches/a/README.md",demo:null};
  await fs.writeFile(path.join(temp,"catalog/learning-paths.json"),JSON.stringify({schema:"halveth.learning-paths.v1",entries:[entry]}));
  for(const p of [entry.source,entry.docs])await fs.writeFile(path.join(temp,p),"synthetic");
  await assert.rejects(learningArtifacts(temp),/ENOENT/);
  await fs.writeFile(path.join(temp,entry.tests[0]),"synthetic");
  await fs.mkdir(path.join(temp,"branches/unregistered"));
  await assert.rejects(learningArtifacts(temp),/Unregistered module/);
  for(const p of ["../outside","branches/../secret","C:/private","/private","branches/.hidden/a","branches/a\\b"])
    assert.throws(()=>safeSourcePath(p),/Invalid public source path/);
});
