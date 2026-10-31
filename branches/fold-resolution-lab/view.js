// SPDX-License-Identifier: MIT
import {foldState, inspectionQuestions} from "./model.js";

const $ = id => document.getElementById(id);
const superscripts = {"0":"⁰", "1":"¹", "2":"²", "3":"³", "4":"⁴", "5":"⁵", "6":"⁶", "7":"⁷", "8":"⁸", "9":"⁹"};
const scientific = (value, digits = 2) => {
  const [mantissa, exponent] = Number(value).toExponential(digits).split("e");
  const power = exponent.replace(/[0-9]/g, digit => superscripts[digit]).replace("+", "⁺").replace("-", "⁻");
  return `${mantissa} × 10${power}`;
};
const number = value => value >= 0.001 && value < 10000
  ? new Intl.NumberFormat("de-DE", {maximumSignificantDigits: 4}).format(value)
  : scientific(value);
const x = n => 40 + n / 240 * 690;
const y = value => Math.max(14, Math.min(192, 14 + (75 - Math.log10(value)) / 115 * 178));

function drawGraph() {
  const stack = [], compression = [];
  for (let n = 0; n <= 240; n += 2) {
    const state = foldState(n);
    stack.push(`${x(n).toFixed(1)},${y(state.stack.boundingRadiusM).toFixed(1)}`);
    compression.push(`${x(n).toFixed(1)},${y(state.compression.radiusM).toFixed(1)}`);
  }
  $("stack-line").setAttribute("points", stack.join(" "));
  $("compression-line").setAttribute("points", compression.join(" "));
  const limits = foldState(0).comparison;
  for (const [key, value] of [["planck", limits.planckLengthM], ["schwarzschild", limits.schwarzschildRadiusM]]) {
    const node = document.querySelector(`[data-level="${key}"]`);
    node.setAttribute("y1", y(value)); node.setAttribute("y2", y(value));
  }
}

function update() {
  const n = Number($("folds").value);
  const state = foldState(n);
  $("fold-count").value = String(n);
  $("footprint").textContent = `${number(state.stack.widthM)} × ${number(state.stack.heightM)} m`;
  $("thickness").textContent = `${number(state.stack.thicknessM)} m`;
  $("stack-volume").textContent = `${scientific(state.stack.volumeM3)} m³`;
  $("stack-extent").textContent = `${number(state.stack.boundingRadiusM)} m`;
  $("radius").textContent = `${number(state.compression.radiusM)} m`;
  $("density").textContent = `${scientific(state.compression.densityKgM3)} kg/m³`;
  $("schwarzschild").textContent = `${scientific(state.comparison.schwarzschildRadiusM)} m`;
  $("comparison").textContent = n < state.comparison.firstSchwarzschildFold
    ? `Radius > rₛ · erste ganze Stufe ${state.comparison.firstSchwarzschildFold}`
    : "Radius ≤ rₛ im Rechenmodell";
  $("paper").style.width = `${Math.max(8, 112 / (1 + n / 18))}px`;
  $("paper").style.height = `${Math.max(7, 66 / (1 + n / 18))}px`;
  $("pile").style.height = `${Math.min(85, 4 + n / 3)}px`;
  const diameter = Math.max(6, 96 / (1 + n / 13));
  $("sphere").style.width = `${diameter}px`;
  $("sphere").style.height = `${diameter}px`;
  $("cursor").setAttribute("x1", x(n));
  $("cursor").setAttribute("x2", x(n));
}

function updateQuestion() {
  const item = inspectionQuestions[$("question").value];
  $("resolution").textContent = item.resolution;
  $("reentry").textContent = item.reentry;
}

$("folds").addEventListener("input", update);
document.querySelectorAll("[data-fold]").forEach(button => button.addEventListener("click", () => {
  $("folds").value = button.dataset.fold;
  update();
}));
$("question").addEventListener("change", updateQuestion);
drawGraph(); update(); updateQuestion();
