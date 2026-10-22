import { appendImpulse, createSession, projectEvent, replay, scopeCounterexample } from './model.js';
import { createGenesisResearchHandoff } from './handoff.js';
import { auditFiniteScope } from './scope-audit.js';
import { saturationFiberAudit } from './preimage-audit.js';
import { auditResidualTransport } from './residual-transport-audit.js';
import { predictionControlAudit } from './prediction-audit.js';
import { comparePairedScores, pairedScoreExamples } from './paired-score-audit.js';

const $ = id => document.getElementById(id);
const SVG_NS = 'http://www.w3.org/2000/svg';
const maxSteps = 9999;
let session = createSession(1);
let viewedStep = 0;
let perspective = 'forward';
let replayResult = replay(session);
let researchHandoff = createGenesisResearchHandoff(session);

const graph = session.graph;
const select = $('agent-select');
for (let index = 0; index < 100; index += 1) {
  const id = `A${String(index).padStart(3, '0')}`;
  const option = document.createElement('option');
  option.value = id;
  option.textContent = `Agent ${id}`;
  select.append(option);
}
select.value = 'A001';

function svg(name, attributes) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

function point(id) {
  const index = Number(id.slice(1));
  const angle = (index / 100) * Math.PI * 2 - Math.PI / 2;
  const radius = 270;
  return { x: 320 + radius * Math.cos(angle), y: 320 + radius * Math.sin(angle) };
}

function drawGraph(state, event) {
  const edgeGroup = $('graph-edges');
  const nodeGroup = $('graph-nodes');
  const used = new Set(event?.usedRelations ?? []);
  const highlightedAgent = event?.actorId ?? select.value;
  const edgeElements = graph.relations.map(relation => {
    const start = point(relation.from);
    const end = point(relation.to);
    if (relation.type === 'RELAY') {
      return svg('line', { x1: start.x, y1: start.y, x2: end.x, y2: end.y, class: `edge${used.has(relation.id) ? ' used' : ''}` });
    }
    return svg('path', { d: `M ${start.x} ${start.y} Q 320 320 ${end.x} ${end.y}`, class: `edge echo${used.has(relation.id) ? ' used' : ''}` });
  });
  edgeGroup.replaceChildren(...edgeElements);

  const relayTarget = event?.feedback.relay === 'DELIVERED'
    ? `A${String((Number(event.actorId.slice(1)) + 1) % 100).padStart(3, '0')}` : null;
  const nodeElements = state.agents.map(agent => {
    const position = point(agent.id);
    const classes = ['node'];
    if (agent.signal > 0) classes.push('lit');
    if (agent.id === highlightedAgent) classes.push('selected');
    else if (agent.id === relayTarget) classes.push('relay-target');
    return svg('circle', { cx: position.x, cy: position.y, r: agent.id === highlightedAgent ? 6.5 : agent.signal > 0 ? 4.2 : 2.7, class: classes.join(' ') });
  });
  nodeGroup.replaceChildren(...nodeElements);
  $('selected-legend').textContent = event ? `Ereignisquelle ${highlightedAgent}` : `gewählt ${highlightedAgent}`;
  $('graph-desc').textContent = event
    ? `100 Agenten auf einem Kreis und 120 gerichtete Relationen. Ereignisquelle ${highlightedAgent} und im angezeigten Ereignis genutzte Relationen sind hervorgehoben.`
    : `100 Agenten auf einem Kreis und 120 gerichtete Relationen. Die aktuell gewählte Quelle ${highlightedAgent} ist hervorgehoben.`;
}

function showEvent(event) {
  $('empty-event').hidden = true;
  $('event-detail').hidden = false;
  const view = projectEvent(event, perspective);
  $('event-id').textContent = view.eventId;
  $('perspective-tag').textContent = perspective === 'forward' ? 'VORWÄRTS / AUSGANG' : 'ANTI-DATEI / GEGENANSICHT';
  $('perspective-title').textContent = view.headline;
  $('perspective-text').textContent = view.detail;
  $('before-id').textContent = view.beforeContentId;
  $('after-id').textContent = view.afterContentId;
  $('feedback-value').textContent = `${event.feedback.relay} · ${event.feedback.echo}`;
  $('gate-value').textContent = `${event.context.gateBefore} → ${event.context.gateAfter}`;
  $('forward-button').setAttribute('aria-pressed', String(perspective === 'forward'));
  $('anti-button').setAttribute('aria-pressed', String(perspective === 'anti'));
}

