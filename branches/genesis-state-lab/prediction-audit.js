// A small, local separation between a model prediction and a later observation.
// Neither the fingerprint nor a matching synthetic control is external proof.
import { applyImpulse, canonical, checksum, contentId, createGraph, macroProjection, validateState } from './model.js';

const SCHEMA = 'genesis.prediction.v1';

export function predictMacro(beforeState, actorId) {
  validateState(beforeState);
  const after = applyImpulse(beforeState, createGraph(), actorId, 1).state;
  const fields = {
    schema: SCHEMA,
    actorId,
    beforeContentId: contentId(beforeState),
    expected: macroProjection(after),
    observationRule: 'genesis.macro-projection.v1'
  };
  // Object freezing protects this in-memory instance; the checksum is a local
  // change indicator, not a signature or a secure timestamp.
  return Object.freeze({ ...fields, expected: Object.freeze(fields.expected), fingerprint: checksum(fields) });
}

export function evaluateMacroPrediction(prediction, observedState = null) {
  if (!prediction || typeof prediction !== 'object' || Array.isArray(prediction)) throw new TypeError('Invalid prediction');
  const { fingerprint, ...fields } = prediction;
  if (fields.schema !== SCHEMA || fields.observationRule !== 'genesis.macro-projection.v1'
    || Object.keys(fields).length !== 5 || typeof fingerprint !== 'string'
    || fingerprint !== checksum(fields)) throw new TypeError('Prediction fingerprint or contract mismatch');
  if (observedState === null) {
    return { schema: 'genesis.prediction-evaluation.v1', status: 'UNKNOWN_NO_OBSERVATION',
      predictionFingerprint: fingerprint, observationKind: null, observed: null };
  }
  validateState(observedState);
  const observed = macroProjection(observedState);
  return {
    schema: 'genesis.prediction-evaluation.v1',
    status: canonical(fields.expected) === canonical(observed) ? 'MATCH_IN_MODEL_CONTROL' : 'MISMATCH_IN_MODEL_CONTROL',
    predictionFingerprint: fingerprint,
    observationKind: 'MODEL_CONTROL',
    observed
  };
}

export function predictionControlAudit(beforeState, actorId) {
  const prediction = predictMacro(beforeState, actorId);
  const beforeCandidate = canonical(prediction);
  const matchingState = applyImpulse(beforeState, createGraph(), actorId, 1).state;
  const differentState = structuredClone(matchingState);
  const index = Number(actorId.slice(1));
  const signal = differentState.agents[index].signal;
  differentState.agents[index].signal = signal > 0 ? signal - 1 : signal + 1;
  const pending = evaluateMacroPrediction(prediction);
  const matching = evaluateMacroPrediction(prediction, matchingState);
  const differing = evaluateMacroPrediction(prediction, differentState);
  if (canonical(matching.observed) === canonical(differing.observed)) {
    throw new TypeError('The chosen control does not separate this projected outcome');
  }
  return {
    schema: 'genesis.prediction-control-audit.v1',
    prediction,
    pending, matching, differing,
    candidateUnchanged: canonical(prediction) === beforeCandidate,
    controlSetup: 'SAME_BEFORE_AND_INPUT_VS_ONE_SIGNAL_CHANGED_IN_SYNTHETIC_OUTCOME',
    claimCeiling: 'SYNTHETIC_MODEL_CONTROL_ONLY'
  };
}
