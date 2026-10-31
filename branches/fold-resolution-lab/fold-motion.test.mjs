// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULTS, foldState} from "./model.js";
import {foldGate, foldPose, geometricStop, stackBox} from "./fold-motion.js";

const near = (a,b) => assert.ok(Math.abs(a-b) <= 1e-12 * Math.max(1,Math.abs(a),Math.abs(b)), `${a} != ${b}`);
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

test("a rigid panel turns through 180 degrees without changing its edge lengths", () => {
  for (const n of [0,1,4,6]) {
    const start=foldPose(n,0), half=foldPose(n,0.5), end=foldPose(n,1);
    for (const [a,b] of [[0,1],[1,2],[0,4],[0,6]]) {
      near(dist(start.rotatingPanel[a],start.rotatingPanel[b]),dist(half.rotatingPanel[a],half.rotatingPanel[b]));
      near(dist(start.rotatingPanel[a],start.rotatingPanel[b]),dist(end.rotatingPanel[a],end.rotatingPanel[b]));
    }
    const next=stackBox(n+1);
    const all=[...end.staticPanel,...end.rotatingPanel];
    const bounds=key=>[Math.min(...all.map(p=>p[key])),Math.max(...all.map(p=>p[key]))];
    for (const key of ["x","y","z"]) {
      near(bounds(key)[0],Math.min(...next.map(p=>p[key])));
      near(bounds(key)[1],Math.max(...next.map(p=>p[key])));
    }
  }
});

test("the material gate is computed from declared dimensions, not a magic fold count", () => {
  const stop=geometricStop();
  assert.equal(stop,7);
  assert.equal(foldGate(stop-1).geometricRoom,true);
  assert.equal(foldGate(stop).geometricRoom,false);
  const thin={...DEFAULTS,thicknessM:DEFAULTS.thicknessM/10};
  assert.ok(geometricStop(thin)>stop);
  near(foldGate(7).outerArcM,Math.PI*(foldState(7).stack.thicknessM+DEFAULTS.thicknessM/2));
});

test("formal 111-fold extent remains finite and is far outside the material gate", () => {
  const state=foldState(111);
  assert.ok(Number.isFinite(state.stack.thicknessM));
  assert.ok(state.stack.thicknessM>1e28);
  assert.equal(stackBox(111).length,8);
  assert.equal(foldGate(111).geometricRoom,false);
});

test("invalid motion input is rejected", () => {
  for (const p of [-0.1,1.1,NaN,Infinity]) assert.throws(()=>foldPose(0,p),RangeError);
});