function render() {
  const state = session.states[viewedStep];
  const event = viewedStep > 0 ? session.events[viewedStep - 1] : null;
  const result = replayResult;
  $('metric-agents').textContent = String(session.graph.agentCount);
  $('metric-relations').textContent = String(session.graph.relations.length);
  $('metric-events').textContent = String(session.events.length).padStart(2, '0');
  $('center-value').textContent = String(session.events.length).padStart(2, '0');
  $('metric-replay').textContent = result.ok ? (result.steps === 0 ? 'BEREIT' : 'STIMMIG') : 'ABWEICHUNG';
  $('metric-replay-detail').textContent = result.ok ? (result.steps === 0 ? 'Ausgangszustand gebunden' : `${result.steps} Schritt${result.steps === 1 ? '' : 'e'} rekonstruierbar`) : result.reason;
  $('timeline-range').max = String(session.events.length);
  $('timeline-range').value = String(viewedStep);
  $('timeline-step').textContent = `Zustand ${viewedStep} / ${session.events.length}`;
  $('impulse-button').disabled = session.events.length >= maxSteps;
  $('replay-receipt').textContent = result.ok
    ? `REPLAY OK · ${result.steps} Schritt${result.steps === 1 ? '' : 'e'} · ${result.finalContentId}`
    : `REPLAY ABWEICHUNG · ${result.reason} · Schritt ${result.at ?? '?'}`;
  $('handoff-recommendation').textContent = researchHandoff.recommendedCheck;
  $('handoff-state').textContent = result.steps === 0
    ? 'Ausgangszustand bereit · erster Schritt ausstehend.'
    : 'Lokaler Prüfstand berechnet · Wirkung außerhalb des Modells offen.';
  for (const stage of document.querySelectorAll('.stages span')) stage.classList.toggle('active', Boolean(event));
  $('empty-event').hidden = Boolean(event);
  $('event-detail').hidden = !event;
  if (event) showEvent(event);
  drawGraph(state, event);
}

$('impulse-button').addEventListener('click', () => {
  try {
    session = appendImpulse(session, select.value);
    replayResult = replay(session);
    researchHandoff = createGenesisResearchHandoff(session);
    viewedStep = session.events.length;
    perspective = 'forward';
    render();
    $('live-status').textContent = `Impuls ${viewedStep} von ${select.value} aufgezeichnet. Replay stimmig.`;
  } catch (error) {
    $('live-status').textContent = `Impuls nicht ausgeführt: ${error.message}`;
  }
});

$('reset-button').addEventListener('click', () => {
  session = createSession(1);
  replayResult = replay(session);
  researchHandoff = createGenesisResearchHandoff(session);
  viewedStep = 0;
  perspective = 'forward';
  render();
  $('live-status').textContent = 'Der lokale Verlauf wurde zurückgesetzt.';
});

select.addEventListener('change', render);
$('timeline-range').addEventListener('input', event => {
  viewedStep = Number(event.target.value);
  render();
  $('live-status').textContent = `Zustand ${viewedStep} von ${session.events.length} angezeigt.`;
});

function setPerspective(value) {
  perspective = value;
  render();
  $('live-status').textContent = value === 'anti' ? 'Gegenansicht desselben Ereignisses geöffnet.' : 'Vorwärtsansicht desselben Ereignisses geöffnet.';
}
$('forward-button').addEventListener('click', () => setPerspective('forward'));
$('anti-button').addEventListener('click', () => setPerspective('anti'));

