// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import { observe, SOURCE_POINTS, VIEWS } from "./geometry.mjs";
test("four declared projections preserve the exact point identity set", () => {
  for (const view of VIEWS) {
    const out = observe(SOURCE_POINTS, view);
    assert.deepEqual(
      out.map((p) => p.id),
      SOURCE_POINTS.map((p) => p.id),
    );
    for (const [i, p] of out.entries()) {
      const s = SOURCE_POINTS[i];
      if (view === "top")
        assert.deepEqual([p.u, p.v, p.depth], [s.x, s.y, s.z]);
      if (view === "front")
        assert.deepEqual([p.u, p.v, p.depth], [s.x, s.z, s.y]);
      if (view === "side")
        assert.deepEqual([p.u, p.v, p.depth], [s.y, s.z, s.x]);
    }
  }
});
test("coordinates remain immutable and duplicate IDs fail", () => {
  const before = JSON.stringify(SOURCE_POINTS);
  observe(SOURCE_POINTS, "perspective");
  assert.equal(JSON.stringify(SOURCE_POINTS), before);
  assert.throws(() => observe([SOURCE_POINTS[0], SOURCE_POINTS[0]], "top"));
  assert.throws(() => observe(SOURCE_POINTS, "unknown"));
});
