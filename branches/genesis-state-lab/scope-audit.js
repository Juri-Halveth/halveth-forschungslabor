// A finite, input-conditioned observation audit. The sample is deliberately
// small; a clean result never claims closure over all Genesis states.
import { applyImpulse, canonical, createGraph, createInitialState, macroProjection } from './model.js';

export const SCOPE_MODES = Object.freeze([
  'SIGNALS_ONLY', 'ACTING_GATE', 'BOTH_GATES', 'LOCAL_FULL'
]);
const INPUTS = Object.freeze(['A000', 'A001']);
const LOCAL_IDS = Object.freeze(['A000', 'A001']);

function enumerate() {
  const baseline = createInitialState(1);
  const candidates = [];
  for (let signalA = 0; signalA <= 4; signalA += 1) {
    for (let gateA = 0; gateA <= 1; gateA += 1) {
      for (let signalB = 0; signalB <= 4; signalB += 1) {
        for (let gateB = 0; gateB <= 1; gateB += 1) {
          const state = structuredClone(baseline);
          state.agents[0].signal = signalA;
          state.agents[0].gate = gateA;
          state.agents[1].signal = signalB;
          state.agents[1].gate = gateB;
          candidates.push({
            id: `A000:${signalA}/${gateA} · A001:${signalB}/${gateB}`,
            state
          });
        }
      }
    }
  }
  return candidates;
}

export function observeScope(state, mode, input) {
  if (!SCOPE_MODES.includes(mode) || !INPUTS.includes(input)) throw new TypeError('Unsupported observation contract');
  const summary = macroProjection(state);
  if (mode === 'SIGNALS_ONLY') return summary;
  if (mode === 'ACTING_GATE') return { ...summary, actingGate: state.agents[Number(input.slice(1))].gate };
  if (mode === 'BOTH_GATES') return { ...summary, gates: LOCAL_IDS.map((_, index) => state.agents[index].gate) };
  return { ...summary, localAgents: LOCAL_IDS.map((id, index) => ({ id, signal: state.agents[index].signal, gate: state.agents[index].gate })) };
}

export function auditFiniteScope() {
  const candidates = enumerate();
  const graph = createGraph();
  const successors = new Map();
  for (const input of INPUTS) {
    for (const candidate of candidates) {
      successors.set(`${input}|${candidate.id}`, applyImpulse(candidate.state, graph, input, 1).state);
    }
  }
  const modes = Object.fromEntries(SCOPE_MODES.map(mode => {
    let classes = 0;
    let ambiguousClasses = 0;
    let divergentClasses = 0;
    let witness = null;
    for (const input of INPUTS) {
      const groups = new Map();
      for (const candidate of candidates) {
        const before = observeScope(candidate.state, mode, input);
        const key = canonical(before);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({ candidate, before,
          after: observeScope(successors.get(`${input}|${candidate.id}`), mode, input) });
      }
      classes += groups.size;
      for (const group of groups.values()) {
        if (group.length > 1) ambiguousClasses += 1;
        const firstByAfter = new Map();
        for (const item of group) {
          const afterKey = canonical(item.after);
          if (!firstByAfter.has(afterKey)) firstByAfter.set(afterKey, item);
        }
        if (firstByAfter.size > 1) {
          divergentClasses += 1;
          if (!witness) {
            const [left, right] = [...firstByAfter.values()];
            witness = { input, before: left.before, left: { id: left.candidate.id, after: left.after },
              right: { id: right.candidate.id, after: right.after } };
          }
        }
      }
    }
    return [mode, {
      mode, classes, ambiguousClasses, divergentClasses, witness,
      status: witness ? 'COUNTEREXAMPLE_IN_SCOPE' : 'NO_COUNTEREXAMPLE_IN_SCOPE'
    }];
  }));
  return {
    schema: 'genesis.finite-scope-audit.v1', stateCount: candidates.length,
    inputCount: INPUTS.length, inputs: [...INPUTS], variedAgents: [...LOCAL_IDS],
    fixedAgents: 98, modes,
    claimCeiling: 'ONLY_THE_ENUMERATED_100_STATES_AND_TWO_INPUTS'
  };
}
