import test from 'node:test';
import assert from 'node:assert/strict';
import { createFiniteSaturationCodec, saturationFiberAudit } from './preimage-audit.js';
import { canonical, createInitialState } from './model.js';

test('the saturated actor has three distinct preimages and needs two residual bits in this family', () => {
  const audit = saturationFiberAudit();
  assert.equal(audit.familySize, 5);
  assert.deepEqual(audit.fibers.map(fiber => fiber.beforeSignals), [[0], [1], [2, 3, 4]]);
  assert.equal(audit.maxPreimage, 3);
  assert.equal(audit.minimumBits, 2);
  assert.ok(2 ** (audit.minimumBits - 1) < audit.maxPreimage);
  assert.ok(2 ** audit.minimumBits >= audit.maxPreimage);
  assert.equal(audit.roundTrips, 5);
  assert.equal(audit.claimCeiling, 'EXACT_ONLY_FOR_THIS_FIVE_STATE_FAMILY');
});

test('the finite decoder reconstructs every bound signal and rejects missing or forged residuals', () => {
  const codec = createFiniteSaturationCodec();
  const after = [];
  for (let signal = 0; signal < 5; signal += 1) {
    const encoded = codec.encode(signal);
    assert.equal(codec.decode(encoded.afterState, encoded.residualRank), signal);
    after.push(encoded.afterState);
  }
  assert.equal(canonical(after[2]), canonical(after[3]));
  assert.equal(canonical(after[3]), canonical(after[4]));
  assert.notEqual(canonical(after[1]), canonical(after[2]));
  assert.throws(() => codec.decode(after[2], 3), /No matching preimage/);
  assert.throws(() => codec.decode(after[2], -1), /Invalid residual rank/);
  assert.throws(() => codec.decode(createInitialState(1), 0), /No matching preimage/);
  assert.throws(() => codec.encode(5), /outside the bound family/);
});
