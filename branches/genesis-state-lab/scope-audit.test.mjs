import test from 'node:test';
import assert from 'node:assert/strict';
import { auditFiniteScope, observeScope, SCOPE_MODES } from './scope-audit.js';
import { applyImpulse, canonical, createGraph, createInitialState } from './model.js';

function stateFromId(id) {
  const match = /^A000:(\d)\/(\d) · A001:(\d)\/(\d)$/.exec(id);
  assert.ok(match, `invalid witness state ID: ${id}`);
  const state = createInitialState(1);
  state.agents[0].signal = Number(match[1]);
  state.agents[0].gate = Number(match[2]);
  state.agents[1].signal = Number(match[3]);
  state.agents[1].gate = Number(match[4]);
  return state;
}

test('each reported divergence is a real same-view pair under one identical input', () => {
  const audit = auditFiniteScope();
  assert.equal(audit.stateCount, 100);
  assert.deepEqual(audit.inputs, ['A000', 'A001']);
  assert.equal(audit.fixedAgents, 98);
  assert.equal(audit.claimCeiling, 'ONLY_THE_ENUMERATED_100_STATES_AND_TWO_INPUTS');
  for (const mode of SCOPE_MODES) {
    const result = audit.modes[mode];
    if (!result.witness) continue;
    const { input, before, left, right } = result.witness;
    const stateA = stateFromId(left.id);
    const stateB = stateFromId(right.id);
    assert.notEqual(canonical(stateA), canonical(stateB));
    assert.deepEqual(observeScope(stateA, mode, input), before);
    assert.deepEqual(observeScope(stateB, mode, input), before);
    const nextA = applyImpulse(stateA, createGraph(), input, 1).state;
    const nextB = applyImpulse(stateB, createGraph(), input, 1).state;
    assert.deepEqual(observeScope(nextA, mode, input), left.after);
    assert.deepEqual(observeScope(nextB, mode, input), right.after);
    assert.notEqual(canonical(left.after), canonical(right.after));
  }
});

test('one repaired pair is not promoted to global closure', () => {
  const audit = auditFiniteScope();
  assert.equal(audit.modes.SIGNALS_ONLY.status, 'COUNTEREXAMPLE_IN_SCOPE');
  assert.equal(audit.modes.ACTING_GATE.status, 'COUNTEREXAMPLE_IN_SCOPE');
  assert.equal(audit.modes.BOTH_GATES.status, 'COUNTEREXAMPLE_IN_SCOPE');
  assert.equal(audit.modes.LOCAL_FULL.status, 'NO_COUNTEREXAMPLE_IN_SCOPE');
  assert.equal(audit.modes.LOCAL_FULL.ambiguousClasses, 0);
  assert.equal(audit.modes.LOCAL_FULL.classes, audit.stateCount * audit.inputCount);
  assert.equal(canonical(auditFiniteScope()), canonical(audit));
  assert.throws(() => observeScope(createInitialState(), 'OTHER', 'A000'));
  assert.throws(() => observeScope(createInitialState(), 'SIGNALS_ONLY', 'A099'));
});
