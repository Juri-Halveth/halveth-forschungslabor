// SPDX-License-Identifier: MIT
import { createHash } from "node:crypto";
import { assertFrame, analyzeFrameAtThreshold, crossingCandidates, projectCandidate } from "./model-core.mjs";
export { analyzeFrameAtThreshold, crossingCandidates, projectCandidate } from "./model-core.mjs";

export function analyzeThresholds(frame, thresholds) {
  assertFrame(frame);
  if (!Array.isArray(thresholds) || thresholds.length < 1 ||
      !thresholds.every((value) => Number.isInteger(value) && value >= 0 && value <= 255))
    throw new RangeError("Thresholds must be a nonempty array of 8-bit values");
  const header = Buffer.alloc(8);
  header.writeUInt32LE(frame.width, 0);
  header.writeUInt32LE(frame.height, 4);
  const sourceFrameSha256 = createHash("sha256").update(header)
    .update(Uint8Array.from(frame.pixels)).digest("hex");
  return thresholds.map((threshold) => ({
    sourceFrameSha256, width: frame.width, height: frame.height,
    evidenceClass: "DECODED_FRAME_MEASUREMENT",
    ...analyzeFrameAtThreshold(frame, threshold)
  }));
}

export function buildNetworkCandidatePacket(frame, thresholds, gap = 0.8) {
  const observations = analyzeThresholds(frame, thresholds);
  // Validate the model parameter even when the supplied frame has no motif.
  const illustrations = crossingCandidates(gap);
  const firstMotif = observations.flatMap(({ threshold, fourArmPixels }) =>
    fourArmPixels.map(({ x, y }) => ({ threshold, x, y })))[0] ?? null;
  return {
    schema: "halveth.network-candidate.v2",
    source: {
      type: "DECODED_GRAYSCALE_FRAME",
      frameSha256: observations[0].sourceFrameSha256,
      width: frame.width,
      height: frame.height
    },
    observations,
    candidateStatus: firstMotif ? "OPEN_ILLUSTRATIONS_FOR_PIXEL_MOTIF" : "NO_FOUR_ARM_PIXEL_MOTIF",
    candidates: firstMotif ? illustrations.map((candidate) => ({
      id: candidate.id,
      evidenceClass: candidate.evidenceClass,
      illustratedAt: firstMotif,
      connectedAtCrossing: candidate.connectedAtCrossing,
      topProjection: projectCandidate(candidate, 0).segments2d,
      tiltedProjection: projectCandidate(candidate, 60).segments2d
    })) : [],
    discriminator: firstMotif ? "SECOND_CALIBRATED_VIEW_OR_KNOWN_3D_SOURCE" : null
  };
}
