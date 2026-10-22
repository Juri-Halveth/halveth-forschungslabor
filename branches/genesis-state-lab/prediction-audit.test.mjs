import test from 'node:test';
import assert from 'node:assert/strict';
import { canonical, createInitialState } from './model.js';
import { evaluateMacroPrediction, predictMacro, predictionControlAudit } from './prediction-audit.js';

test('the prediction is fixed before three distinct synthetic observation outcomes', () => {
  const before = createInitialState(1);
  const original = canonical(before);
  const audit = predictionControlAudit(before, 'A000');
  assert.equal(audit.pending.status, 'UNKNOWN_NO_OBSERVATION');
  assert.equal(audit.matching.status, 'MATCH_IN_MODEL_CONTROL');
  assert.equal(audit.differing.status, 'MISMATCH_IN_MODEL_CONTROL');
  assert.equal(audit.pending.predictionFingerprint, audit.matching.predictionFingerprint);
  assert.equal(audit.matching.predictionFingerprint, audit.differing.predictionFingerprint);
  assert.equal(audit.candidateUnchanged, true);
  assert.equal(canonical(before), original);
  assert.equal(audit.claimCeiling, 'SYNTHETIC_MODEL_CONTROL_ONLY');
});

test('the evaluation rejects a changed prediction and an invalid observation', () => {
  const prediction = predictMacro(createInitialState(1), 'A000');
  assert.throws(() => evaluateMacroPrediction({ ...prediction, expected: { ...prediction.expected, totalSignal: -1 } }), /mismatch/);
  assert.throws(() => evaluateMacroPrediction(prediction, { schema: 'unknown', agents: [] }), /Expected one Genesis state/);
  assert.throws(() => predictMacro(createInitialState(1), 'A999'), /outside the model/);
});
