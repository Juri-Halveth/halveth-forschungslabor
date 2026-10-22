import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFork } from './model.js';

test('C eröffnet einen dritten Pfad, ohne einen Gewinner zu bestimmen', () => {
  const result = evaluateFork({ entry: true });
  assert.deepEqual(result.paths, ['A', 'B', 'C']);
  assert.equal(result.state, 'INDEPENDENT_ENTRY');
});

test('zwei Sperren bleiben ein Kandidat und kein Schachmatt-Beweis', () => {
  const result = evaluateFork({ a: 'blockiert', b: 'blockiert' });
  assert.equal(result.state, 'EXCLUSION_CANDIDATE');
  assert.match(result.detail, /ein Ausgang folgt daraus noch nicht/);
});

test('Kooperation einer Seite beseitigt die dritte Seite nicht', () => {
  const result = evaluateFork({ a: 'kooperiert', b: 'blockiert' });
  assert.equal(result.state, 'PAIR_CANDIDATE');
  assert.deepEqual(result.paths, ['A', 'B', 'C']);
});

test('ohne Eintritt bleibt das Zwei-Akteure-Modell erhalten', () => {
  assert.equal(evaluateFork({ entry: false }).state, 'TWO_ACTOR');
});

test('unbekannte Aktionen werden nicht still normalisiert', () => {
  assert.throws(() => evaluateFork({ a: 'gewinnt' }), TypeError);
});
