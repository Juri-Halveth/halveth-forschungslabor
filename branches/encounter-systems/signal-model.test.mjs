// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import {
  experiment,
  transmit,
  decode,
  pattern,
  SAMPLES,
} from "./signal-model.mjs";

for (const name of ["window", "pulse"]) {
  test(
    name +
      ": exact recovery, confident wrong mapping, and missing coupling are distinct",
    () => {
      const source = pattern(name);
      const good = experiment(source);
      assert.equal(good.correct, 64);
      assert.deepEqual(good.decoded.bits, source);
      const inverted = experiment(source, { mode: "inverted" });
      assert.deepEqual(inverted.received, good.received);
      assert.equal(inverted.wrong, 64);
      assert.equal(inverted.unknown, 0);
      assert.equal(experiment(source, { mode: "detuned" }).unknown, 64);
      const cut = experiment(source, { connected: false, noise: 8 });
      assert.ok(cut.received.every((x) => x === 0));
      assert.equal(cut.unknown, 64);
    },
  );
}
test("same seed reproduces noise; receiver has no source-bit argument", () => {
  const a = experiment(pattern("window"), { noise: 4, seed: 917 });
  const b = experiment(pattern("window"), { noise: 4, seed: 917 });
  const c = experiment(pattern("window"), { noise: 4, seed: 918 });
  assert.deepEqual(a.received, b.received);
  assert.notDeepEqual(a.received, c.received);
  assert.equal(a.correct + a.wrong + a.unknown, 64);
  assert.notDeepEqual(a.received, a.sent);
  assert.deepEqual(decode(a.received).bits, a.decoded.bits);
  assert.ok(
    decode(new Float64Array(64 * SAMPLES)).bits.every((x) => x === null),
  );
});
test("a changed source pixel affects only its symbol block", () => {
  const source = pattern("pulse"),
    changed = [...source];
  changed[19] ^= 1;
  const a = transmit(source),
    b = transmit(changed);
  for (let i = 0; i < a.length; i++) {
    if (Math.floor(i / SAMPLES) !== 19) assert.equal(a[i], b[i]);
  }
  assert.notDeepEqual(
    a.slice(19 * SAMPLES, 20 * SAMPLES),
    b.slice(19 * SAMPLES, 20 * SAMPLES),
  );
});
test("invalid values and undeclared configurations are rejected", () => {
  for (const bits of [
    [],
    new Array(64),
    Array(64).fill(2),
    Array(64).fill(null),
  ])
    assert.throws(() => transmit(bits));
  for (const options of [
    null,
    2,
    true,
    [],
    new Date(0),
    { mode: "neural" },
    { noise: -1 },
    { noise: NaN },
    { noise: 9 },
    { seed: 0 },
    { connected: "yes" },
    { hidden: true },
  ])
    assert.throws(() => experiment(pattern("window"), options));
});
