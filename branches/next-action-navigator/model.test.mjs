import test from 'node:test';
import assert from 'node:assert/strict';
import { AXIS_STATES, TRACKS, evaluateNavigation } from './model.js';

const filled = track => ({
  track, goal: 'Ein Verhalten prüfen', source: 'Lokaler Quellstand', scope: 'Eigenes Testprojekt',
  axisStates: Object.fromEntries(TRACKS[track].axes.map(id => [id, 'UNKNOWN'])),
  axisReasons: {},
  hypothesis: 'Die Eingabe verändert den Zustand', counter: 'Die Ausgabe ist nur Darstellung',
  check: 'Lokalen Zustand vor und nach einer Eingabe vergleichen',
  result: 'Im lokalen Test blieb der Zustand gleich', evidenceState: 'OBSERVED',
  reopen: 'Neue Version mit verändertem Zustandsweg'
});

test('jeder Arbeitsweg erhält sämtliche Pflichtachsen', () => {
  for (const [id, track] of Object.entries(TRACKS)) {
    assert.ok(track.axes.length >= 8, id);
    assert.equal(new Set(track.axes).size, track.axes.length);
    assert.equal(evaluateNavigation({ track: id }).nextId, 'object');
  }
});

test('UNKNOWN hält eine Achse sichtbar, ohne sie als bewiesen auszugeben', () => {
  const input = filled('research');
  delete input.axisStates.UNKNOWN_FRONTIER;
  assert.equal(evaluateNavigation(input).nextId, 'axes');
  input.axisStates.UNKNOWN_FRONTIER = 'UNKNOWN';
  assert.equal(evaluateNavigation(input).outcome, 'FINITE_SNAPSHOT');
});

test('Security ohne Autoritätsbindung bleibt im lokalen oder lesenden Pfad', () => {
  const output = evaluateNavigation(filled('security'));
  assert.equal(output.actionClass, 'READ_ONLY_OR_LOCAL_SHADOW');
  assert.match(output.boundary, /autorisiert keinen aktiven Test/);
});

test('ein eingetragener Autoritätstext schaltet keine Live-Aktion frei', () => {
  const input = filled('security');
  input.authority = 'Eigene Behauptung einer Programmpolicy';
  assert.equal(evaluateNavigation(input).actionClass, 'READ_ONLY_OR_LOCAL_SHADOW');
});

test('Gegenhypothese fehlt: keine Probe wird vorgezogen', () => {
  const input = filled('build');
  input.counter = '';
  assert.equal(evaluateNavigation(input).nextId, 'models');
});

test('Ausschluss einer Achse braucht eine benannte Begründung', () => {
  const input = filled('build');
  input.axisStates.ACCESSIBILITY = 'EXCLUDED_WITH_REASON';
  assert.equal(evaluateNavigation(input).nextId, 'axes');
  input.axisReasons.ACCESSIBILITY = 'Nicht Teil dieses begrenzten Datenmodells';
  assert.equal(evaluateNavigation(input).outcome, 'FINITE_SNAPSHOT');
});

test('ohne Wiedervorlage bleibt ein fertiger Durchlauf offen', () => {
  const input = filled('communicate');
  input.reopen = '';
  assert.equal(evaluateNavigation(input).outcome, 'REOPEN_TRIGGER_NEEDED');
});

test('fremde Achsen und ungültige Evidenzzustände werden abgelehnt', () => {
  const input = filled('research');
  input.axisStates.UNRELATED = AXIS_STATES[0];
  assert.throws(() => evaluateNavigation(input), TypeError);
  delete input.axisStates.UNRELATED;
  input.evidenceState = 'CERTAIN';
  assert.throws(() => evaluateNavigation(input), TypeError);
});
