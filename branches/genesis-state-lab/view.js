import { appendImpulse, createSession, projectEvent, replay, scopeCounterexample } from './model.js';
import { createGenesisResearchHandoff } from './handoff.js';

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
    if (agent.id === select.value) classes.push('selected');
    else if (agent.id === relayTarget) classes.push('relay-target');
    return svg('circle', { cx: position.x, cy: position.y, r: agent.id === select.value ? 6.5 : agent.signal > 0 ? 4.2 : 2.7, class: classes.join(' ') });
  });
  nodeGroup.replaceChildren(...nodeElements);
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
render();