const example = scopeCounterexample();
$('counter-a-before').textContent = String(example.macroBeforeOpen.totalSignal);
$('counter-b-before').textContent = String(example.macroBeforeBlocked.totalSignal);
$('counter-a-after').textContent = String(example.macroAfterOpen.totalSignal);
$('counter-b-after').textContent = String(example.macroAfterBlocked.totalSignal);

function renderProjection(mode) {
  const comparison = example.projections[mode];
  const format = value => `${value.totalSignal} Signal${value.totalSignal === 1 ? '' : 'e'}`
    + (mode === 'SIGNALS_AND_ACTOR_GATE' ? ` · Gate A000 = ${value.actorGate}` : '');
  for (const [id, value] of [
    ['projection-before-a', comparison.beforeA], ['projection-before-b', comparison.beforeB],
    ['projection-after-a', comparison.afterA], ['projection-after-b', comparison.afterB]
  ]) $(id).textContent = format(value);
  $('projection-before-relation').textContent = `Vorher: ${comparison.sameBefore ? 'gleich' : 'unterscheidbar'}`;
  $('projection-after-relation').textContent = `Nachher: ${comparison.sameAfter ? 'gleich' : 'verschieden'}`;
  $('projection-finding').textContent = comparison.finding === 'COUNTEREXAMPLE'
    ? 'Diese grobe Ansicht verdeckt ein wirksames Gate. Derselbe sichtbare Zustand führt zu verschiedenen sichtbaren Folgen.'
    : 'Mit dem Gate ist dieses Paar schon vorher unterscheidbar. Das beweist nur diese Gegenprobe, keine globale Vorhersagbarkeit.';
  $('projection-signals').setAttribute('aria-pressed', String(mode === 'SIGNALS_ONLY'));
  $('projection-gate').setAttribute('aria-pressed', String(mode === 'SIGNALS_AND_ACTOR_GATE'));
}

$('projection-signals').addEventListener('click', () => renderProjection('SIGNALS_ONLY'));
$('projection-gate').addEventListener('click', () => renderProjection('SIGNALS_AND_ACTOR_GATE'));
renderProjection('SIGNALS_ONLY');

const finite = auditFiniteScope();
function formatFiniteProjection(value) {
  const parts = [`Σ ${value.totalSignal}`, `${value.activeAgents} aktiv`, `${value.saturatedAgents} gesättigt`];
  if (Object.hasOwn(value, 'actingGate')) parts.push(`handelndes Gate ${value.actingGate}`);
  if (value.gates) parts.push(`Gates ${value.gates.join('/')}`);
  return parts.join(' · ');
}
function renderFiniteScope(mode) {
  const result = finite.modes[mode];
  if (!result) throw new TypeError('Unbekannter Beobachtungsoperator');
  const hasWitness = Boolean(result.witness);
  $('finite-status').textContent = hasWitness ? 'Gegenzeuge gefunden' : 'Kein Gegenzeuge in diesem Ausschnitt';
  $('finite-counts').textContent = `${result.classes} Ansichtsklassen · ${result.ambiguousClasses} mehrdeutige Klassen · ${result.divergentClasses} verschiedene Folgeklassen`;
  $('finite-explanation').textContent = hasWitness
    ? mode === 'SIGNALS_ONLY' ? 'Die Summe verdeckt ein wirksames Gate. Gleiche Ansicht und gleicher Input führen auseinander.'
      : 'Die zusätzliche Information repariert einzelne Paare, lässt aber in diesem größeren Scope noch andere wirksame Unterschiede verborgen.'
    : 'Alle 100 geprüften Zustände sind in dieser Ansicht unterscheidbar. Der Test findet deshalb hier keine Kollision; außerhalb der Enumeration bleibt die Frage offen.';
  $('finite-witness').hidden = !hasWitness;
  if (hasWitness) {
    const witness = result.witness;
    $('finite-input').textContent = `IMPULS ${witness.input}`;
    $('finite-before').textContent = `Gleiche Ansicht vorher: ${formatFiniteProjection(witness.before)}`;
    $('finite-left-id').textContent = witness.left.id;
    $('finite-right-id').textContent = witness.right.id;
    $('finite-left-after').textContent = formatFiniteProjection(witness.left.after);
    $('finite-right-after').textContent = formatFiniteProjection(witness.right.after);
  }
  for (const button of document.querySelectorAll('[data-scope-mode]')) {
    button.setAttribute('aria-pressed', String(button.dataset.scopeMode === mode));
  }
}
for (const button of document.querySelectorAll('[data-scope-mode]')) {
  button.addEventListener('click', () => renderFiniteScope(button.dataset.scopeMode));
}
renderFiniteScope('SIGNALS_ONLY');

