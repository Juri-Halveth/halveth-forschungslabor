// SPDX-License-Identifier: MIT
import { createHash } from "node:crypto";

function assertFrame({ width, height, pixels }) {
  if (!Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1)
    throw new RangeError("Frame dimensions must be positive integers");
  if (!Array.isArray(pixels) && !(pixels instanceof Uint8Array))
    throw new TypeError("Pixels must be an array or Uint8Array");
  if (pixels.length !== width * height) throw new RangeError("Pixel count differs from frame dimensions");
  if (!Array.from(pixels).every((value) => Number.isInteger(value) && value >= 0 && value <= 255))
    throw new RangeError("Pixels must be 8-bit grayscale values");
}

export function analyzeThresholds(frame, thresholds) {
  assertFrame(frame);
  if (!Array.isArray(thresholds) || thresholds.length < 1 ||
      !thresholds.every((value) => Number.isInteger(value) && value >= 0 && value <= 255))
    throw new RangeError("Thresholds must be a nonempty array of 8-bit values");
  const { width, height, pixels } = frame;
  const header = Buffer.alloc(8);
  header.writeUInt32LE(width, 0);
  header.writeUInt32LE(height, 4);
  const sourceFrameSha256 = createHash("sha256").update(header)
    .update(Uint8Array.from(pixels)).digest("hex");
  return thresholds.map((threshold) => {
    const active = Uint8Array.from(pixels, (value) => Number(value >= threshold));
    const seen = new Uint8Array(active.length);
    let components = 0;
    let largestPixels = 0;
    let brightPixels = 0;
    for (let start = 0; start < active.length; start++) {
      if (!active[start]) continue;
      brightPixels++;
      if (seen[start]) continue;
      components++;
      let size = 0;
      const queue = [start];
      seen[start] = 1;
      while (queue.length) {
        const index = queue.pop();
        size++;
        const x = index % width, y = Math.floor(index / width);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const next = ny * width + nx;
          if (active[next] && !seen[next]) { seen[next] = 1; queue.push(next); }
        }
      }
      largestPixels = Math.max(largestPixels, size);
    }
    return { sourceFrameSha256, width, height, threshold, brightPixels, components, largestPixels,
      connectivity: "EIGHT_NEIGHBOR_PIXEL_COMPONENTS" };
  });
}

export function crossingCandidates(gap = 0.8) {
  if (!Number.isFinite(gap) || gap <= 0) throw new RangeError("Depth gap must be positive and finite");
  const horizontal = [[-1, 0, 0], [1, 0, 0]];
  return [
    { id: "JUNCTION", segments: [horizontal, [[0, -1, 0], [0, 1, 0]]],
      connectedAtCrossing: true },
    { id: "OVERPASS", segments: [horizontal, [[0, -1, gap], [0, 1, gap]]],
      connectedAtCrossing: false }
  ];
}

export function projectCandidate(candidate, tiltDegrees = 0) {
  if (!Number.isFinite(tiltDegrees) || tiltDegrees < 0 || tiltDegrees > 90)
    throw new RangeError("Tilt must be between 0 and 90 degrees");
  if (!candidate?.segments?.every((segment) => Array.isArray(segment) &&
      segment.length === 2 && segment.every((point) => Array.isArray(point) &&
      point.length === 3 && point.every(Number.isFinite))))
    throw new TypeError("Candidate needs finite 3D line segments");
  const angle = tiltDegrees * Math.PI / 180;
  return { candidateId: candidate.id, tiltDegrees,
    segments2d: candidate.segments.map((segment) => segment.map(([x, y, z]) =>
      [x, y * Math.cos(angle) - z * Math.sin(angle)])) };
}

export function buildNetworkCandidatePacket(frame, thresholds, gap = 0.8) {
  const measurements = analyzeThresholds(frame, thresholds);
  const candidates = crossingCandidates(gap);
  return {
    schema: "halveth.network-candidate.v1",
    source: {
      type: "DECODED_GRAYSCALE_FRAME",
      frameSha256: measurements[0].sourceFrameSha256,
      width: frame.width,
      height: frame.height
    },
    observations: measurements,
    candidateStatus: "OPEN",
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      connectedAtCrossing: candidate.connectedAtCrossing,
      topProjection: projectCandidate(candidate, 0).segments2d,
      tiltedProjection: projectCandidate(candidate, 60).segments2d
    })),
    discriminator: "SECOND_CALIBRATED_VIEW_OR_KNOWN_3D_SOURCE"
  };
}
