// An independent, finite comparator for paired model scores.
// Its decision labels are about a declared rule, not an information channel.
export function comparePairedScores(original, control, { minimumMeanAdvantage = 0.5 } = {}) {
  if (!Array.isArray(original) || !Array.isArray(control) || original.length === 0
    || original.length !== control.length) throw new TypeError('Expected two equally long, nonempty score series');
  if (typeof minimumMeanAdvantage !== 'number' || !Number.isFinite(minimumMeanAdvantage)
    || minimumMeanAdvantage <= 0) throw new TypeError('Minimum mean advantage must be finite and positive');
  for (let index = 0; index < original.length; index += 1) {
    if (!Object.hasOwn(original, index) || !Object.hasOwn(control, index)) {
      throw new TypeError(`Sparse paired score at ${index}`);
    }
  }
  const differences = original.map((value, index) => {
    const other = control[index];
    if (typeof value !== 'number' || typeof other !== 'number'
      || !Number.isFinite(value) || !Number.isFinite(other)) throw new TypeError(`Invalid paired score at ${index}`);
    const difference = value - other;
    if (!Number.isFinite(difference)) throw new TypeError(`Difference exceeds finite range at ${index}`);
    return difference;
  });
  const meanDifference = differences.reduce((sum, value) => sum + value, 0) / differences.length;
  if (!Number.isFinite(meanDifference)) throw new TypeError('Mean difference exceeds finite range');
  const originalWins = differences.filter(value => value > 0).length;
  const controlWins = differences.filter(value => value < 0).length;
  const originalMeetsRule = meanDifference >= minimumMeanAdvantage && originalWins > differences.length / 2;
  const controlMeetsRule = meanDifference <= -minimumMeanAdvantage && controlWins > differences.length / 2;
  const status = originalMeetsRule ? 'ORIGINAL_MEETS_DECLARED_RULE'
    : controlMeetsRule ? 'CONTROL_MEETS_DECLARED_RULE'
      : Math.abs(meanDifference) < minimumMeanAdvantage ? 'BELOW_DECLARED_THRESHOLD'
        : 'MIXED_OR_INSUFFICIENT_MAJORITY';
  return Object.freeze({
    schema: 'genesis.paired-score-audit.v1', status,
    n: differences.length, minimumMeanAdvantage, meanDifference,
    originalWins, controlWins, ties: differences.length - originalWins - controlWins,
    differences: Object.freeze(differences), claimCeiling: 'DECLARED_FINITE_SERIES_ONLY'
  });
}

export const pairedScoreExamples = Object.freeze({
  mixed: Object.freeze({ original: Object.freeze([2, 0, 0]), control: Object.freeze([0, 0, 0]), label: 'Ein großer, zwei neutrale Paare' }),
  original: Object.freeze({ original: Object.freeze([1, 1, 1]), control: Object.freeze([0, 0, 0]), label: 'Drei konsistente Vorsprünge' }),
  control: Object.freeze({ original: Object.freeze([0, 0, 0]), control: Object.freeze([1, 1, 1]), label: 'Drei konsistente Kontrollvorsprünge' }),
  below: Object.freeze({ original: Object.freeze([0.2, 0.2, 0.2]), control: Object.freeze([0, 0, 0]), label: 'Drei kleine Vorsprünge unter Schwelle' })
});
