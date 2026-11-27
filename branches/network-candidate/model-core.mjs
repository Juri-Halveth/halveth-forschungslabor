// SPDX-License-Identifier: MIT
// Pure pixel and projection rules shared by the Node packet and browser demo.
export function assertFrame({ width, height, pixels }) {
  if (!Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1)
    throw new RangeError("Frame dimensions must be positive integers");
  if (!Array.isArray(pixels) && !(pixels instanceof Uint8Array))
    throw new TypeError("Pixels must be an array or Uint8Array");
  if (pixels.length !== width * height) throw new RangeError("Pixel count differs from frame dimensions");
  if (!Array.from(pixels).every((value) => Number.isInteger(value) && value >= 0 && value <= 255))
    throw new RangeError("Pixels must be 8-bit grayscale values");
}

export function analyzeFrameAtThreshold(frame, threshold) {
  assertFrame(frame);
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 255)
    throw new RangeError("Threshold must be an 8-bit value");
  const { width, height, pixels } = frame;
  const active = Uint8Array.from(pixels, (value) => Number(value >= threshold));
  const seen = new Uint8Array(active.length);
  let components = 0, largestPixels = 0, brightPixels = 0;
  const fourArmPixels = [];
  for (let start = 0; start < active.length; start++) {
    if (!active[start]) continue;
    brightPixels++;
    const x = start % width, y = Math.floor(start / width);
    // A narrow axis-aligned pixel motif, not a graph vertex or a 3D junction.
    if (x > 0 && x < width - 1 && y > 0 && y < height - 1 &&
        active[start - 1] && active[start + 1] &&
        active[start - width] && active[start + width] &&
        !active[start - width - 1] && !active[start - width + 1] &&
        !active[start + width - 1] && !active[start + width + 1])
      fourArmPixels.push({ x, y });
    if (seen[start]) continue;
    components++;
    let size = 0;
    const queue = [start];
    seen[start] = 1;
    while (queue.length) {
      const index = queue.pop();
      size++;
      const qx = index % width, qy = Math.floor(index / width);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = qx + dx, ny = qy + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const next = ny * width + nx;
        if (active[next] && !seen[next]) { seen[next] = 1; queue.push(next); }
      }
    }
    largestPixels = Math.max(largestPixels, size);
  }
  return { threshold, brightPixels, components, largestPixels, fourArmPixels,
    connectivity: "EIGHT_NEIGHBOR_PIXEL_COMPONENTS",
    motifRule: "FOUR_CARDINAL_NEIGHBORS_WITH_FOUR_DARK_DIAGONALS" };
}

export function crossingCandidates(gap = 0.8) {
  if (!Number.isFinite(gap) || gap <= 0) throw new RangeError("Depth gap must be positive and finite");
  const horizontal = [[-1, 0, 0], [1, 0, 0]];
  return [
    { id: "JUNCTION", segments: [horizontal, [[0, -1, 0], [0, 1, 0]]],
      connectedAtCrossing: true, evidenceClass: "SYNTHETIC_ILLUSTRATION" },
    { id: "OVERPASS", segments: [horizontal, [[0, -1, gap], [0, 1, gap]]],
      connectedAtCrossing: false, evidenceClass: "SYNTHETIC_ILLUSTRATION" }
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
