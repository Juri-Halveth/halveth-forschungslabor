// SPDX-License-Identifier: MIT
import assert from "node:assert/strict";
import test from "node:test";
import { analyzeThresholds, analyzeFrameAtThreshold, crossingCandidates, projectCandidate, buildNetworkCandidatePacket } from "./model.mjs";
import { FIXTURES } from "./fixtures.mjs";
import { toLucinetObservation } from "./adapter.mjs";

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

test("reusable packet binds observed motif and labels both 3D alternatives as illustrations", () => {
  const packet = buildNetworkCandidatePacket(FIXTURES[0].frame, [80, 120]);
  assert.equal(packet.schema, "halveth.network-candidate.v2");
  assert.equal(packet.candidateStatus, "OPEN_ILLUSTRATIONS_FOR_PIXEL_MOTIF");
  assert.deepEqual(packet.observations[0].fourArmPixels, [{ x: 4, y: 4 }]);
  assert.deepEqual(packet.observations[1].fourArmPixels, []);
  assert.equal(packet.observations[0].evidenceClass, "DECODED_FRAME_MEASUREMENT");
  assert.deepEqual(packet.candidates.map((item) => item.id), ["JUNCTION", "OVERPASS"]);
  assert.ok(packet.candidates.every((item) => item.evidenceClass === "SYNTHETIC_ILLUSTRATION"));
  assert.deepEqual(packet.candidates[0].illustratedAt, { threshold: 80, x: 4, y: 4 });
  assert.deepEqual(packet.candidates[0].topProjection, packet.candidates[1].topProjection);
  assert.notDeepEqual(packet.candidates[0].tiltedProjection, packet.candidates[1].tiltedProjection);
  assert.equal(packet.source.frameSha256, packet.observations[0].sourceFrameSha256);
});

test("same image supports both declared synthetic sources; filaments create no crossing candidates", () => {
  const [junction, overpass, filaments] = FIXTURES;
  assert.deepEqual(junction.frame, overpass.frame);
  assert.notEqual(junction.sourceModel, overpass.sourceModel);
  const a = buildNetworkCandidatePacket(junction.frame, [80]);
  const b = buildNetworkCandidatePacket(overpass.frame, [80]);
  assert.equal(a.source.frameSha256, b.source.frameSha256);
  assert.deepEqual(a.candidates, b.candidates);
  const c = buildNetworkCandidatePacket(filaments.frame, [80]);
  assert.equal(c.candidateStatus, "NO_FOUR_ARM_PIXEL_MOTIF");
  assert.deepEqual(c.candidates, []);
  assert.equal(c.discriminator, null);
  assert.equal(c.observations[0].components, 3);
});

test("a solid block is not mislabeled as the narrow four-arm pixel motif", () => {
  const block = { width: 3, height: 3, pixels: Array(9).fill(220) };
  assert.deepEqual(analyzeFrameAtThreshold(block, 100).fourArmPixels, []);
  assert.deepEqual(buildNetworkCandidatePacket(block, [100]).candidates, []);
});

test("data-only LUCINET bridge keeps observed motifs and illustrated 3D models distinct", () => {
  const a = toLucinetObservation(buildNetworkCandidatePacket(FIXTURES[0].frame, [80]));
  assert.equal(a.schema, "lucinet.network-observation.v1");
  assert.deepEqual(a.motifs, [{ threshold: 80, x: 4, y: 4 }]);
  assert.deepEqual(a.candidateModels.map((item) => item.evidenceClass),
    ["SYNTHETIC_ILLUSTRATION", "SYNTHETIC_ILLUSTRATION"]);
  assert.equal(a.decision, "UNRESOLVED");
  const c = toLucinetObservation(buildNetworkCandidatePacket(FIXTURES[2].frame, [80]));
  assert.deepEqual(c.candidateModels, []);
  assert.equal(c.decision, "NO_MATCH_FOR_DECLARED_MOTIF_RULE");
  assert.throws(() => toLucinetObservation({ ...buildNetworkCandidatePacket(FIXTURES[0].frame, [80]),
    candidates: [{ id: "JUNCTION", evidenceClass: "MEASURED_3D" }] }), TypeError);
});

test("invalid data cannot silently create a graph claim", () => {
  assert.throws(() => analyzeThresholds({ width: 2, height: 2, pixels: [0, 1] }, [100]), RangeError);
  assert.throws(() => analyzeThresholds({ width: 1, height: 1, pixels: [300] }, [100]), RangeError);
  assert.throws(() => analyzeThresholds({ width: 1, height: 1, pixels: [0] }, [-1]), RangeError);
  assert.throws(() => crossingCandidates(0), RangeError);
  assert.throws(() => projectCandidate(crossingCandidates()[0], 120), RangeError);
});
