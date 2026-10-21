import { TRACKS, AXIS_STATES, evaluateNavigation } from './model.js';

const $ = id => document.getElementById(id);
const form = $('navigator-form');
const state = { track: 'research', axisStates: {}, axisReasons: {} };
const stateLabels = {
  STABLE: 'Aktuell stabil', MATERIAL_CANDIDATE: 'Materieller Kandidat',
  UNKNOWN: 'Offen / unbekannt', EXCLUDED_WITH_REASON: 'Mit Grund ausgeschlossen'
};

function collect() {
  const data = new FormData(form);
  for (const id of ['goal', 'source', 'scope', 'authority', 'hypothesis', 'counter', 'check', 'result', 'evidenceState', 'reopen']) {
    state[id] = String(data.get(id) ?? '').trim();
  }
  return state;
}

function renderTracks() {
  $('tracks').replaceChildren(...Object.entries(TRACKS).map(([id, track], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'track' + (state.track === id ? ' selected' : '');
    button.setAttribute('aria-pressed', String(state.track === id));
    const number = document.createElement('span'); number.className = 'track-number'; number.textContent = `0${index + 1}`;
    const content = document.createElement('span');
    const title = document.createElement('strong'); title.textContent = track.label;
    const purpose = document.createElement('small'); purpose.textContent = track.purpose;
    content.append(title, purpose); button.append(number, content);
    button.addEventListener('click', () => { collect(); state.track = id; state.axisStates = {}; state.axisReasons = {}; render(); });
    return button;
  }));
  $('connections-links').replaceChildren(...TRACKS[state.track].links.map(([name, href]) => {
    const link = document.createElement('a'); link.href = href; link.textContent = `${name} ↗`; return link;
  }));
}

function renderAxes() {
  const track = TRACKS[state.track];
  $('axes').replaceChildren(...track.axes.map((id, index) => {
    const label = document.createElement('label'); label.className = 'axis';
    const title = document.createElement('span'); title.textContent = `${String(index + 1).padStart(2, '0')} / ${id.replaceAll('_', ' ')}`;
    const select = document.createElement('select'); select.setAttribute('aria-label', `${id} einordnen`);
    const empty = new Option('Einordnen …', ''); select.add(empty);
    for (const value of AXIS_STATES) select.add(new Option(stateLabels[value], value));
    select.value = state.axisStates[id] ?? '';
    const addReason = () => {
      const reason = document.createElement('input'); reason.type = 'text';
      reason.placeholder = 'Grund für Ausschluss'; reason.maxLength = 500;
      reason.setAttribute('aria-label', `${id} Ausschlussgrund`);
      reason.value = state.axisReasons[id] ?? '';
      reason.addEventListener('input', () => { state.axisReasons[id] = reason.value; renderStatus(); });
      label.append(reason);
    };
    select.addEventListener('change', () => {
      if (select.value) state.axisStates[id] = select.value;
      else delete state.axisStates[id];
      if (select.value !== 'EXCLUDED_WITH_REASON') delete state.axisReasons[id];
      label.querySelector('input')?.remove();
      if (select.value === 'EXCLUDED_WITH_REASON') addReason();
      renderStatus();
    });
    label.append(title, select);
    if (state.axisStates[id] === 'EXCLUDED_WITH_REASON') addReason();
    return label;
  }));
}

function renderStatus() {
  collect();
  const result = evaluateNavigation(state);
  $('next-title').textContent = result.nextTitle;
  $('next-question').textContent = result.nextQuestion;
  $('next-state').textContent = result.outcome === 'FINITE_SNAPSHOT' ? 'ENDLICHER STAND' : 'NÄCHSTE FRAGE';
  $('progress').textContent = `${result.steps.filter(x => x.completed).length} / ${result.steps.length} gebunden`;
  $('axis-count').textContent = `${TRACKS[state.track].axes.filter(id => state.axisStates[id] && (state.axisStates[id] !== 'EXCLUDED_WITH_REASON' || state.axisReasons[id]?.trim())).length} / ${TRACKS[state.track].axes.length}`;
  $('boundary').hidden = !result.boundary;
  $('boundary').textContent = result.boundary ?? '';
  $('flow').replaceChildren(...result.steps.map(item => {
    const li = document.createElement('li');
    li.className = item.completed ? 'done' : item.id === result.nextId ? 'current' : 'waiting';
    const marker = document.createElement('span'); marker.className = 'flow-marker'; marker.textContent = item.completed ? '✓' : '·';
    const text = document.createElement('span'); text.textContent = item.title;
    li.append(marker, text); return li;
  }));
  document.querySelectorAll('[data-step]').forEach(el => el.classList.toggle('is-next', el.dataset.step === result.nextId));
  $('authority-field').hidden = state.track !== 'security';
}

function render() { renderTracks(); renderAxes(); renderStatus(); }
form.addEventListener('input', renderStatus);
form.addEventListener('change', renderStatus);
$('export').addEventListener('click', () => {
  const current = collect();
  const evaluation = evaluateNavigation(current);
  const payload = { schema: 'halveth.next-action-snapshot.v1', createdAt: new Date().toISOString(),
    input: { ...current, axisStates: { ...current.axisStates }, axisReasons: { ...current.axisReasons } },
    navigation: { nextId: evaluation.nextId, outcome: evaluation.outcome, actionClass: evaluation.actionClass, boundary: evaluation.boundary } };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'halveth-naechster-schritt.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('clear').addEventListener('click', () => { form.reset(); state.axisStates = {}; state.axisReasons = {}; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
render();
