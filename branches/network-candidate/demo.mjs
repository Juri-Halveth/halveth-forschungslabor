// SPDX-License-Identifier: MIT
import { FIXTURES } from "./fixtures.mjs";
import { analyzeFrameAtThreshold, crossingCandidates, projectCandidate } from "./model-core.mjs";

const byId = (id) => document.getElementById(id);
const grid = byId("pixel-grid"), threshold = byId("threshold");
let selected = FIXTURES[0];
const svgNS = "http://www.w3.org/2000/svg";

function drawProjection(svg, candidate, angle) {
  svg.replaceChildren();
  const { segments2d } = projectCandidate(candidate, angle);
  for (const [index, [from, to]] of segments2d.entries()) {
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", String(130 + from[0] * 74));
    line.setAttribute("y1", String(75 - from[1] * 54));
    line.setAttribute("x2", String(130 + to[0] * 74));
    line.setAttribute("y2", String(75 - to[1] * 54));
    line.setAttribute("stroke", index ? "#f9bd79" : "#6be0d9");
    line.setAttribute("stroke-width", "9");
    line.setAttribute("stroke-linecap", "round");
    svg.append(line);
  }
  const label = document.createElementNS(svgNS, "text");
  label.setAttribute("x", "12"); label.setAttribute("y", "20");
  label.setAttribute("fill", "#b8cfdf"); label.setAttribute("font-size", "12");
  label.textContent = angle ? "60° Neigung" : "0° Draufsicht";
  svg.append(label);
}

function render() {
  const level = Number(threshold.value);
  const result = analyzeFrameAtThreshold(selected.frame, level);
  byId("threshold-value").value = String(level);
  byId("fixture-description").textContent = selected.description;
  grid.replaceChildren();
  for (const [index, value] of selected.frame.pixels.entries()) {
    const pixel = document.createElement("span");
    const active = value >= level;
    const x = index % selected.frame.width, y = Math.floor(index / selected.frame.width);
    const motif = result.fourArmPixels.some((point) => point.x === x && point.y === y);
    pixel.style.setProperty("--pixel", motif ? "#fff0a8" : active ? "#5cddd5" : "#1a2b3e");
    pixel.style.setProperty("--glow", active ? "13px" : "0px");
    grid.append(pixel);
  }
  byId("measurement").textContent = `${result.brightPixels} helle Pixel · ${result.components} Pixelgruppen · ${result.fourArmPixels.length} vierarmige Muster`;
  const hasMotif = result.fourArmPixels.length > 0;
  byId("motif-status").textContent = hasMotif ? "Pixelmuster gefunden · Raumfrage offen" : "Kein passendes Pixelmuster bei dieser Schwelle";
  byId("candidate-cards").hidden = !hasMotif;
}

for (const [index, candidate] of crossingCandidates().entries()) {
  const stem = index ? "overpass" : "junction";
  drawProjection(byId(`${stem}-top`), candidate, 0);
  drawProjection(byId(`${stem}-tilted`), candidate, 60);
}
for (const button of document.querySelectorAll("[data-fixture]")) button.addEventListener("click", () => {
  selected = FIXTURES.find((fixture) => fixture.id === button.dataset.fixture);
  for (const other of document.querySelectorAll("[data-fixture]"))
    other.setAttribute("aria-pressed", String(other === button));
  render();
});
threshold.addEventListener("input", render);
render();