const fiberAudit = saturationFiberAudit();
$('fiber-max').textContent = String(fiberAudit.maxPreimage);
$('fiber-bits').textContent = String(fiberAudit.minimumBits);
$('fiber-roundtrips').textContent = `${fiberAudit.roundTrips}/${fiberAudit.familySize}`;
const fiberCards = fiberAudit.fibers.map(fiber => {
  const card = document.createElement('article');
  const label = document.createElement('span');
  label.textContent = fiber.beforeSignals.length > 1 ? 'MEHRERE VORBILDER' : 'EIN VORBILD';
  const path = document.createElement('div');
  path.className = 'fiber-path';
  const before = document.createElement('strong');
  before.textContent = fiber.beforeSignals.join(' · ');
  const arrow = document.createElement('b');
  arrow.textContent = '→';
  arrow.setAttribute('aria-label', 'führt zu');
  const after = document.createElement('strong');
  after.textContent = String(fiber.afterActorSignal);
  path.append(before, arrow, after);
  const detail = document.createElement('p');
  detail.textContent = fiber.beforeSignals.length > 1
    ? `Rang als Zusatz: ${fiber.beforeSignals.map((value, rank) => `${value} = ${rank.toString(2).padStart(fiberAudit.minimumBits, '0')}`).join(' · ')}`
    : 'Dieser Nachzustand hat im geprüften Fünferraum genau einen Vorwert.';
  card.append(label, path, detail);
  return card;
});
$('fiber-list').replaceChildren(...fiberCards);

const channelModes = Object.freeze({ narrow: [2, 1], longer: [2, 2], wider: [3, 1] });
function renderChannel(mode) {
  const parameters = channelModes[mode];
  if (!parameters) throw new TypeError('Unbekannter Restkanal');
  const audit = auditResidualTransport(...parameters);
  const rows = audit.rows.map(row => {
    const card = document.createElement('div');
    card.className = 'channel-row';
    card.dataset.exact = String(row.exactRoundTrip);
    const label = document.createElement('span');
    label.textContent = `VORHER ${row.beforeSignal} · REST ${row.residualRank}`;
    const symbols = document.createElement('strong');
    symbols.textContent = row.symbols.join(' · ');
    const outcome = document.createElement('p');
    outcome.textContent = `durch ${audit.ticks} Takt${audit.ticks === 1 ? '' : 'e'} → rekonstruiert ${row.restoredSignal}`;
    card.append(label, symbols, outcome);
    return card;
  });
  $('channel-rows').replaceChildren(...rows);
  $('channel-status').textContent = audit.status === 'LOSSLESS_IN_BOUND_FIBER' ? '3 VON 3 ERHALTEN' : 'EINE KOLLISION';
  $('channel-detail').textContent = `Kapazität: ${audit.capacity} Symbolfolgen · mindestens ${audit.minimumTicks} Takt${audit.minimumTicks === 1 ? '' : 'e'} nötig · ${audit.exactRoundTrips}/3 Vorwerte rekonstruiert.`;
  for (const button of document.querySelectorAll('[data-channel-mode]')) {
    button.setAttribute('aria-pressed', String(button.dataset.channelMode === mode));
  }
}
for (const button of document.querySelectorAll('[data-channel-mode]')) {
  button.addEventListener('click', () => renderChannel(button.dataset.channelMode));
}
renderChannel('narrow');

