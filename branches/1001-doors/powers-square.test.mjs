// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import {
  powerState,
  rasterIndex,
  cube512,
  cube512Index,
  letterSum,
  numeral36,
  namePath,
  sunComparison,
  POWER_CASES,
} from "./powers-square.mjs";
import { door } from "./model.mjs";

test("all 1792 binary states have distinct exact patterns and reversible 2D addresses", () => {
  let count = 0;
  for (const width of [8, 9, 10]) {
    const patterns = new Set();
    for (let index = 0; index < 2 ** width; index++) {
      const s = powerState(width, index);
      assert.equal(s.bits.length, width);
      assert.equal(Number.parseInt(s.bits, 2), index);
      assert.equal(rasterIndex(width, s.x, s.y), index);
      assert.equal(s.rows * s.columns, 2 ** width);
      assert.equal(s.countBinary, "1" + "0".repeat(width));
      assert.equal(s.countBitLength, width + 1);
      patterns.add(s.bits);
      count++;
    }
    assert.equal(patterns.size, 2 ** width);
  }
  assert.equal(count, 1792);
  for (let index = 0; index < 512; index++) {
    const xyz = cube512(index);
    assert.equal(cube512Index(xyz), index);
    assert.deepEqual(xyz, {
      x: index % 8,
      y: Math.floor(index / 8) % 8,
      z: Math.floor(index / 64),
    });
  }
});

test("historical name values are bound to exact letters and sums lose name order", () => {
  assert.deepEqual(letterSum("נכיאל").values, [50, 20, 10, 1, 30]);
  assert.equal(letterSum("נכיאל").sum, 111);
  assert.deepEqual(letterSum("סורת").values, [60, 6, 200, 400]);
  assert.equal(letterSum("סורת").sum, 666);
  assert.equal(letterSum("אב").sum, letterSum("בא").sum);
  assert.notEqual(letterSum("אב").text, letterSum("בא").text);
  for (let n = 1; n <= 36; n++) {
    assert.equal(letterSum(numeral36(n)).sum, n);
    assert.equal(letterSum(numeral36(n, "ADDITIVE_DEMO")).sum, n);
  }
  assert.equal(numeral36(15), "טו");
  assert.equal(numeral36(16), "טז");
  assert.equal(numeral36(15, "ADDITIVE_DEMO"), "יה");
});

test("declared path reduction retains originals and resolves to actual source-grid cells", () => {
  const n = namePath("NACHIEL"),
    s = namePath("SORATH");
  assert.deepEqual(
    n.cells.map((x) => x.reduced),
    [5, 20, 10, 1, 30],
  );
  assert.deepEqual(
    s.cells.map((x) => x.reduced),
    [6, 6, 20, 4],
  );
  const table = [
    [6, 32, 3, 34, 35, 1],
    [7, 11, 27, 28, 8, 30],
    [19, 14, 16, 15, 23, 24],
    [18, 20, 22, 21, 17, 13],
    [25, 29, 10, 9, 26, 12],
    [36, 5, 33, 4, 2, 31],
  ];
  for (const path of [n, s]) {
    assert.deepEqual(
      path.cells.map((x) => x.original),
      path.values,
    );
    for (const cell of path.cells)
      assert.equal(table[cell.y][cell.x], cell.reduced);
    assert.equal(
      path.evidence,
      "HISTORICAL_NAME_AND_SUM_WITH_DECLARED_MODERN_PATH_MODEL",
    );
  }
  assert.equal(s.cells[0].reduced, s.cells[1].reduced);
});

test("square arithmetic, script rendering and puzzle constraints remain separate", () => {
  const s = sunComparison();
  assert.equal(s.square.magic, true);
  assert.deepEqual(s.square.rows, Array(6).fill(111));
  assert.deepEqual(s.square.columns, Array(6).fill(111));
  assert.deepEqual(s.square.diagonals, [111, 111]);
  assert.equal(s.square.total, 666);
  assert.equal(s.sudoku.matches, false);
  assert.equal(s.modernHebrew.length, 6);
  assert.equal(s.sourceTranscription, "NOT_CLAIMED_PIXEL_EXACT");
});

test("extra 1024 research preserves the 1001-entry registry contract; invalid inputs fail explicitly", () => {
  assert.deepEqual(
    POWER_CASES.map((x) => x.number),
    [256, 512, 1024],
  );
  assert.equal(door(1000).number, 1000);
  assert.throws(() => door(1024));
  for (const width of [7, 11, "8", null])
    assert.throws(() => powerState(width, 0));
  for (const value of [-1, -0, 256, 1.5, NaN, "1"])
    assert.throws(() => powerState(8, value));
  assert.throws(() => rasterIndex(8, 16, 0));
  assert.throws(() => rasterIndex(8, 0, 16));
  assert.throws(() => cube512(512));
  assert.throws(() => cube512Index({ x: 8, y: 0, z: 0 }));
  for (const text of ["", "Nachiel", "נכיאל ", "א׳", "א".repeat(65), null])
    assert.throws(() => letterSum(text));
  for (const n of [0, 37, 1.5, "15"]) assert.throws(() => numeral36(n));
  assert.throws(() => numeral36(15, "AUTO"));
  assert.throws(() => namePath("UNKNOWN"));
});
