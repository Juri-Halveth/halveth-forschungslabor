// SPDX-License-Identifier: MIT
// Separately authored scalar oracle. It imports no implementation functions.
export function referenceImage(task) {
  if (!["fractal", "wave"].includes(task))
    throw Error("Unsupported reference workload");
  const image = new Uint8Array(128 * 96);
  for (let py = 0; py !== 96; ++py)
    for (let px = 0; px !== 128; ++px) {
      let value;
      if (task === "wave")
        value = Math.round(
          127.5 *
            (1 +
              Math.sin(px * 0.12 + Math.cos(py * 0.11) * 2) *
                Math.cos(py * 0.09)),
        );
      else {
        // Preserve the specified arithmetic order used by the prototype.
        const cr = (px / 128) * 3.35 - 2.35,
          ci = (py / 96) * 2.25 - 1.125;
        let x = 0,
          y = 0,
          iterations = 0;
        while (x * x + y * y < 4 && iterations < 48) {
          const next = x * x - y * y + cr;
          y = 2 * x * y + ci;
          x = next;
          iterations++;
        }
        value =
          iterations === 48
            ? 255
            : Math.round(255 * Math.sqrt(iterations / 48));
      }
      image[py * 128 + px] = value;
    }
  return image;
}
export function deliveryAllowed({
  issuedEpoch,
  currentEpoch,
  consent,
  operation,
  ids = [],
}) {
  if (
    !Number.isSafeInteger(issuedEpoch) ||
    issuedEpoch !== currentEpoch ||
    consent !== true
  )
    return false;
  if (operation === "BUILD") return true;
  return operation === "COPY" && ids.length === 3 && new Set(ids).size === 3;
}
