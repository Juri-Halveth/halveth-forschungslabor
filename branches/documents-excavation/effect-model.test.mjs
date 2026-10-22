import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateContinuingEffect, SCENARIOS} from './effect-model.js';

test('time and context are independent candidate signals', () => {
  const result = evaluateContinuingEffect(SCENARIOS.both);
  assert.equal(result.state, 'REVIEW_CANDIDATE');
  assert.deepEqual(result.signals, ['DISPLACED_EFFECT_CANDIDATE', 'ORPHANED_PURPOSE_CANDIDATE']);
});

test('continuity needs current authority and does not erase a context mismatch', () => {
  assert.equal(evaluateContinuingEffect(SCENARIOS.continuity).state, 'CONTINUITY_WITH_CURRENT_AUTHORITY_DECLARED');
  const displaced = evaluateContinuingEffect({...SCENARIOS.continuity, scopeMatches: false});
  assert.deepEqual(displaced.signals, ['DISPLACED_EFFECT_CANDIDATE', 'CONTINUITY_RULE_DECLARED']);
  const contradiction = evaluateContinuingEffect({...SCENARIOS.continuity, grantNow: false});
  assert.equal(contradiction.state, 'REVIEW_CANDIDATE');
  assert.ok(contradiction.signals.includes('CONTINUITY_CONFLICT_CANDIDATE'));
});

test('missing observations stay unknown and cannot become a pass', () => {
  const result = evaluateContinuingEffect(SCENARIOS.unknown);
  assert.equal(result.state, 'UNKNOWN');
  assert.ok(result.signals.includes('SCOPE_UNBOUND'));
  assert.ok(result.signals.includes('CURRENT_AUTHORITY_UNBOUND'));
});

test('inactive or unobserved effects do not invent continuing authority issues', () => {
  assert.equal(evaluateContinuingEffect({...SCENARIOS.time, effectActive: false}).state, 'NO_ACTIVE_EFFECT_DECLARED');
  assert.deepEqual(evaluateContinuingEffect({...SCENARIOS.time, effectActive: null}).signals, ['EFFECT_ACTIVITY_UNBOUND']);
});

test('reject malformed or silently expanded records', () => {
  assert.throws(() => evaluateContinuingEffect({}), /Missing field/);
  assert.throws(() => evaluateContinuingEffect({...SCENARIOS.current, effectActive: 'true'}), /true, false, or null/);
  assert.throws(() => evaluateContinuingEffect({...SCENARIOS.current, approval: true}), /Unexpected field/);
  assert.throws(() => evaluateContinuingEffect(Object.assign(new Date(), SCENARIOS.current)), /plain effect record/);
  const withGetter = {...SCENARIOS.current};
  Object.defineProperty(withGetter, 'grantNow', {get() { throw new Error('should not run'); }});
  assert.throws(() => evaluateContinuingEffect(withGetter), /Accessor field/);
});
