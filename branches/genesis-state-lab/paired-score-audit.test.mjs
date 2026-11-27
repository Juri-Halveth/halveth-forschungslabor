import test from 'node:test';
import assert from 'node:assert/strict';
import { comparePairedScores, pairedScoreExamples } from './paired-score-audit.js';

test('a positive mean without paired majority never says the control is better', () => {
  const sample = pairedScoreExamples.mixed;
  const result = comparePairedScores(sample.original, sample.control);
  assert.equal(result.meanDifference, 2 / 3);
  assert.equal(result.originalWins, 1);
  assert.equal(result.controlWins, 0);
  assert.equal(result.status, 'MIXED_OR_INSUFFICIENT_MAJORITY');
  assert.equal(result.claimCeiling, 'DECLARED_FINITE_SERIES_ONLY');
});

test('consistent original and control advantages remain distinct', () => {
  const original = pairedScoreExamples.original;
  const control = pairedScoreExamples.control;
  assert.equal(comparePairedScores(original.original, original.control).status, 'ORIGINAL_MEETS_DECLARED_RULE');
  assert.equal(comparePairedScores(control.original, control.control).status, 'CONTROL_MEETS_DECLARED_RULE');
});

test('small advantages and invalid series do not become a directional win', () => {
  const below = pairedScoreExamples.below;
  assert.equal(comparePairedScores(below.original, below.control).status, 'BELOW_DECLARED_THRESHOLD');
  assert.throws(() => comparePairedScores([], []), /nonempty/);
  assert.throws(() => comparePairedScores([1], [0, 1]), /equally long/);
  assert.throws(() => comparePairedScores([NaN], [0]), /Invalid paired score/);
  assert.throws(() => comparePairedScores(Array(1), [0]), /Sparse paired score/);
  assert.throws(() => comparePairedScores([1], [0], { minimumMeanAdvantage: 0 }), /positive/);
  assert.throws(() => comparePairedScores([Number.MAX_VALUE], [-Number.MAX_VALUE]), /finite range/);
});
