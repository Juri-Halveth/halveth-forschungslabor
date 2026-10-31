// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULTS, PLANCK_LENGTH_M, firstIntegerCrossing, foldState, inspectionQuestions} from "./model.js";

test("one ideal fold halves footprint area and doubles stack thickness", () => {
  const zero = foldState(0), one = foldState(1);
  assert.equal(one.stack.footprintAreaM2, zero.stack.footprintAreaM2 / 2);
  assert.equal(one.stack.thicknessM, zero.stack.thicknessM * 2);
  assert.equal(one.stack.widthHalvings + one.stack.heightHalvings, 1);
});

test("stacking conserves ideal volume while isotropic compression does not", () => {
  for (const n of [0, 7, 32, 96, 114, 228, 240]) {
    const state = foldState(n);
    assert.ok(Math.abs(state.stack.volumeM3 / state.stack.initialVolumeM3 - 1) < 1e-12);
    assert.ok(state.stack.boundingRadiusM > state.comparison.schwarzschildRadiusM);
    assert.equal(state.stack.widthHalvings + state.stack.heightHalvings, n);
  }
  assert.equal(foldState(1).compression.radiusM, DEFAULTS.compressionRadiusM / 2);
  assert.ok(Math.abs(foldState(1).compression.densityKgM3 / foldState(0).compression.densityKgM3 - 8) < 1e-12);
});

test("the attachment's approximate fold thresholds are calculated with declared operators", () => {
  const state = foldState(96);
  assert.equal(state.comparison.firstSchwarzschildFold, 96);
  assert.equal(state.comparison.firstPlanckFold, 114);
  assert.equal(foldState(95).compression.radiusBelowSchwarzschild, false);
  assert.equal(state.compression.radiusBelowSchwarzschild, true);
  assert.ok(foldState(114).compression.radiusM <= PLANCK_LENGTH_M);
  assert.ok(foldState(113).compression.radiusM > PLANCK_LENGTH_M);
});

test("half area is not half each edge for a sheet", () => {
  const one = foldState(1);
  const quarterArea = DEFAULTS.widthM * DEFAULTS.heightM / 4;
  assert.notEqual(one.stack.footprintAreaM2, quarterArea);
  assert.equal(one.stack.heightM, DEFAULTS.heightM);
});

test("invalid folds and inputs fail, and inspection steps keep a reopen condition", () => {
  for (const n of [-1, 1.5, 241, NaN]) assert.throws(() => foldState(n), RangeError);
  assert.throws(() => foldState(1, {...DEFAULTS, massKg: 0}), RangeError);
  assert.throws(() => firstIntegerCrossing(0, 1), RangeError);
  for (const item of Object.values(inspectionQuestions))
    assert.ok(item.question && item.resolution && item.reentry);
});
