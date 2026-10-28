// SPDX-License-Identifier: MIT
import assert from "node:assert/strict";
import test from "node:test";
import { analyzeThresholds, crossingCandidates, projectCandidate, buildNetworkCandidatePacket } from "./model.mjs";

test("a faint bridge changes the observed component count across thresholds", () => {
  const frame = { width: 5, height: 3, pixels: [
    0, 0, 0, 0, 0,
    220, 220, 80, 220, 220,
    0, 0, 0, 0, 0
  ] };
  assert.deepEqual(analyzeThresholds(frame, [80, 100]).map(({ brightPixels, components, largestPixels }) =>
    ({ brightPixels, components, largestPixels })), [
    { brightPixels: 5, components: 1, largestPixels: 5 },
    { brightPixels: 4, components: 2, largestPixels: 2 }
  ]);
});

test("one image projection accepts a junction and a depth-separated crossing", () => {
  const [junction, overpass] = crossingCandidates();
  assert.deepEqual(projectCandidate(junction, 0).segments2d, projectCandidate(overpass, 0).segments2d);
  assert.notDeepEqual(projectCandidate(junction, 60).segments2d, projectCandidate(overpass, 60).segments2d);
  assert.equal(junction.connectedAtCrossing, true);
  assert.equal(overpass.connectedAtCrossing, false);
});

test("pixel digest binds dimensions and values while thresholds share one source", () => {
  const frame = { width: 2, height: 1, pixels: [80, 120] };
  const [a, b] = analyzeThresholds(frame, [80, 100]);
  assert.equal(a.sourceFrameSha256, b.sourceFrameSha256);
  assert.notEqual(a.sourceFrameSha256,
    analyzeThresholds({ width: 1, height: 2, pixels: [80, 120] }, [80])[0].sourceFrameSha256);
  assert.notEqual(a.sourceFrameSha256,
    analyzeThresholds({ width: 2, height: 1, pixels: [80, 121] }, [80])[0].sourceFrameSha256);
});

test("reusable packet keeps both alternatives open", () => {
  const packet = buildNetworkCandidatePacket({ width: 2, height: 1, pixels: [80, 120] }, [80, 100]);
  assert.equal(packet.schema, "halveth.network-candidate.v1");
  assert.equal(packet.candidateStatus, "OPEN");
  assert.deepEqual(packet.candidates.map((item) => item.id), ["JUNCTION", "OVERPASS"]);
  assert.deepEqual(packet.candidates[0].topProjection, packet.candidates[1].topProjection);
  assert.notDeepEqual(packet.candidates[0].tiltedProjection, packet.candidates[1].tiltedProjection);
  assert.equal(packet.source.frameSha256, packet.observations[0].sourceFrameSha256);
});

test("invalid data cannot silently create a graph claim", () => {
  assert.throws(() => analyzeThresholds({ width: 2, height: 2, pixels: [0, 1] }, [100]), RangeError);
  assert.throws(() => analyzeThresholds({ width: 1, height: 1, pixels: [300] }, [100]), RangeError);
  assert.throws(() => analyzeThresholds({ width: 1, height: 1, pixels: [0] }, [-1]), RangeError);
  assert.throws(() => crossingCandidates(0), RangeError);
  assert.throws(() => projectCandidate(crossingCandidates()[0], 120), RangeError);
});
