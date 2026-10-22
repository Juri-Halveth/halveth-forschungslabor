import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createInitialState } from './model.js';
import { predictMacro } from './prediction-audit.js';

const script = fileURLToPath(new URL('./prediction-process-probe.mjs', import.meta.url));
const run = (args, input) => execFileSync(process.execPath, [script, ...args], {
  input, encoding: 'utf8', timeout: 5000, maxBuffer: 65536, stdio: ['pipe', 'pipe', 'pipe']
}).trim();

test('fresh generator processes give exact same candidate before separate evaluations', () => {
  const candidateLines = ['pending', 'matching', 'differing'].map(() => run(['generate']));
  assert.equal(new Set(candidateLines).size, 1);
  const candidate = JSON.parse(candidateLines[0]);
  const statuses = ['pending', 'matching', 'differing'].map(mode => {
    const result = JSON.parse(run(['evaluate', mode], `${candidateLines[0]}\n`));
    assert.equal(result.candidateFingerprint, candidate.fingerprint);
    return result.evaluation.status;
  });
  assert.deepEqual(statuses, ['UNKNOWN_NO_OBSERVATION', 'MATCH_IN_MODEL_CONTROL', 'MISMATCH_IN_MODEL_CONTROL']);
  assert.equal(run(['generate']), candidateLines[0]);
});

test('process evaluator rejects a different input binding and modified candidate', () => {
  const otherInput = JSON.stringify(predictMacro(createInitialState(2), 'A000'));
  assert.throws(() => run(['evaluate', 'matching'], `${otherInput}\n`), error =>
    error.stderr.toString().includes('Candidate is not bound to this synthetic input'));
  const changed = JSON.parse(run(['generate']));
  changed.expected.totalSignal += 1;
  assert.throws(() => run(['evaluate', 'matching'], `${JSON.stringify(changed)}\n`), error =>
    error.stderr.toString().includes('Prediction fingerprint or contract mismatch'));
  assert.throws(() => run(['evaluate', 'matching'], ''), error =>
    error.stderr.toString().includes('Candidate is not bound to this synthetic input'));
});
