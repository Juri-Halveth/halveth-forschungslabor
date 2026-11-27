import test from 'node:test';
import assert from 'node:assert/strict';
import { appendImpulse, createSession } from './model.js';
import { createGenesisResearchHandoff } from './handoff.js';

test('research handoff leaves all external-effect axes open before and after an impulse', () => {
  const initial = createSession(1);
  const before = createGenesisResearchHandoff(initial);
  assert.equal(before.navigation.nextId, 'result');
  assert.equal(before.input.evidenceState, 'UNKNOWN');
  assert.equal(before.sourceEventId, null);
  assert.deepEqual(before.openAxes, ['MATERIALIZATION_BRIDGE', 'IMPACT', 'UNKNOWN_FRONTIER']);

  const after = createGenesisResearchHandoff(appendImpulse(initial, 'A001'));
  assert.equal(after.navigation.outcome, 'FINITE_SNAPSHOT');
  assert.equal(after.claimCeiling, 'SYNTHETIC_LOCAL_MODEL_ONLY');
  assert.equal(after.actionClass, 'LOCAL_PLANNING_ONLY');
  assert.equal(after.input.axisStates.MATERIALIZATION_BRIDGE, 'UNKNOWN');
  assert.equal(after.input.axisStates.IMPACT, 'UNKNOWN');
  assert.equal(after.input.evidenceState, 'OBSERVED');
  assert.match(after.input.scope, /Nur der lokale/);
  assert.equal(initial.events.length, 0);
});

test('tampered Genesis history cannot produce a research handoff', () => {
  const history = structuredClone(appendImpulse(createSession(1), 'A001'));
  history.events[0].afterContentId = 'S-invalid';
  assert.throws(() => createGenesisResearchHandoff(history), /replay failed/);
});