const predictionAudit = predictionControlAudit(createSession(1).initialState, 'A000');
$('prediction-expected').textContent = `${predictionAudit.prediction.expected.totalSignal} Gesamtsignal`;
$('prediction-fingerprint').textContent = `Lokaler Fingerabdruck ${predictionAudit.prediction.fingerprint}`;
function renderPrediction(mode) {
  const outcome = predictionAudit[mode];
  if (!outcome) throw new TypeError('Unbekannte Kontrollbeobachtung');
  $('prediction-status').textContent = mode === 'pending' ? 'OFFEN'
    : mode === 'matching' ? 'PASST IM MODELL' : 'WEICHT IM MODELL AB';
  $('prediction-observed').textContent = outcome.observed === null
    ? 'Noch kein Y: Der Vergleich bleibt offen.'
    : `Kontrollwert: ${outcome.observed.totalSignal} Gesamtsignal · ${outcome.observationKind}`;
  $('prediction-boundary').textContent = `Kandidat unverändert: ${predictionAudit.candidateUnchanged ? 'ja' : 'nein'} · Der abweichende Wert ist ein künstlich verändertes Nachbild. Eine externe Messung braucht Quelle, Zeitbasis und Beobachtungsvertrag.`;
  for (const button of document.querySelectorAll('[data-prediction-mode]')) {
    button.setAttribute('aria-pressed', String(button.dataset.predictionMode === mode));
  }
}
for (const button of document.querySelectorAll('[data-prediction-mode]')) {
  button.addEventListener('click', () => renderPrediction(button.dataset.predictionMode));
}
renderPrediction('pending');

function pairedBar(label, value, max) {
  const line = document.createElement('div');
  line.className = 'paired-bar-line';
  const name = document.createElement('span');
  name.textContent = label;
  const track = document.createElement('div');
  track.className = 'paired-bar-track';
  const fill = document.createElement('i');
  fill.className = label === 'Original' ? 'paired-original' : 'paired-control';
  fill.style.width = `${Math.max(0, Math.min(100, 100 * value / max))}%`;
  track.append(fill);
  const number = document.createElement('b');
  number.textContent = String(value);
  line.append(name, track, number);
  return line;
}
function renderPaired(mode) {
  const example = pairedScoreExamples[mode];
  if (!example) throw new TypeError('Unbekannte synthetische Scorefolge');
  const result = comparePairedScores(example.original, example.control);
  const max = Math.max(2, ...example.original, ...example.control);
  const rows = example.original.map((value, index) => {
    const row = document.createElement('div');
    row.className = 'paired-row';
    const heading = document.createElement('strong');
    heading.textContent = `PAAR ${index + 1}`;
    row.append(heading, pairedBar('Original', value, max), pairedBar('Kontrolle', example.control[index], max));
    return row;
  });
  $('paired-series').replaceChildren(...rows);
  const statusText = {
    ORIGINAL_MEETS_DECLARED_RULE: 'ORIGINAL ERFÜLLT DIE REGEL',
    CONTROL_MEETS_DECLARED_RULE: 'KONTROLLE ERFÜLLT DIE REGEL',
    BELOW_DECLARED_THRESHOLD: 'UNTER DER SCHWELLE',
    MIXED_OR_INSUFFICIENT_MAJORITY: 'MISCHFALL · KEIN RICHTUNGSSIEG'
  };
  $('paired-status').textContent = statusText[result.status];
  $('paired-mean').textContent = `Mittlere Differenz Original − Kontrolle: ${result.meanDifference.toFixed(2)} · Mindestabstand: ${result.minimumMeanAdvantage.toFixed(2)}`;
  $('paired-counts').textContent = `${result.originalWins} Original vorn · ${result.controlWins} Kontrolle vorn · ${result.ties} gleich`;
  for (const button of document.querySelectorAll('[data-paired-mode]')) {
    button.setAttribute('aria-pressed', String(button.dataset.pairedMode === mode));
  }
}
for (const button of document.querySelectorAll('[data-paired-mode]')) {
  button.addEventListener('click', () => renderPaired(button.dataset.pairedMode));
}
renderPaired('mixed');
render();
