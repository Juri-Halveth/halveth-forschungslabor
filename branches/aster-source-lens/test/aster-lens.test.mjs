// SPDX-License-Identifier: MIT
import assert from 'node:assert/strict';
import test from 'node:test';
import { createWaveSeed, inspectWithAster } from '../src/aster-lens.mjs';

const a = 'a'.repeat(64);
const b = 'b'.repeat(64);
const frame = (previous = a, current = b) => ({
  source: { ref: 'synthetic:source', evidenceState: 'OBSERVED', digest: a },
  representation: { ref: 'synthetic:view', evidenceState: 'OBSERVED', digest: b },
  previousTrace: { ref: 'synthetic:t0', evidenceState: 'OBSERVED', digest: previous },
  currentState: { ref: 'synthetic:t1', evidenceState: 'OBSERVED', digest: current },
  openQuestions: ['Which observation would distinguish the explanations?']
});

test('four source addresses remain distinct and the input is not mutated', () => {
  const input = frame();
  const before = JSON.stringify(input);
  const result = inspectWithAster(input);
  assert.deepEqual(Object.keys(result.addresses), ['source', 'representation', 'previousTrace', 'currentState']);
  assert.equal(JSON.stringify(input), before);
  assert.equal(result.addresses.source.ref, 'synthetic:source');
  assert.equal(result.addresses.representation.ref, 'synthetic:view');
});

test('unequal digests establish a byte difference without a causal claim', () => {
  const result = inspectWithAster(frame());
  assert.equal(result.traceComparison, 'DIFFERENT_DIGEST');
  assert.equal(result.causalDirection, 'UNBOUND');
  assert.equal(result.transferMechanism, 'UNBOUND');
});

test('equal digests and missing digests remain different outcomes', () => {
  assert.equal(inspectWithAster(frame(a, a)).traceComparison, 'SAME_DIGEST');
  const missing = frame();
  delete missing.currentState.digest;
  assert.equal(inspectWithAster(missing).traceComparison, 'UNKNOWN');
});

test('unsupported evidence states and malformed digests fail', () => {
  const state = frame();
  state.source.evidenceState = 'TRUE';
  assert.throws(() => inspectWithAster(state), /unsupported/u);
  const badDigest = frame();
  badDigest.currentState.digest = 'abc';
  assert.throws(() => inspectWithAster(badDigest), /SHA-256/u);
});

test('wave seed preserves the required proof and reopen fields without external authority', () => {
  const seed = createWaveSeed({ id: 'synthetic-1', publicSurface: 'demo', proofUnit: 'one tested property', reopenTrigger: 'counterexample' });
  assert.equal(seed.claimState, 'LOCAL_DRAFT_ONLY');
  assert.equal(seed.proofUnit, 'one tested property');
  assert.equal(seed.reopenTrigger, 'counterexample');
  assert.throws(() => createWaveSeed({ id: 'x', publicSurface: '', proofUnit: 'p', reopenTrigger: 'r' }), /publicSurface/u);
});
