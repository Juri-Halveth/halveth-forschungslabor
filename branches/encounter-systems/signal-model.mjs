// SPDX-License-Identifier: MIT
export const SIGNAL_VERSION = "1.0.0";
export const SIDE = 8;
export const SAMPLES = 32;
export const CYCLES = 2;
export const THRESHOLD = 0.25;
export const DECODERS = Object.freeze(["matched", "inverted", "detuned"]);

function validBits(bits) {
  if (
    !Array.isArray(bits) ||
    bits.length !== SIDE * SIDE ||
    Array.from(bits).some((x) => x !== 0 && x !== 1)
  )
    throw Error("Expected exactly 64 binary values");
}
function validOptions(options, allowed) {
  if (
    !options ||
    typeof options !== "object" ||
    Object.getPrototypeOf(options) !== Object.prototype
  )
    throw Error("Expected a plain configuration object");
  if (Object.keys(options).some((k) => !allowed.includes(k)))
    throw Error("Unknown configuration option");
}
export function pattern(name) {
  if (!["window", "pulse"].includes(name)) throw Error("Unknown pattern");
  return Array.from({ length: 64 }, (_, i) => {
    const x = i % 8,
      y = Math.floor(i / 8);
    return Number(
      name === "window"
        ? x >= 1 &&
            x <= 6 &&
            y >= 1 &&
            y <= 6 &&
            (x === 1 || x === 6 || y === 1 || y === 6 || x === 3 || y === 4)
        : Math.abs(y - (x < 3 ? 4 : x === 3 ? 1 : x === 4 ? 6 : 4)) === 0,
    );
  });
}
export function transmit(bits) {
  validBits(bits);
  return Float64Array.from(
    { length: bits.length * SAMPLES },
    (_, i) =>
      (bits[Math.floor(i / SAMPLES)] ? 1 : -1) *
      Math.cos((2 * Math.PI * CYCLES * (i % SAMPLES)) / SAMPLES),
  );
}
function random(seed) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
export function channel(samples, options = {}) {
  validOptions(options, ["noise", "seed", "connected"]);
  const { noise = 0, seed = 917, connected = true } = options;
  if (
    !(samples instanceof Float64Array) ||
    samples.length !== 64 * SAMPLES ||
    !samples.every(Number.isFinite)
  )
    throw Error("Invalid sample array");
  if (
    !Number.isFinite(noise) ||
    noise < 0 ||
    noise > 8 ||
    !Number.isInteger(seed) ||
    seed < 1 ||
    seed > 4294967295 ||
    typeof connected !== "boolean"
  )
    throw Error("Invalid channel configuration");
  const rng = random(seed);
  return Float64Array.from(samples, (x) =>
    connected ? x + (rng() * 2 - 1) * noise : 0,
  );
}
export function decode(samples, mode = "matched") {
  if (
    !(samples instanceof Float64Array) ||
    samples.length !== 64 * SAMPLES ||
    !samples.every(Number.isFinite)
  )
    throw Error("Invalid sample array");
  if (!DECODERS.includes(mode)) throw Error("Unknown decoder");
  const scores = [],
    bits = [];
  for (let bit = 0; bit < 64; bit++) {
    let score = 0;
    for (let j = 0; j < SAMPLES; j++)
      score +=
        samples[bit * SAMPLES + j] *
        Math.cos(
          (2 * Math.PI * (mode === "detuned" ? 3 : CYCLES) * j) / SAMPLES,
        );
    score *= 2 / SAMPLES;
    scores.push(score);
    bits.push(
      Math.abs(score) < THRESHOLD
        ? null
        : Number(mode === "inverted" ? score < 0 : score > 0),
    );
  }
  return { bits, scores };
}
export function experiment(bits, options = {}) {
  validBits(bits);
  validOptions(options, ["noise", "seed", "connected", "mode"]);
  const { mode = "matched", ...channelOptions } = options;
  const sent = transmit(bits),
    received = channel(sent, channelOptions);
  const decoded = decode(received, mode);
  const correct = decoded.bits.filter((x, i) => x === bits[i]).length;
  const unknown = decoded.bits.filter((x) => x === null).length;
  return {
    sent,
    received,
    decoded,
    correct,
    unknown,
    wrong: 64 - correct - unknown,
    count: 64,
  };
}
