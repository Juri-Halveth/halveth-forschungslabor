// SPDX-License-Identifier: MIT
import { MODES } from "./model.mjs";

export const LESSONS = Object.freeze({
  projection: Object.freeze({
    question: "Am Ende siehst du links einen Bildort. Wie viele verschiedene Raumorte gibt es?",
    options: Object.freeze([["one", "Einen Raumort"], ["two", "Zwei Raumorte"], ["four", "Vier Raumorte"]].map(Object.freeze)),
    correct: "four",
    explanation: "Vier. Die x/y-Projektion blendet z aus. Der gekippte Blick unterscheidet die vier Raumorte.",
  }),
  shrink: Object.freeze({
    question: "Bei Skalierung null teilen die Punkte einen Ort. Wie viele Datensätze bleiben erhalten?",
    options: Object.freeze([["zero", "Keiner"], ["one", "Ein Datensatz"], ["four", "Vier Datensätze"]].map(Object.freeze)),
    correct: "four", explanation: "Vier. Der Zustandsoperator verändert die Koordinaten; die Identitäten A, B, C und D bleiben bestehen.",
  }),
  merge: Object.freeze({
    question: "Stelle die Modellzeit auf 0,667 (genau 2/3). Wie viele verschiedene Orte gibt es dort?",
    options: Object.freeze([["one", "Einen Ort"], ["two", "Zwei Orte"], ["four", "Vier Orte"]].map(Object.freeze)),
    correct: "two", explanation: "Zwei. B und C haben A bereits erreicht. D liegt noch an einem anderen Ort.",
  }),
  history: Object.freeze({
    question: "Welche zusätzliche Beobachtung kann die beiden festgelegten Wege unterscheiden?",
    options: Object.freeze([["end", "Noch einmal dieselben Endbilder"], ["middle", "Eine Aufnahme bei t = 0,5"], ["names", "Nur die vier Punktnamen"]].map(Object.freeze)),
    correct: "middle", explanation: "Die Aufnahme bei t = 0,5. An dieser Stelle liegen Gerade und Bogen verschieden, während beide Endbilder übereinstimmen.",
  }),
});

export function grade(mode, answer) {
  const lesson = Object.hasOwn(LESSONS,mode) ? LESSONS[mode] : null;
  if (!lesson || !lesson.options.some(([id]) => id === answer)) throw new RangeError("Unknown lesson or answer");
  return { correct: lesson.correct === answer, explanation: lesson.explanation };
}
export function decodeProgress(raw) {
  if (raw === null) return [];
  if (typeof raw !== "string" || raw.length > 1024) throw new TypeError("Invalid progress input");
  const value = JSON.parse(raw);
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).sort().join("|") !== "completed|schema" || value.schema !== "endeck.learning.v1" || !Array.isArray(value.completed) || value.completed.length > 4 || new Set(value.completed).size !== value.completed.length || value.completed.some((id) => !MODES.includes(id))) throw new TypeError("Invalid progress record");
  return MODES.filter((id) => value.completed.includes(id));
}
export function encodeProgress(completed) {
  const raw = JSON.stringify({ schema: "endeck.learning.v1", completed });
  decodeProgress(raw);
  return raw;
}
export function recordAnswer(completed, mode, answer) {
  decodeProgress(encodeProgress(completed));
  const result = grade(mode, answer);
  return { ...result, completed: MODES.filter((id) => completed.includes(id) || (result.correct && id === mode)) };
}
