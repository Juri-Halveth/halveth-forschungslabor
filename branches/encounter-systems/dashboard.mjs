// SPDX-License-Identifier: MIT
import "./view.mjs";
import { report } from "./results-data.mjs";
const root = document.getElementById("halveth-encounter-work");
const api = root.__encounter;
const timeline = document.getElementById("history");
const label = document.getElementById("history-label");
const trace = document.getElementById("event-trace");
let frames = [],
  source = null,
  lastTime = -1,
  lastEvents = -1;
function refresh(event) {
  if (!api) return;
  const historical = event?.detail?.historical ?? api.historical();
  const world = api.world();
  if (source !== world) {
    source = world;
    frames = [];
    lastTime = -1;
    lastEvents = -1;
  }
  if (
    !historical &&
    (world.time - lastTime >= 0.4 ||
      world.events.length !== lastEvents ||
      frames.length === 0)
  ) {
    frames.push(api.snapshot());
    lastTime = world.time;
    lastEvents = world.events.length;
    if (frames.length > 240) frames.shift();
    timeline.max = Math.max(0, frames.length - 1);
    timeline.value = frames.length - 1;
  }
  const snapshot = historical ? frames[Number(timeline.value)] : api.snapshot();
  if (!snapshot) return;
  label.textContent = historical
    ? snapshot.time.toFixed(1).replace(".", ",") + " s · Ansicht"
    : "Gegenwart";
  document.getElementById("model-time").textContent =
    snapshot.time.toFixed(1).replace(".", ",") + " s";
  document.getElementById("grant-epoch").textContent =
    "Freigabe " + snapshot.epoch;
  const signature = snapshot.events.length + ":" + snapshot.time.toFixed(1);
  if (trace.dataset.signature !== signature) {
    trace.replaceChildren();
    for (const event of snapshot.events.slice(-5).reverse()) {
      const item = document.createElement("li"),
        time = document.createElement("time"),
        text = document.createElement("span");
      time.textContent = event.time.toFixed(1) + " s";
      text.textContent = event.text;
      item.append(time, text);
      trace.append(item);
    }
    trace.dataset.signature = signature;
  }
}
root.addEventListener("encounter-frame", refresh);
timeline.addEventListener("input", () => {
  const snapshot = frames[Number(timeline.value)];
  if (snapshot) api.showHistory(snapshot);
});
document
  .getElementById("history-live")
  .addEventListener("click", () => api.showPresent());
document.getElementById("result-runs").textContent = report.scenarios.length;
const standard = report.scenarios.filter(
    (x) => x.task === "fractal" && x.buildDelay === 1.1,
  ),
  max = Math.max(...standard.map((x) => x.modelSeconds));
for (const row of standard) {
  const line = document.createElement("div");
  line.className = "bar-row";
  const name = document.createElement("span"),
    track = document.createElement("div"),
    bar = document.createElement("div"),
    value = document.createElement("span");
  name.textContent = row.partner ? "Mit Partner" : "Allein";
  track.className = "bar-track";
  bar.className = "bar-fill";
  bar.style.width = (row.modelSeconds / max) * 100 + "%";
  value.textContent = row.modelSeconds.toFixed(2) + " s";
  track.append(bar);
  line.append(name, track, value);
  document.getElementById("comparison-bars").append(line);
}
for (const task of ["fractal", "wave"]) {
  const rows = report.scenarios.filter(
    (x) => x.task === task && x.buildDelay === 1.1,
  );
  const tr = document.createElement("tr");
  for (const value of [
    task === "fractal" ? "Fraktalbild" : "Wellentextur",
    rows[0].modelSeconds.toFixed(2) + " s",
    rows[1].modelSeconds.toFixed(2) + " s",
    rows[0].outputSha256 === rows[1].outputSha256 ? "Bytegleich" : "Abweichung",
  ]) {
    const cell = document.createElement("td");
    cell.textContent = value;
    tr.append(cell);
  }
  document.getElementById("comparison-table").append(tr);
}
root.__history = {
  count: () => frames.length,
  at: (i) => structuredClone(frames[i]),
};
refresh();
