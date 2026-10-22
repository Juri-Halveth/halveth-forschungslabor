// Typed, local bridge to the existing research navigator. A model receipt is
// never converted into authority, external evidence, or publication consent.
import { TRACKS, evaluateNavigation } from '../next-action-navigator/model.js';
import { replay, scopeCounterexample } from './model.js';

const UNKNOWN_AXES = ['MATERIALIZATION_BRIDGE', 'IMPACT', 'UNKNOWN_FRONTIER'];

export function createGenesisResearchHandoff(session) {
  const receipt = replay(session);
  if (!receipt.ok) throw new TypeError(`Genesis replay failed: ${receipt.reason}`);
  const counterexample = scopeCounterexample();
  if (!counterexample.counterexample) throw new TypeError('Genesis counterexample failed');

  const axisStates = Object.fromEntries(TRACKS.research.axes.map(axis => [axis, 'UNKNOWN']));
  for (const axis of ['SOURCE', 'DEFINITION', 'MECHANISM', 'COUNTERHYPOTHESIS']) axisStates[axis] = 'STABLE';
  axisStates.OBSERVATION = receipt.steps > 0 ? 'STABLE' : 'MATERIAL_CANDIDATE';

  const input = {
    track: 'research',
    goal: 'Prüfen, welche Zustandsprojektion den nächsten Modellschritt vorhersagt.',
    source: 'Genesis State Lab v1: synthetischer Graph, Transition und gebundene Anfangsfassung.',
    scope: 'Nur der lokale deterministische 100-Agenten-Testdatensatz.',
    axisStates,
    hypothesis: 'Die grobe Projektion aus Signalzahlen genügt für den nächsten groben Zustand.',
    counter: 'Ein verborgenes Gate kann bei gleicher grober Gegenwart eine andere grobe Folge erzeugen.',
    check: 'Zwei vollständige Zustände mit gleicher grober Projektion erhalten denselben Impuls.',
    result: receipt.steps > 0
      ? `Lokales Replay von ${receipt.steps} Ereignissen konsistent; Gate-Gegenbeispiel liefert 3 gegen 2 Gesamtsignale.`
      : '',
    evidenceState: receipt.steps > 0 ? 'OBSERVED' : 'UNKNOWN',
    reopen: 'Eine neue Makroprojektion, abweichende Transition oder gebundene Außenmessung liegt vor.'
  };

  const navigation = evaluateNavigation(input);
  return {
    schema: 'genesis.research-handoff.v1',
    sourceEventId: receipt.lastEventId,
    sourceContentId: receipt.finalContentId,
    counterexample: true,
    openAxes: UNKNOWN_AXES,
    recommendedCheck: receipt.steps > 0
      ? 'Gate-Information in eine zweite Makroprojektion aufnehmen und denselben Impuls erneut vergleichen.'
      : 'Einen ersten lokalen Impuls auslösen und seinen Replay-Beleg ansehen.',
    claimCeiling: 'SYNTHETIC_LOCAL_MODEL_ONLY',
    actionClass: 'LOCAL_PLANNING_ONLY',
    input,
    navigation
  };
}
