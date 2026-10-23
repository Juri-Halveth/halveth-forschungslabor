// SPDX-License-Identifier: MIT
import { pattern, experiment, SAMPLES } from "./signal-model.mjs";
import { signalReport } from "./signal-results-data.mjs";
const $ = (id) => document.getElementById(id);
let bits = pattern("window");
const sourceCells = bits.map((_, i) => {
  const cell = document.createElement("button");
  cell.type = "button";
  cell.addEventListener("click", () => {
    bits[i] ^= 1;
    refresh();
  });
  $("signal-input").append(cell);
  return cell;
});
const outputCells = bits.map(() => {
  const cell = document.createElement("span");
  cell.setAttribute("aria-hidden", "true");
  $("signal-output").append(cell);
  return cell;
});
function path(samples, scale) {
  return Array.from(
    samples.slice(0, 8 * SAMPLES),
    (value, i) =>
      (i ? "L" : "M") +
      ((i / (8 * SAMPLES - 1)) * 520).toFixed(2) +
      " " +
      (100 - (value / scale) * 85).toFixed(2),
  ).join(" ");
}
function refresh() {
  const noise = Number($("signal-noise").value),
    mode = $("signal-mode").value;
  const result = experiment(bits, {
    noise,
    mode,
    connected: $("signal-connected").checked,
  });
  $("signal-noise-value").value = String(noise);
  sourceCells.forEach((cell, i) => {
    cell.className = bits[i] ? "pixel-on" : "";
    cell.setAttribute("aria-pressed", String(Boolean(bits[i])));
    cell.setAttribute(
      "aria-label",
      `Zeile ${Math.floor(i / 8) + 1}, Spalte ${(i % 8) + 1}: ${bits[i]}`,
    );
  });
  outputCells.forEach((cell, i) => {
    const bit = result.decoded.bits[i];
    cell.className = bit === null ? "pixel-unknown" : bit ? "pixel-on" : "";
    cell.textContent = bit === null ? "?" : "";
  });
  $("signal-output").setAttribute(
    "aria-label",
    `Rekonstruktion: ${result.correct} richtige, ${result.wrong} falsche, ${result.unknown} unentschiedene Bildwerte`,
  );
  for (const key of ["correct", "wrong", "unknown"])
    $("signal-" + key).textContent = result[key] + " / 64";
  const scale = Math.max(
    1.2,
    ...result.received.slice(0, 8 * SAMPLES).map(Math.abs),
  );
  $("signal-sent-path").setAttribute("d", path(result.sent, scale));
  $("signal-received-path").setAttribute("d", path(result.received, scale));
  $("signal-verdict").textContent =
    result.correct === 64
      ? "Alle 64 Bildwerte sind erhalten. Quelle und Rekonstruktion stimmen exakt überein."
      : result.wrong === 64
        ? "Der Decoder liefert ein vollständiges Bild, aber alle 64 Zuordnungen sind falsch. Die empfangenen Samples allein garantieren keine richtige Interpretation."
        : result.unknown === 64
          ? "Keine ausreichende Entscheidung: Alle 64 Bildwerte bleiben offen. Eine fehlende Kopplung wird als fehlende Information sichtbar."
          : `${result.correct} richtige Werte, ${result.wrong} falsche Werte, ${result.unknown} offene Entscheidungen unter dieser Störung.`;
}
$("signal-pattern").addEventListener("change", () => {
  bits = pattern($("signal-pattern").value);
  refresh();
});
for (const id of ["signal-mode", "signal-noise", "signal-connected"])
  $(id).addEventListener("input", refresh);
$("signal-runs").textContent = String(signalReport.runs.length);
const labels = {
  window: "Fenster",
  pulse: "Puls",
  matched: "Passend",
  inverted: "Vertauscht",
  detuned: "Falsch abgestimmt",
};
for (const run of signalReport.runs) {
  const row = document.createElement("tr");
  for (const value of [
    labels[run.pattern],
    run.noise,
    labels[run.mode],
    run.correct,
    run.wrong,
    run.unknown,
  ]) {
    const cell = document.createElement("td");
    cell.textContent = String(value);
    row.append(cell);
  }
  $("signal-results-table").append(row);
}
refresh();
