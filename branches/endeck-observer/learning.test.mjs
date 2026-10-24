// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import { source, distinct, MODES } from "./model.mjs";
import { LESSONS, recordAnswer, decodeProgress, encodeProgress } from "./learning.mjs";
import { chartPoint, groupProjection, placeLabels } from "./geometry.mjs";

test("wrong answers never award completion; correct answers are idempotent",()=>{
  let done=[];
  for(const mode of MODES){
    const lesson=LESSONS[mode], wrong=lesson.options.find(([id])=>id!==lesson.correct)[0];
    assert.deepEqual(recordAnswer(done,mode,wrong).completed,done);
    const next=recordAnswer(done,mode,lesson.correct);assert.equal(next.correct,true);
    assert.equal(next.completed.length,done.length+1);
    assert.deepEqual(recordAnswer(next.completed,mode,lesson.correct).completed,next.completed);
    done=next.completed;
  }
  assert.deepEqual(done,MODES);
});
test("lesson answers correspond to actual model counterexamples",()=>{
  assert.equal(distinct(source("projection",1),["x","y","z"]),4);
  assert.equal(source("shrink",1).length,4);
  assert.equal(distinct(source("merge",2/3),["x","y","z"]),2);
  for(const t of [0,1])assert.deepEqual(source("history",t,"straight"),source("history",t,"arc"));
  assert.notDeepEqual(source("history",.5,"straight"),source("history",.5,"arc"));
});
test("bounded progress roundtrips and invalid records cannot inflate a score",()=>{
  assert.deepEqual(decodeProgress(null),[]);
  assert.deepEqual(decodeProgress(encodeProgress(["history","projection"])),["projection","history"]);
  for(const input of ['null','{}','[]','{"schema":"endeck.learning.v1","completed":["invented"]}','{"schema":"endeck.learning.v1","completed":["history","history"]}',JSON.stringify({schema:"endeck.learning.v1",completed:[],extra:true}),"x".repeat(1025)])assert.throws(()=>decodeProgress(input));
  assert.throws(()=>recordAnswer([],"unknown","four"));
  assert.throws(()=>recordAnswer([],"projection","invented"));
});
test("labels remain inside the chart and separate across widths, paths and near mergers",()=>{
  for(const width of [210,246,286,480,700]) for(const tilt of [0,32,64]) for(const mode of MODES) for(const path of ["straight","arc"]) for(const t of [0,.1,.32,1/3,.5,.666,2/3,.9,.99999,1]){
    const points=source(mode,t,path), groups=groupProjection(points,tilt), labels=placeLabels(groups,width,250,tilt);
    assert.equal(labels.length,groups.length);
    for(const label of labels){
      assert.ok(label.x>=0&&label.x+label.width<=width);
      assert.ok(label.y>=0&&label.y+label.height<=250);
      assert.ok(Number.isFinite(chartPoint(groups[0][0],width,250,tilt).x));
    }
    for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
      const a=labels[i],b=labels[j];
      assert.ok(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y),[width,tilt,mode,t]);
    }
  }
});
