// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import { IDs, MODES, source } from "./model.mjs";
import { axisLabels, chartPoint, groupProjection, placeLabels } from "./geometry.mjs";

function separated(a, b) {
  return !(a.x < b.x+b.width+5 && a.x+a.width+5 > b.x &&
    a.y < b.y+b.height+5 && a.y+a.height+5 > b.y);
}

function checkLayout(mode, t, tilt, width, height, path = "straight") {
  const groups = groupProjection(source(mode, t, path), tilt);
  const labels = placeLabels(groups, width, height, tilt);
  assert.equal(labels.length, groups.length);
  assert.deepEqual(labels.flatMap(label => label.text.split(" · ")).sort(), [...IDs]);
  const occupied = axisLabels(width, height, tilt).map(label => ({
    x: label.x, y: label.y-12, width: 8, height: 15,
  }));
  for (const [i, label] of labels.entries()) {
    assert.equal(label.text, groups[i].map(point => point.id).join(" · "));
    assert.deepEqual(label.point, chartPoint(groups[i][0], width, height, tilt));
    assert.ok([label.x, label.y, label.width, label.height, label.baseline].every(Number.isFinite));
    assert.ok(label.x >= 12 && label.x+label.width <= width-12);
    assert.ok(label.y >= 11 && label.y+label.height <= height-10);
    // Keep the existing readable character size and spacing contract.
    assert.equal(label.width, label.text.length*8);
    assert.equal(label.height, 17);
    for (const other of occupied) assert.ok(separated(label, other),
      JSON.stringify({mode, t, tilt, width, height, label, other}));
    occupied.push(label);
  }
  assert.deepEqual(placeLabels(groups, width, height, tilt), labels, "deterministic fallback");
  return labels;
}

test("F01: t=.86 at 45-48 degrees keeps all four readable identities", () => {
  for (const [width, height] of [[246,250], [180,180], [210,250], [286,250], [480,320]])
    for (const tilt of [45,46,47,48]) checkLayout("projection", .86, tilt, width, height);
});

test("finite mobile and healthy layouts cover modes, paths, mergers and camera angles", () => {
  for (const [width, height] of [[180,180], [210,200], [246,250], [286,250], [480,320], [700,480]])
    for (const mode of MODES) for (const path of ["straight", "arc"])
      for (const t of [0,.1,1/3,.5,2/3,.85,.86,.87,.9,.99999,1])
        for (const tilt of [0,16,32,45,46,47,48,64,80])
          checkLayout(mode, t, tilt, width, height, path);
});

test("the preferred healthy layout remains unchanged", () => {
  const labels = checkLayout("projection", 0, 0, 480, 320);
  const points = source("projection", 0).map(point => chartPoint(point, 480, 320, 0));
  for (let i = 0; i < labels.length; i++) {
    assert.equal(labels[i].x, points[i].x+16);
    assert.equal(labels[i].baseline, points[i].y-10);
  }
});

test("invalid chart and camera inputs still surface errors", () => {
  const groups = groupProjection(source("projection", .86), 46);
  for (const size of [0,179,NaN,Infinity])
    assert.throws(() => placeLabels(groups, size, 250, 46), /Invalid chart size/);
  assert.throws(() => placeLabels(groups, 246, 250, 81), /Invalid view input/);
});
