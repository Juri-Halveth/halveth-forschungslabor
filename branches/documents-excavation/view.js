import {RELICS, RELATIONS} from './relics.js';
import {evaluateContinuingEffect, SCENARIOS} from './effect-model.js';

const byId = new Map(RELICS.map((item) => [item.id, item]));
const ns = 'http://www.w3.org/2000/svg';
let stage = 0;
let selected = 'entity';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderMap() {
  const host = document.querySelector('#map-nodes');
  const svg = document.querySelector('#relations');
  host.replaceChildren();
  svg.replaceChildren();
  const visible = new Set(RELICS.filter((item) => item.stage <= stage).map((item) => item.id));
  for (const relation of RELATIONS) {
    if (!visible.has(relation.from) || !visible.has(relation.to)) continue;
    const from = byId.get(relation.from);
    const to = byId.get(relation.to);
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', String(from.x)); line.setAttribute('y1', String(from.y));
    line.setAttribute('x2', String(to.x)); line.setAttribute('y2', String(to.y));
    line.setAttribute('class', `relation-line ${relation.from === selected || relation.to === selected ? 'related' : ''} ${relation.type === 'EXACT_SOURCE_TEXT' ? 'exact' : ''}`);
    svg.append(line);
  }
  for (const relic of RELICS) {
    if (!visible.has(relic.id)) continue;
    const node = element('button', `relic tone-${relic.tone}${selected === relic.id ? ' active' : ''}`);
    node.type = 'button';
    node.style.setProperty('--x', `${relic.x}%`);
    node.style.setProperty('--y', `${relic.y}%`);
    node.setAttribute('aria-pressed', String(selected === relic.id));
    node.setAttribute('aria-label', `${relic.label}: ${relic.signal}`);
    node.append(element('span', 'relic-spark', '✦'), element('strong', '', relic.label), element('small', '', relic.signal));
    node.addEventListener('click', () => {selected = relic.id; renderMap(); renderDetail();});
    host.append(node);
  }
}

function renderDetail() {
  const item = byId.get(selected);
  document.querySelector('#detail-index').textContent = String(RELICS.indexOf(item) + 1).padStart(2, '0');
  document.querySelector('#detail-evidence').textContent = item.evidence.replaceAll('_', ' ');
  document.querySelector('#detail-kind').textContent = item.kind;
  document.querySelector('#detail-title').textContent = item.label;
  document.querySelector('#detail-signal').textContent = item.signal;
  document.querySelector('#detail-text').textContent = item.detail;
  document.querySelector('#detail-symbol').className = `detail-symbol tone-${item.tone}`;
  const list = document.querySelector('#detail-relations');
  list.replaceChildren();
  const related = RELATIONS.filter((relation) => relation.from === item.id || relation.to === item.id);
  if (!related.length) list.append(element('li', '', 'Noch keine gebundene Kante in dieser Auswahl.'));
  for (const relation of related) {
    const other = byId.get(relation.from === item.id ? relation.to : relation.from);
    const li = element('li');
    li.append(element('strong', '', other.label), element('span', '', relation.type.replaceAll('_', ' ')), element('p', '', relation.note));
    if (other.stage > stage) li.append(element('em', 'later-stage', `Sichtbar ab Schicht 0${other.stage + 1}`));
    list.append(li);
  }
  const action = document.querySelector('#detail-action');
  action.replaceChildren();
  if (item.href) {
    const link = element('a', 'source-link', 'Öffentlichen Code öffnen ↗');
    link.href = item.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    action.append(link);
  } else {
    action.append(element('span', 'local-label', 'Quellakte lokal gebunden · kein Rohimport'));
  }
}

for (const button of document.querySelectorAll('[data-stage]')) {
  button.addEventListener('click', () => {
    stage = Number(button.dataset.stage);
    for (const peer of document.querySelectorAll('[data-stage]')) peer.setAttribute('aria-pressed', String(peer === button));
    if (byId.get(selected).stage > stage) selected = 'entity';
    renderMap(); renderDetail();
  });
}

const SCENARIO_LABELS = {
  current: ['Alles aktuell', 'Erlaubnis und Scope passen zusammen.'],
  time: ['Zeit verschoben', 'Erlaubnis erlischt, Wirkung läuft.'],
  context: ['Kontext verschoben', 'Erlaubnis gilt, aber an einem anderen Ort.'],
  both: ['Beides zugleich', 'Zeit und Kontext müssen getrennt geprüft werden.'],
  continuity: ['Bewusste Fortsetzung', 'Weitergeltung und aktuelle Erlaubnis sind deklariert.'],
  unknown: ['Belege fehlen', 'Offene Felder bleiben offen.'],
};
const STATE_LABELS = {
  NO_ACTIVE_EFFECT_DECLARED: 'Keine aktive Wirkung deklariert',
  UNKNOWN: 'Offen · Daten fehlen',
  REVIEW_WITH_OPEN_EVIDENCE: 'Prüfkandidat · Belege offen',
  REVIEW_CANDIDATE: 'Prüfkandidat · zwei Achsen',
  CONTINUITY_WITH_CURRENT_AUTHORITY_DECLARED: 'Fortsetzung mit aktueller Erlaubnis deklariert',
  CURRENT_AUTHORITY_DECLARED: 'Aktuelle Erlaubnis deklariert',
};
function renderScenario(key) {
  const result = evaluateContinuingEffect(SCENARIOS[key]);
  for (const button of document.querySelectorAll('[data-scenario]')) button.setAttribute('aria-pressed', String(button.dataset.scenario === key));
  document.querySelector('#result-state').textContent = STATE_LABELS[result.state] ?? result.state;
  const signals = document.querySelector('#result-signals');
  signals.replaceChildren();
  for (const signal of result.signals) signals.append(element('li', '', signal.replaceAll('_', ' ')));
  if (!result.signals.length) signals.append(element('li', '', 'Keine der beiden Abweichungen deklariert.'));
  document.querySelector('#next-question').textContent = result.nextQuestion;
  document.querySelector('.lab-readout').dataset.result = result.state;
}
for (const [key, [label, description]] of Object.entries(SCENARIO_LABELS)) {
  const button = element('button', 'scenario');
  button.type = 'button';
  button.dataset.scenario = key;
  button.setAttribute('aria-pressed', String(key === 'both'));
  button.append(element('strong', '', label), element('span', '', description));
  button.addEventListener('click', () => renderScenario(key));
  document.querySelector('#scenarios').append(button);
}

renderMap();
renderDetail();
renderScenario('both');
