// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createHash } from "node:crypto";
import * as model from "./model.mjs";

const bytes = readFileSync(new URL("fragment.html", import.meta.url));
const text = bytes.toString("utf8");
const section = text.split("/* ENDECK_MODEL_START */")[1]?.split("/* ENDECK_MODEL_END */")[0];
assert.ok(section, "The tested model must be the delivered fragment's model");
const legacy = runInNewContext(`(()=>{${section};return{source,observeXY,distinct,project};})()`);
const plain = (value) => JSON.parse(JSON.stringify(value));

test("equal flat observations admit different three-dimensional sources", () => {
  const a = model.source("projection", 1), b = model.source("shrink", 1);
  assert.deepEqual(plain(model.observeXY(a)), plain(model.observeXY(b)));
  assert.equal(model.distinct(a, ["x", "y", "z"]), 4);
  assert.equal(model.distinct(b, ["x", "y", "z"]), 1);
  assert.notDeepEqual(plain(a), plain(b));
});
test("uniform scaling retains four locations at every tested positive scale", () => {
  for (const t of [0, 0.1, 1/3, 0.75, 0.999999, 1-Number.EPSILON])
    assert.equal(model.distinct(model.source("shrink", t), ["x", "y", "z"]), 4);
  assert.equal(model.distinct(model.source("shrink", 1), ["x", "y", "z"]), 1);
});
test("sequential coalescence gives 4, 3, 2, 1 places while retaining four IDs", () => {
  for (const [t, n] of [[0,4], [1/3,3], [2/3,2], [1,1]]) {
    const points = model.source("merge", t);
    assert.equal(model.distinct(points, ["x", "y", "z"]), n);
    assert.deepEqual(plain(points.map((p) => p.id)), ["A", "B", "C", "D"]);
  }
});
test("equal stored endpoints admit different intermediate paths", () => {
  for (const t of [0,1])
    assert.deepEqual(plain(model.source("history", t, "straight")), plain(model.source("history", t, "arc")));
  assert.notDeepEqual(plain(model.source("history", 0.5, "straight")), plain(model.source("history", 0.5, "arc")));
});
test("a side view separates the projected endpoint and preserves identities", () => {
  const points = model.source("projection", 1);
  assert.equal(model.distinct(points.map((p) => model.project(p, 0)), ["x", "y"]), 1);
  const side = points.map((p) => model.project(p, 64));
  assert.equal(model.distinct(side, ["x", "y"]), 4);
  assert.deepEqual(plain(side.map((p) => p.id)), ["A", "B", "C", "D"]);
});
test("all four trajectories are finite at 3,001 declared model times", () => {
  for (const mode of ["projection", "shrink", "merge", "history"])
    for (let i = 0; i <= 3000; i++) {
      const points = model.source(mode, i/3000);
      assert.equal(points.length, 4);
      for (const p of points) assert.ok([p.x,p.y,p.z].every(Number.isFinite));
    }
});
test("unknown modes, invalid times, paths and view inputs reject", () => {
  for (const t of [-0.1,1.1,NaN,Infinity]) assert.throws(() => model.source("projection", t), /Invalid/);
  assert.throws(() => model.source("unknown", 0.5), /Invalid/);
  assert.throws(() => model.source("history", 0.5, "unknown"), /Invalid/);
  assert.throws(() => model.project({x:0,y:0,z:NaN}, 0), /Invalid/);
  assert.throws(() => model.project({x:0,y:0,z:0}, 100), /Invalid/);
});
test("the native page preserves its predecessor and directly loads the tested model", () => {
  const source = JSON.parse(readFileSync(new URL("SOURCE.json", import.meta.url), "utf8"));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), source.fragment.sha256);
  for(const entry of source.activeRuntime){
    const actual=readFileSync(new URL(entry.path,import.meta.url));
    assert.equal(actual.length,entry.bytes);
    assert.equal(createHash("sha256").update(actual).digest("hex"),entry.sha256);
  }
  const page = readFileSync(new URL("index.html", import.meta.url), "utf8");
  assert.doesNotMatch(page, /<iframe\b/);
  assert.match(page, /type="module" src="view.mjs"/);
  assert.match(readFileSync(new URL("view.mjs",import.meta.url),"utf8"), /from "\.\/model.mjs"/);
  assert.doesNotMatch(page, /(?:\bsrc|\bhref)=(?:"|&quot;)https:\/\/(?:unpkg|cdn|esm)/);
  assert.match(page, /connect-src (?:'|&#x27;)none(?:'|&#x27;)/);
});

test("native geometry and retained predecessor agree across both candidate paths",()=>{
  for(const mode of model.MODES) for(const path of ["straight","arc"]) for(const t of [0,.1,1/3,.5,2/3,.999999,1])
    assert.deepEqual(model.source(mode,t,path).map(p=>[p.id,p.x,p.y,p.z]),Array.from(legacy.source(mode,t,path),p=>[p.id,p.x,p.y,p.z]));
});
