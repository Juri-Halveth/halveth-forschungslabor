// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import {
  SUN_SQUARE,
  inspectSquare,
  encodeDNA3,
  decodeBits6,
  GOLDEN_ANGLE,
  spiralPoints,
  completePairs,
  RESEARCH_CASES,
  RESEARCH_SOURCES,
} from "./number-research.mjs";

test("historical Sun table satisfies normal magic-square invariants, with corrupt controls", () => {
  const result = inspectSquare(SUN_SQUARE);
  assert.equal(result.magic, true);
  assert.equal(result.total, (36 * 37) / 2);
  assert.deepEqual(result.rows, [111, 111, 111, 111, 111, 111]);
  assert.deepEqual(result.columns, [111, 111, 111, 111, 111, 111]);
  assert.deepEqual(result.diagonals, [111, 111]);
  const duplicate = Array.from({ length: 6 }, () => Array(6).fill(18.5));
  assert.throws(() => inspectSquare(duplicate), TypeError);
  assert.equal(
    inspectSquare(Array.from({ length: 6 }, () => Array(6).fill(1))).magic,
    false,
  );
  const changed = SUN_SQUARE.map((r) => [...r]);
  changed[0][0]++;
  assert.equal(inspectSquare(changed).magic, false);
  assert.throws(() => inspectSquare([[1, 2], [3]]), TypeError);
  assert.throws(() => inspectSquare(Array(6)), TypeError);
  assert.throws(() => inspectSquare([Array(2), [1, 2]]), TypeError);
});

test("every DNA triple has exactly one six-bit representation and survives both roundtrips", () => {
  const observed = new Set();
  for (const a of "ACGT")
    for (const b of "ACGT")
      for (const c of "ACGT") {
        const dna = a + b + c,
          bits = encodeDNA3(dna);
        assert.equal(decodeBits6(bits), dna);
        observed.add(bits);
      }
  assert.equal(observed.size, 64);
  for (let i = 0; i < 64; i++) {
    const bits = i.toString(2).padStart(6, "0");
    assert.ok(observed.has(bits));
    assert.equal(encodeDNA3(decodeBits6(bits)), bits);
  }
  assert.equal(encodeDNA3("ACT"), "000111");
  for (const value of ["act", "ACU", "AAAA", " AC", null])
    assert.throws(() => encodeDNA3(value), TypeError);
  for (const value of ["101", "0000000", "000002", 0])
    assert.throws(() => decodeBits6(value), TypeError);
});

test("finite geometric model distinguishes irrational-angle placement from eight-step directional repetition", () => {
  assert.ok(Math.abs(GOLDEN_ANGLE - 137.50776405003785) < 1e-10);
  const points = spiralPoints(360, 135);
  const theta = (p) => Math.atan2(p.y, p.x);
  assert.ok(Math.abs(theta(points[1]) - theta(points[9])) < 1e-12);
  const golden = spiralPoints(360);
  assert.ok(Math.abs(theta(golden[1]) - theta(golden[9])) > 0.01);
  for (const p of golden)
    assert.ok(
      Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        Math.hypot(p.x, p.y) <= 1 + 1e-12,
    );
  assert.deepEqual(spiralPoints(1), [{ index: 0, x: 0, y: 0 }]);
  for (const args of [[0], [1001], [3, NaN], [3, 360]])
    assert.throws(() => spiralPoints(...args), RangeError);
});

test("eight-node graph has every unordered pair once; adjacent-only coverage is incomplete", () => {
  const pairs = completePairs(8),
    observed = new Set(pairs.map(([a, b]) => `${a}:${b}`));
  assert.equal(observed.size, 28);
  for (let a = 0; a < 8; a++)
    for (let b = a + 1; b < 8; b++) assert.ok(observed.has(`${a}:${b}`));
  assert.equal(pairs.filter(([a, b]) => b === a + 1).length, 7);
  assert.ok(observed.has("0:7"));
});

test("seven bounded research records resolve their own source references and retain limits", () => {
  assert.deepEqual(
    RESEARCH_CASES.map((r) => r.number),
    [3, 6, 28, 55, 64, 137, 666],
  );
  assert.equal(new Set(RESEARCH_CASES.map((r) => r.id)).size, 7);
  for (const record of RESEARCH_CASES) {
    assert.ok(record.limit.length > 30 && record.nextTest.length > 30);
    for (const claim of record.claims)
      for (const id of claim.sources) {
        assert.ok(RESEARCH_SOURCES[id]);
        assert.equal(new URL(RESEARCH_SOURCES[id].url).protocol, "https:");
      }
  }
});
