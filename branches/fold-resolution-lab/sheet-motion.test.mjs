// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULTS} from "./model.js";
import {SHEET_ID, sheetLimit, sheetMesh, sheetPoint, sheetStages} from "./sheet-motion.js";

const near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

test("the first bend retains material length and joins its flat panels continuously",()=>{
  const stage=sheetStages()[0],a=stage.halfBandM,eps=1e-9;
  for(const progress of [.15,.5,1]){
    for(const seam of [-a,a]){
      const before=sheetPoint(seam-eps,0,0,progress);
      const after=sheetPoint(seam+eps,0,0,progress);
      assert.ok(distance(before,after)<3*eps);
    }
    const left=sheetPoint(-a/2-eps,0,0,progress);
    const right=sheetPoint(-a/2+eps,0,0,progress);
    near(distance(left,right)/(2*eps),1,1e-5);
  }
  const closedLeft=sheetPoint(-DEFAULTS.widthM/3,0,0,1);
  const closedRight=sheetPoint(DEFAULTS.widthM/3,0,0,1);
  assert.ok(closedRight.z-closedLeft.z>=DEFAULTS.thicknessM);
});

test("one connected UV sheet survives all kinematic stages",()=>{
  const limit=sheetLimit();
  assert.equal(limit,6);
  for(let n=0;n<=limit;n++){
    const mesh=sheetMesh(n,0);
    assert.equal(mesh.sheetId,SHEET_ID);
    near(mesh.materialAreaM2,DEFAULTS.widthM*DEFAULTS.heightM,1e-12);
    assert.equal(mesh.vertices.length,mesh.u.length*mesh.v.length);
    assert.equal(mesh.faces.length,2*(mesh.u.length-1)*(mesh.v.length-1));
    assert.equal(new Set(mesh.vertices.map(v=>v.id)).size,mesh.vertices.length);
    assert.ok(mesh.vertices.every(v=>v.sheetId===SHEET_ID&&
      [v.u,v.v,v.x,v.y,v.z].every(Number.isFinite)));
    const edgeCount=new Map();
    for(const triangle of mesh.faces) for(const [a,b] of [[0,1],[1,2],[2,0]]){
      const key=[triangle[a],triangle[b]].sort((x,y)=>x-y).join(":");
      edgeCount.set(key,(edgeCount.get(key)||0)+1);
    }
    assert.ok([...edgeCount.values()].every(count=>count===1||count===2));
    const boundary=[...edgeCount.values()].filter(count=>count===1).length;
    assert.equal(boundary,2*(mesh.u.length-1)+2*(mesh.v.length-1));
  }
});

test("M17 keeps its original material address through view changes and replay",()=>{
  const u=DEFAULTS.widthM*.34,v=DEFAULTS.heightM*.25;
  const start=sheetPoint(u,v,0,0);
  near(start.x,u);near(start.y,v);near(start.z,0);
  const middle=sheetPoint(u,v,1,.5);
  const complete=sheetPoint(u,v,2,0);
  for(const point of [middle,complete]){
    assert.equal(point.sheetId,SHEET_ID);near(point.u,u);near(point.v,v);
  }
  const reset=sheetPoint(u,v,0,0);
  assert.deepEqual(reset,start);
});

test("the first non-fitting packet fold is a declared boundary",()=>{
  const stages=sheetStages();
  assert.ok(stages.slice(0,-1).every(stage=>stage.room));
  assert.equal(stages.at(-1).room,false);
  assert.ok(stages.at(-1).spanM<2*stages.at(-1).halfBandM);
  assert.throws(()=>sheetMesh(sheetLimit()+1),RangeError);
  assert.throws(()=>sheetPoint(0,0,sheetLimit(),.5),RangeError);
});
