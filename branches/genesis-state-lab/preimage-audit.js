// A reversible lift for one explicitly enumerated five-state family.
// It is not an inverse of the full Genesis transition.
import { applyImpulse, canonical, contentId, createGraph, createInitialState, validateState } from './model.js';

export function createFiniteSaturationCodec() {
  const graph = createGraph();
  const baseline = createInitialState(1);
  const entries = [];
  const fibers = new Map();
  for (let signal = 0; signal <= 4; signal += 1) {
    const before = structuredClone(baseline);
    before.agents[1].signal = signal;
    before.agents[1].gate = 1;
    const after = applyImpulse(before, graph, 'A001', 1).state;
    const afterKey = canonical(after);
    if (!fibers.has(afterKey)) fibers.set(afterKey, []);
    const fiber = fibers.get(afterKey);
    const record = { signal, before, after, afterKey, residualRank: fiber.length };
    fiber.push(record);
    entries.push(record);
  }
  const maxPreimage = Math.max(...[...fibers.values()].map(fiber => fiber.length));
  const minimumBits = Math.ceil(Math.log2(maxPreimage));
  return {
    familySize: entries.length,
    maxPreimage,
    minimumBits,
    fibers: [...fibers.values()].map(fiber => ({
      beforeSignals: fiber.map(entry => entry.signal),
      afterActorSignal: fiber[0].after.agents[1].signal,
      afterActorGate: fiber[0].after.agents[1].gate,
      afterContentId: contentId(fiber[0].after)
    })),
    encode(signal) {
      if (!Number.isInteger(signal) || signal < 0 || signal > 4) throw new TypeError('Signal outside the bound family');
      const record = entries[signal];
      return { afterState: structuredClone(record.after), residualRank: record.residualRank, residualBits: minimumBits };
    },
    decode(afterState, residualRank) {
      validateState(afterState);
      if (!Number.isInteger(residualRank) || residualRank < 0) throw new TypeError('Invalid residual rank');
      const fiber = fibers.get(canonical(afterState));
      if (!fiber || residualRank >= fiber.length) throw new TypeError('No matching preimage in the bound family');
      return fiber[residualRank].signal;
    }
  };
}

export function saturationFiberAudit() {
  const codec = createFiniteSaturationCodec();
  let roundTrips = 0;
  for (let signal = 0; signal < codec.familySize; signal += 1) {
    const encoded = codec.encode(signal);
    if (codec.decode(encoded.afterState, encoded.residualRank) === signal) roundTrips += 1;
  }
  return {
    schema: 'genesis.saturation-fiber-audit.v1', actorId: 'A001',
    variedField: 'signal', fixedGate: 1, familySize: codec.familySize,
    maxPreimage: codec.maxPreimage, minimumBits: codec.minimumBits,
    fibers: codec.fibers, roundTrips,
    claimCeiling: 'EXACT_ONLY_FOR_THIS_FIVE_STATE_FAMILY'
  };
}
