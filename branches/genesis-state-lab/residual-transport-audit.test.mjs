import test from 'node:test';
import assert from 'node:assert/strict';
import { auditResidualTransport } from './residual-transport-audit.js';

test('one binary tick collides but two reconstruct the same three-preimage fiber', () => {
  const one = auditResidualTransport(2, 1);
  assert.equal(one.capacity, 2);
  assert.equal(one.minimumTicks, 2);
  assert.equal(one.status, 'COLLISION_IN_BOUND_FIBER');
  assert.deepEqual(one.collisionPairs, [[2, 4]]);
  assert.deepEqual(one.rows.map(row => row.restoredSignal), [2, 3, 2]);
  assert.equal(one.exactRoundTrips, 2);
  const two = auditResidualTransport(2, 2);
  assert.equal(two.status, 'LOSSLESS_IN_BOUND_FIBER');
  assert.deepEqual(two.rows.map(row => row.symbols), [[0, 0], [0, 1], [1, 0]]);
  assert.deepEqual(two.rows.map(row => row.restoredSignal), [2, 3, 4]);
  assert.equal(two.exactRoundTrips, 3);
  assert.equal(two.claimCeiling, 'EXACT_ONLY_FOR_THREE_PREIMAGE_SYNTHETIC_FIBER');
});

test('one ternary tick can carry all ranks; invalid and fractional widths fail', () => {
  const wide = auditResidualTransport(3, 1);
  assert.equal(wide.minimumTicks, 1);
  assert.equal(wide.exactRoundTrips, 3);
  assert.deepEqual(wide.rows.map(row => row.symbols), [[0], [1], [2]]);
  assert.throws(() => auditResidualTransport(1, 2), /Width/);
  assert.throws(() => auditResidualTransport(2.5, 2), /Width/);
  assert.throws(() => auditResidualTransport(2, 0), /Ticks/);
  assert.throws(() => auditResidualTransport(2, 1.5), /Ticks/);
});
