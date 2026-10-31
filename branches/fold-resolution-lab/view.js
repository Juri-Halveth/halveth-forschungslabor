// SPDX-License-Identifier: MIT
import {foldState, inspectionQuestions} from "./model.js";
import {FoldRenderer} from "./fold-render.js";
import {foldGate, geometricStop} from "./fold-motion.js";

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
const renderer = new FoldRenderer($("fold-canvas"));
const geometricLimit = geometricStop();
let animationFrame = 0;

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

function update(progress = 0) {
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
  const render = renderer.draw(n, progress);
  const gate = n < 240 ? foldGate(n) : null;
  const status = $("fold-status");
  status.classList.toggle("formal", n >= geometricLimit);
  if (progress > 0 && progress < 1) {
    status.textContent = `Schritt ${n} → ${n+1} · ${Math.round(progress*100)} %`;
  } else if (n === 0) {
    status.textContent = "Ausgangsblatt · noch nicht gefaltet";
  } else if (n < geometricLimit) {
    status.textContent = `${n} Faltungen · beweglicher Modellbereich`;
  } else if (n === geometricLimit) {
    status.textContent = `${n} Faltungen · Freiraumschwelle des Modells`;
  } else {
    status.textContent = `${n} Faltungen · nur formale Fortsetzung`;
  }
  const gateText = gate && n >= geometricLimit
    ? `Nächste Umlegekante: ${number(gate.outerArcM)} m Bogen bei ${number(gate.spanM)} m Blattlänge.`
    : gate ? `Nächste Kante: ${number(gate.spanM)} m Blattlänge; ${number(gate.outerArcM)} m angenommener Bogen.` : "Ende des eingestellten Rechenfensters.";
  const pixelText = render.footprintSubpixel ? "Fußabdruck unter einem Anzeigepixel." : "";
  $("scene-readout").textContent = `2^${n} Lagen · ${number(state.stack.thicknessM)} m stark. ${gateText} ${pixelText}`;
  $("prev-fold").disabled = n === 0;
  $("next-fold").disabled = n === 240;
  $("play-fold").disabled = n === 240;
  $("cursor").setAttribute("x1", x(n));
  $("cursor").setAttribute("x2", x(n));
}

function updateQuestion() {
  const item = inspectionQuestions[$("question").value];
  $("resolution").textContent = item.resolution;
  $("reentry").textContent = item.reentry;
}

function stopAnimation() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = 0;
}

function setStep(n) {
  stopAnimation();
  $("folds").value = String(Math.min(240, Math.max(0, n)));
  update();
}

function playStep() {
  stopAnimation();
  const n = Number($("folds").value);
  if (n >= 240) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setStep(n+1); return;
  }
  const start = performance.now(), duration = 1300;
  const tick = now => {
    const t = Math.min(1,(now-start)/duration);
    update(t*t*(3-2*t));
    if (t < 1) animationFrame = requestAnimationFrame(tick);
    else { animationFrame = 0; setStep(n+1); }
  };
  animationFrame = requestAnimationFrame(tick);
}

$("folds").addEventListener("input", () => setStep(Number($("folds").value)));
document.querySelectorAll("[data-fold]").forEach(button => button.addEventListener("click", () => {
  setStep(Number(button.dataset.fold));
}));
$("prev-fold").addEventListener("click", () => setStep(Number($("folds").value)-1));
$("next-fold").addEventListener("click", () => setStep(Number($("folds").value)+1));
$("play-fold").addEventListener("click", playStep);
$("question").addEventListener("change", updateQuestion);
new ResizeObserver(() => update()).observe($("fold-canvas"));
drawGraph(); update(); updateQuestion();
