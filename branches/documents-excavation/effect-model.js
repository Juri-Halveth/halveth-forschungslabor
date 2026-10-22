// A pure, synthetic model. Declared fields are not verified authority or events.
const TRI = new Set([true, false, null]);

function tri(value, name) {
  if (!TRI.has(value)) throw new TypeError(`${name} must be true, false, or null`);
  return value;
}

/**
 * Explore two independent questions about a continuing effect:
 * 1. Is its authority still current? 2. Does it act in the granted scope?
 * No external action, identity check, or legal/security conclusion follows.
 */
export function evaluateContinuingEffect(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('A plain effect record is required');
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('A plain effect record is required');
  }
  if (Object.getOwnPropertySymbols(input).length) {
    throw new TypeError('Symbol fields are not part of the record');
  }
  const allowed = new Set([
    'effectActive', 'grantAtOrigin', 'grantNow', 'scopeMatches',
    'explicitContinuity',
  ]);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) throw new TypeError(`Unexpected field: ${key}`);
  }
  for (const key of allowed) {
    if (!Object.hasOwn(input, key)) throw new TypeError(`Missing field: ${key}`);
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!Object.hasOwn(descriptor, 'value')) throw new TypeError(`Accessor field: ${key}`);
    tri(descriptor.value, key);
  }

  const signals = [];
  if (input.effectActive === false) {
    return {state: 'NO_ACTIVE_EFFECT_DECLARED', signals, nextQuestion: 'Welche Wirkung wird noch beobachtet?'};
  }
  if (input.effectActive === null) {
    return {state: 'UNKNOWN', signals: ['EFFECT_ACTIVITY_UNBOUND'], nextQuestion: 'Läuft die Wirkung noch?'};
  }

  if (input.grantAtOrigin === false) signals.push('ORIGIN_AUTHORITY_CONTRADICTED');
  if (input.grantAtOrigin === null) signals.push('ORIGIN_AUTHORITY_UNBOUND');
  if (input.scopeMatches === false) signals.push('DISPLACED_EFFECT_CANDIDATE');
  if (input.scopeMatches === null) signals.push('SCOPE_UNBOUND');
  if (input.grantNow === false && input.explicitContinuity === false) signals.push('ORPHANED_PURPOSE_CANDIDATE');
  if (input.grantNow === false && input.explicitContinuity === true) signals.push('CONTINUITY_CONFLICT_CANDIDATE');
  if (input.grantNow === false && input.explicitContinuity === null) signals.push('CONTINUITY_RULE_UNBOUND');
  if (input.grantNow === null) signals.push('CURRENT_AUTHORITY_UNBOUND');
  if (input.explicitContinuity === true) signals.push('CONTINUITY_RULE_DECLARED');

  const candidate = signals.some((item) => item.endsWith('_CANDIDATE') || item.endsWith('_CONTRADICTED'));
  const unknown = signals.some((item) => item.endsWith('_UNBOUND'));
  if (candidate) {
    return {
      state: unknown ? 'REVIEW_WITH_OPEN_EVIDENCE' : 'REVIEW_CANDIDATE',
      signals,
      nextQuestion: 'Welche Quelle bindet Zeit, Scope und fortlaufende Autorität dieser Wirkung?',
    };
  }
  if (unknown) {
    return {state: 'UNKNOWN', signals, nextQuestion: 'Welche fehlende Beobachtung unterscheidet die Kandidaten?'};
  }
  return {
    state: input.explicitContinuity === true ? 'CONTINUITY_WITH_CURRENT_AUTHORITY_DECLARED' : 'CURRENT_AUTHORITY_DECLARED',
    signals,
    nextQuestion: 'Ist die deklarierte Regel durch eine zuständige Quelle belegt?',
  };
}

export const SCENARIOS = Object.freeze({
  current: Object.freeze({effectActive: true, grantAtOrigin: true, grantNow: true, scopeMatches: true, explicitContinuity: false}),
  time: Object.freeze({effectActive: true, grantAtOrigin: true, grantNow: false, scopeMatches: true, explicitContinuity: false}),
  context: Object.freeze({effectActive: true, grantAtOrigin: true, grantNow: true, scopeMatches: false, explicitContinuity: false}),
  both: Object.freeze({effectActive: true, grantAtOrigin: true, grantNow: false, scopeMatches: false, explicitContinuity: false}),
  continuity: Object.freeze({effectActive: true, grantAtOrigin: true, grantNow: true, scopeMatches: true, explicitContinuity: true}),
  unknown: Object.freeze({effectActive: true, grantAtOrigin: null, grantNow: null, scopeMatches: null, explicitContinuity: null}),
});
