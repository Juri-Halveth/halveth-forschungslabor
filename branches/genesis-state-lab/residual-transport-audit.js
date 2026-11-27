// Transport only the residual rank of the three-preimage saturation fiber.
// A narrow channel can preserve it with enough ticks; this is a finite code, not physics.
import { canonical } from './model.js';
import { createFiniteSaturationCodec } from './preimage-audit.js';

export function auditResidualTransport(width, ticks) {
  if (!Number.isInteger(width) || width < 2 || width > 4) throw new TypeError('Width must be an integer from 2 to 4');
  if (!Number.isInteger(ticks) || ticks < 1 || ticks > 4) throw new TypeError('Ticks must be an integer from 1 to 4');
  const codec = createFiniteSaturationCodec();
  const sourceSignals = codec.fibers.find(fiber => fiber.beforeSignals.length === codec.maxPreimage)?.beforeSignals;
  if (!sourceSignals || codec.maxPreimage !== 3) throw new TypeError('Expected the bound three-preimage fiber');
  const sourceStates = sourceSignals.map(signal => codec.encode(signal));
  if (new Set(sourceStates.map(item => canonical(item.afterState))).size !== 1) {
    throw new TypeError('Source signals are not one common after-state fiber');
  }
  const rows = sourceSignals.map((beforeSignal, index) => {
    const encoded = sourceStates[index];
    const symbols = Array.from({ length: ticks }, (_, tick) => Math.floor(encoded.residualRank / width ** (ticks - tick - 1)) % width);
    const receivedRank = symbols.reduce((sum, symbol) => sum * width + symbol, 0);
    const restoredSignal = codec.decode(encoded.afterState, receivedRank);
    return { beforeSignal, residualRank: encoded.residualRank, symbols, receivedRank, restoredSignal,
      exactRoundTrip: restoredSignal === beforeSignal };
  });
  const collisionPairs = [];
  for (let left = 0; left < rows.length; left += 1) {
    for (let right = left + 1; right < rows.length; right += 1) {
      if (canonical(rows[left].symbols) === canonical(rows[right].symbols)) {
        collisionPairs.push([rows[left].beforeSignal, rows[right].beforeSignal]);
      }
    }
  }
  let minimumTicks = 1;
  while (width ** minimumTicks < sourceSignals.length) minimumTicks += 1;
  return Object.freeze({ schema: 'genesis.residual-transport-audit.v1', width, ticks,
    sourceSignals: Object.freeze([...sourceSignals]), capacity: width ** ticks, minimumTicks,
    rows: Object.freeze(rows), collisionPairs: Object.freeze(collisionPairs),
    exactRoundTrips: rows.filter(row => row.exactRoundTrip).length,
    status: collisionPairs.length ? 'COLLISION_IN_BOUND_FIBER' : 'LOSSLESS_IN_BOUND_FIBER',
    claimCeiling: 'EXACT_ONLY_FOR_THREE_PREIMAGE_SYNTHETIC_FIBER' });
}
