const $ = (id) => document.getElementById(id);
const numberFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 5 });
const countFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const pending = new Map();
const compartmentNodes = new Map();
const routeNodes = new Map();
const channelNodes = new Map();
const eventNodes = new Map();
const eventRecords = new Map();
const tabNames = { system: 'System', flows: 'Flüsse', signals: 'Signale', history: 'Verlauf' };
const resourceNames = { nutrient: 'Nährstoff-Modellbestand', oxygen: 'Sauerstoff-Modellbestand', gaba: 'GABA-Modellbestand', trace: 'Spuren-Modellbestand', information: 'Information im Modell', reserve: 'Gemeinsamer Modellbestand', attention: 'Abstraktes Verarbeitungsbudget' };
const resourceShortNames = { nutrient: 'Nährstoff', oxygen: 'Sauerstoff', gaba: 'GABA', trace: 'Spuren', reserve: 'Vorrat', attention: 'Budget' };
const entityNames = { organism: 'Organismusmodell', environment: 'Umgebung', gut: 'Darm', gut_lumen: 'Darminnenraum', gut_epithelium: 'Darmepithel', circulation: 'Kreislauf', blood_plasma: 'Blutplasma', heart: 'Herz', liver: 'Leber', lung: 'Lunge', kidney: 'Niere', skin: 'Haut', brain: 'Gehirn', brain_barrier: 'Modellbarriere', neural_tissue: 'Neuronales Gewebe', muscle: 'Muskel', cell_population: 'Zellpopulation', enzyme_machine: 'Enzymmodell', microbiome: 'Mikrobiom' };
const kindNames = { organism: 'Organismus', organ: 'Organ', tissue: 'Gewebe', fluid: 'Fluidbereich', lumen: 'Innenraum', interface: 'Grenzbereich', cell_population: 'Zellpopulation', molecular_machine: 'Molekulares Modell', microbial_ecology: 'Ökologisches Modell', environment: 'Umgebung', custom: 'Eigener Bereich', profile: 'Softwareprofil', project_perspective: 'Softwareprofil', project_source: 'Registerquelle', reservoir: 'Gemeinsamer Vorrat', claimant: 'Modellbedarf', entity: 'Bereich' };
const signalNames = { GUT_STATE: 'Darmzustand', NERVOUS_INPUT: 'Deklarierter Nervenimpuls', CIRCULATION_STATE: 'Kreislaufzustand', DEMAND_STATE: 'Bedarfsmeldung', PROFILE_TRACE: 'Profilnachricht' };
const eventNames = { RESOURCE_TRANSFER: 'Ressource übertragen', RESOURCE_REQUEST: 'Ressource angefragt', SIGNAL_EMIT: 'Signal gesendet', SIGNAL_ARRIVED: 'Signal angekommen', OBSERVATION_GAP: 'Beobachtungslücke', ENTITY_BORN: 'Bereich hinzugefügt', ROUTE_DEFINED: 'Route registriert', CHANNEL_DEFINED: 'Kanal registriert', DIMENSION_CHANGED: 'Modellwert geändert', PROCESS_REGISTERED: 'Prozess registriert' };
let worker;
let fatal = false;
let nextRequestId = 0;
let liveProjection = null;
let shownProjection = null;
let frozen = false;
let activeTab = 'system';
let selectedId = '';
let resourceId = '';
let selectedEvent = null;
let paintTimer = null;
let queuedProjection = null;
let liveTimer = null;
let importGeneration = 0;
let entityOptionsKey = '';
let resourceOptionsKey = '';
let sceneKey = '';
let lastPaintGeneration = null;
let flowStripNodes = null;
let operationError = '';

function node(tag, className, text) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text !== undefined) result.textContent = text;
  return result;
}
function add(parent, ...children) { for (const child of children) if (child !== undefined && child !== null) parent.append(child); return parent; }
function text(id, value) { const element = $(id); const valueText = String(value); if (element.textContent !== valueText) element.textContent = valueText; }
function amount(value) {
  if (!Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 0.0001) return value.toExponential(2).replace('.', ',');
  return numberFormat.format(value);
}
function count(value) { return Number.isFinite(value) ? countFormat.format(value) : '—'; }
function signed(value) { return Number.isFinite(value) ? `${value > 0 ? '+' : ''}${amount(value)}` : '—'; }
function seconds(ms) { return Number.isFinite(ms) ? `${amount(ms / 1000)} s` : '—'; }
function label(entity) { return entity?.label && entity.label !== entity.id ? entity.label : entityNames[entity?.id] || entity?.label || entity?.id || 'Unbekannter Bereich'; }
function unitLabel(resource) { return ['MODEL_AMOUNT', 'ABSTRACT_MODEL_AMOUNT'].includes(resource?.unit) ? 'abstrakte Modelleinheiten' : resource?.unit || 'Einheit offen'; }
function announce(value) { window.clearTimeout(liveTimer); liveTimer = window.setTimeout(() => text('action-live', value), 100); }
function message(value, kind = 'info') { operationError = kind === 'error' ? value : ''; text('operation-text', value); $('operation-message').dataset.kind = kind; $('operation-message').hidden = false; updateQuickResult(); }
function clearMessage() { operationError = ''; $('operation-message').hidden = true; text('operation-text', ''); updateQuickResult(); }
function errorMessage(value, action) {
  if (action === 'ADD_ENTITY') {
    if (value === 'invalid id') return 'Die ID benötigt kleine ASCII-Buchstaben oder Zahlen, getrennt durch Punkt, Unterstrich, Doppelpunkt oder Bindestrich; höchstens 120 Zeichen.';
    if (value.startsWith('duplicate entity ')) return 'Diese ID ist bereits vergeben. Wähle eine eindeutige ID.';
    if (value === 'missing parent') return 'Der ausgewählte übergeordnete Bereich gehört nicht zum aktuellen Lauf. Setze die Anzeige fort und wähle ihn erneut.';
  }
  if (value.includes('event log full')) return 'Das Ereignisbudget ist erreicht. Sichere einen Checkpoint und beginne für weitere Schritte einen neuen Modelllauf.';
  return value;
}
function empty(parent, value, symbol = '—') { const box = node('div', 'empty-state'); add(box, node('span', '', symbol), node('p', '', value)); parent.replaceChildren(box); }
function entitiesOf(projection) { return Array.isArray(projection?.entities) ? projection.entities : []; }
function routesOf(projection) { return Array.isArray(projection?.routes) ? projection.routes : []; }
function resourcesOf(projection) { return Array.isArray(projection?.resources) ? projection.resources : []; }
function eventsOf(projection) { return Array.isArray(projection?.events?.items) ? projection.events.items : []; }
function channelsOf(projection) { return Array.isArray(projection?.channels) ? projection.channels : []; }
function entityMap(projection) { return new Map(entitiesOf(projection).map((entity) => [entity.id, entity])); }
function resourceOf(projection) { return resourcesOf(projection).find((resource) => resource.id === resourceId); }
function hasWindow(projection) { return Number.isFinite(projection?.balance?.fromTick) && Number.isFinite(projection?.balance?.toTick) && projection.balance.toTick > projection.balance.fromTick; }
function windowTransfers(projection) { return hasWindow(projection) && Array.isArray(projection.balance.transfers) ? projection.balance.transfers : []; }
function stock(entity, resource = resourceId) { return entity ? Number(entity.resources?.[resource] ?? 0) : null; }
function windowStock(projection, side, id) { const account = projection?.balance?.[side]?.[id]; return account ? Number(account[resourceId] ?? 0) : null; }
function pendingSignals(projection) { const value = projection?.world?.pendingSignals; return Array.isArray(value) ? value.length : value; }
function pathOf(id, projection) {
  const map = entityMap(projection), seen = new Set(), path = [];
  let current = map.get(id);
  while (current && !seen.has(current.id)) { seen.add(current.id); path.unshift(current); current = current.parentId ? map.get(current.parentId) : null; }
  return path;
}
function busy() { return [...pending.values()].some((record) => !['AUDIT', 'EXPORT'].includes(record.type)); }

function updateControls() {
  const ready = Boolean(liveProjection) && !fatal;
  const isBusy = busy();
  for (const button of document.querySelectorAll('[data-action="STEP"]')) button.disabled = !ready || isBusy || Boolean(liveProjection?.running);
  $('start-button').disabled = !ready || isBusy || Boolean(liveProjection?.running);
  $('pause-button').disabled = !ready || !liveProjection.running || [...pending.values()].some((record) => record.type === 'PAUSE');
  $('reset-button').disabled = fatal || isBusy;
  $('gap-button').disabled = !ready || isBusy;
  $('add-entity-button').disabled = !ready || isBusy || Boolean(frozen && shownProjection?.generation !== liveProjection?.generation);
  $('audit-button').disabled = !ready || [...pending.values()].some((record) => record.type === 'AUDIT');
  $('export-button').disabled = !ready || [...pending.values()].some((record) => record.type === 'EXPORT');
  $('snapshot-file').disabled = fatal || isBusy;
  $('freeze-button').disabled = !ready;
  $('entity-search').disabled = !shownProjection;
  $('entity-choice').disabled = !shownProjection || !entitiesOf(shownProjection).length;
  $('resource-choice').disabled = !shownProjection || !resourcesOf(shownProjection).length;
}

function renderRuntime() {
  const state = $('engine-state');
  const mostRecent = [...pending.values()].filter((record) => !['AUDIT', 'EXPORT'].includes(record.type)).at(-1);
  if (fatal) { state.className = 'badge amber'; state.textContent = 'Engine nicht erreichbar'; }
  else if (mostRecent) { state.className = 'badge amber'; state.textContent = ({ RESET: 'Szenario angefragt', RESTORE: 'Restore wird geprüft', STEP: 'Schritt ausstehend', START: 'Start angefragt', PAUSE: 'Anhalten angefragt', GAP: 'Lücke angefragt', ADD_ENTITY: 'Bereich angefragt' })[mostRecent.type] || 'Anfrage ausstehend'; }
  else if (liveProjection) { state.className = `badge${liveProjection.running ? '' : ' muted'}`; state.textContent = liveProjection.running ? 'Engine läuft' : 'Angehalten'; }
  else { state.className = 'badge muted'; state.textContent = 'Engine startet'; }
  if (liveProjection) {
    text('model-clock', `Tick ${count(liveProjection.world.tick)} · ${amount(liveProjection.world.modelMs)} ms Modellzeit`);
    text('engine-version', `Engine ${liveProjection.engineVersion}`);
  }
  $('freeze-button').setAttribute('aria-pressed', String(frozen));
  text('freeze-button', frozen ? 'Bild fortsetzen' : 'Bild einfrieren');
  $('freeze-notice').hidden = !frozen;
  if (frozen && shownProjection) text('freeze-notice', `Bild eingefroren bei Lauf ${shownProjection.generation}, Tick ${count(shownProjection.world.tick)}. ${liveProjection?.running ? 'Die Engine läuft weiter' : 'Die Engine ist angehalten'}; neuester bestätigter Stand: Lauf ${liveProjection?.generation}, Tick ${count(liveProjection?.world.tick)}. Checkpoint und Audit beziehen sich auf die Engine.`);
  updateQuickResult();
  updateControls();
}

function send(type, payload = {}) {
  if (fatal || !worker) { message('Die Engine ist nicht erreichbar. Der letzte bestätigte Zustand bleibt sichtbar.', 'error'); return null; }
  if (nextRequestId >= Number.MAX_SAFE_INTEGER) { message('Das Anfragebudget ist erreicht. Ein neuer Seitenstart ist erforderlich.', 'error'); return null; }
  const id = ++nextRequestId;
  pending.set(id, { id, type, payload, generation: liveProjection?.generation ?? null });
  try { worker.postMessage({ id, type, payload }); }
  catch (error) { pending.delete(id); message(`Die Anfrage wurde nicht gesendet: ${error.message}`, 'error'); announce('Die Anfrage wurde nicht gesendet.'); }
  renderRuntime();
  return id;
}

function acceptProjection(projection) {
  if (!projection || !Number.isSafeInteger(projection.generation) || !Number.isSafeInteger(projection.revision) || !projection.world) return false;
  if (liveProjection && (projection.generation < liveProjection.generation || projection.revision < liveProjection.revision || (projection.generation > liveProjection.generation && projection.revision <= liveProjection.revision))) return false;
  liveProjection = projection;
  return true;
}

function queuePaint(projection, immediate = false) {
  queuedProjection = projection;
  if (frozen) { renderRuntime(); return; }
  if (immediate) {
    window.clearTimeout(paintTimer); paintTimer = null;
    const next = queuedProjection; queuedProjection = null;
    renderProjection(next); return;
  }
  if (paintTimer !== null) return;
  paintTimer = window.setTimeout(() => {
    paintTimer = null;
    if (frozen || !queuedProjection) return;
    const next = queuedProjection; queuedProjection = null;
    renderProjection(next);
  }, 100);
}

function handleResponse(event) {
  const response = event.data;
  if (!response || !['RESULT', 'ERROR', 'UPDATE'].includes(response.type)) return;
  const record = response.type !== 'UPDATE' && Number.isSafeInteger(response.id) && response.id > 0 ? pending.get(response.id) : undefined;
  if (record) pending.delete(response.id);
  const accepted = acceptProjection(response.projection);
  if (!accepted) {
    if (response.type === 'ERROR' && !response.projection) { message(response.message || 'Die Engine hat die Anfrage abgelehnt.', 'error'); announce(response.message || 'Anfrage abgelehnt.'); }
    renderRuntime(); return;
  }
  const projection = response.projection;
  if (response.type === 'ERROR') {
    const errorText = errorMessage(response.message || 'Die Engine hat die Anfrage abgelehnt.', record?.type);
    message(errorText, 'error'); announce(errorText);
    if (record?.type === 'RESTORE') { $('import-state').dataset.state = 'error'; text('import-state', `Restore abgelehnt. Der bisherige Lauf bleibt erhalten. ${errorText}`); }
    if (record?.type === 'ADD_ENTITY') { $('entity-add-state').dataset.state = 'error'; text('entity-add-state', `Bereich abgelehnt. Die bestehende Welt bleibt erhalten. ${errorText}`); }
  } else if (response.type === 'RESULT' && record) {
    const action = response.action || record.type;
    clearMessage();
    if (action === 'RESET' || action === 'RESTORE') {
      $('entity-add-state').dataset.state = 'ready'; text('entity-add-state', 'Neue Bereiche erhalten keine zusätzlichen Ressourcen.');
      if (action === 'RESTORE') { $('import-state').dataset.state = 'ready'; text('import-state', `Checkpoint übernommen. Neuer Lauf ${projection.generation}, Tick ${count(projection.world.tick)}.`); }
      if (['compartments', 'competition', 'profiles'].includes(projection.scenario)) $('scenario-choice').value = projection.scenario;
      $('profile-count-field').hidden = $('scenario-choice').value !== 'profiles';
    }
    if (action === 'ADD_ENTITY') {
      const created = entitiesOf(projection).find((entity) => entity.id === record.payload.id);
      if (created) { selectedId = created.id; $('entity-search').value = ''; entityOptionsKey = ''; }
      $('entity-add-state').dataset.state = 'ready'; text('entity-add-state', created ? `${label(created)} hinzugefügt. Es wurden keine zusätzlichen Ressourcen erzeugt.` : 'Die Engine hat die Anfrage beantwortet.');
    }
    const exportReady = action !== 'EXPORT' || downloadCheckpoint(response, projection);
    const resultText = action === 'STEP' ? `Tick ${count(projection.world.tick)} bestätigt. ${hasWindow(projection) ? `Buchungsfenster ${projection.balance.fromTick} bis ${projection.balance.toTick}.` : ''}`
      : action === 'RESET' ? `Szenario geladen. ${count(projection.world.entityCount)} Bereiche, Tick ${count(projection.world.tick)}.`
      : action === 'RESTORE' ? `Checkpoint wieder aufgenommen. Tick ${count(projection.world.tick)}.`
      : action === 'START' ? 'Die Engine läuft im lokalen Worker.'
      : action === 'PAUSE' ? `Engine angehalten bei Tick ${count(projection.world.tick)}.`
      : action === 'GAP' ? `Beobachtungslücke dokumentiert. Modell-Tick ${count(projection.world.tick)}.`
      : action === 'ADD_ENTITY' ? 'Eigener Bereich hinzugefügt. Die Ressourcenmenge stammt weiterhin aus dem Modellbestand.'
      : action === 'AUDIT' ? `Audit angefordert und beantwortet.${frozen ? ' Zum Anzeigen des neuen Standes das Bild fortsetzen.' : ''}`
      : action === 'EXPORT' ? exportReady ? 'Der tatsächliche Checkpointtext der Engine wurde zum Download bereitgestellt.' : 'Die Engine hat keinen Checkpointtext geliefert.' : 'Anfrage bestätigt.';
    announce(resultText);
  }
  if (!frozen) queuePaint(projection, response.type !== 'UPDATE');
  else renderRuntime();
}

function downloadCheckpoint(response, projection) {
  if (typeof response.text !== 'string' || response.text.length === 0) { message('Die Engine hat keinen Checkpointtext geliefert. Es wurde kein Ersatz-Snapshot erzeugt.', 'error'); return false; }
  const blob = new Blob([response.text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url;
  link.download = `lebende-systeme-g${projection.generation}-tick-${projection.world.tick}.json`;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

function renderProjection(projection) {
  if (!projection) return;
  shownProjection = projection;
  if (lastPaintGeneration !== projection.generation) {
    sceneKey = ''; entityOptionsKey = ''; resourceOptionsKey = '';
    routeNodes.clear(); channelNodes.clear();
    eventNodes.clear(); eventRecords.clear(); selectedEvent = null;
    lastPaintGeneration = projection.generation;
  }
  const entities = entitiesOf(projection), resources = resourcesOf(projection);
  if (!entities.some((entity) => entity.id === selectedId)) selectedId = entities.find((entity) => entity.id === 'muscle')?.id || entities[0]?.id || '';
  if (!resources.some((resource) => resource.id === resourceId)) resourceId = resources.find((resource) => resource.id === 'nutrient')?.id || resources[0]?.id || '';
  renderSelection(projection);
  renderInspector(projection);
  renderActiveView(projection);
  renderRuntime();
}

function renderSelection(projection) {
  const entities = entitiesOf(projection), query = $('entity-search').value.toLocaleLowerCase('de');
  const filtered = entities.filter((entity) => [entity.id, label(entity), entity.kind].join(' ').toLocaleLowerCase('de').includes(query));
  const selected = entities.find((entity) => entity.id === selectedId);
  const options = filtered.some((entity) => entity.id === selectedId) ? filtered : selected ? [selected, ...filtered] : filtered;
  const key = JSON.stringify(options.map((entity) => [entity.id, entity.label, entity.parentId]));
  if (key !== entityOptionsKey) {
    const fragment = document.createDocumentFragment();
    for (const entity of options) { const option = node('option', '', label(entity)); option.value = entity.id; fragment.append(option); }
    if (!options.length) { const option = node('option', '', 'Keine passenden Bereiche'); option.value = ''; fragment.append(option); }
    $('entity-choice').replaceChildren(fragment); entityOptionsKey = key;
  }
  $('entity-choice').value = selectedId;
  text('entity-count', `${count(filtered.length)} Treffer · ${count(entities.length)} Bereiche im Modell`);
  const resources = resourcesOf(projection), nextResourcesKey = JSON.stringify(resources.map((resource) => [resource.id, resource.unit]));
  if (nextResourcesKey !== resourceOptionsKey) {
    const fragment = document.createDocumentFragment();
    for (const resource of resources) { const option = node('option', '', resourceNames[resource.id] || resource.id); option.value = resource.id; fragment.append(option); }
    if (!resources.length) { const option = node('option', '', 'Keine Ressourcen definiert'); option.value = ''; fragment.append(option); }
    $('resource-choice').replaceChildren(fragment); resourceOptionsKey = nextResourcesKey;
  }
  $('resource-choice').value = resourceId;
  text('resource-unit', resourceOf(projection) ? `Einheit: ${unitLabel(resourceOf(projection))}` : 'Keine Ressource in dieser Welt definiert.');
}

function renderInspector(projection) {
  const entity = entitiesOf(projection).find((candidate) => candidate.id === selectedId), resource = resourceOf(projection);
  text('inspector-title', entity ? label(entity) : 'Kein Bereich');
  text('inspector-path', entity ? pathOf(entity.id, projection).map(label).join(' / ') : '—');
  text('inspector-resource-name', resource ? resourceNames[resource.id] || resource.id : 'Keine Ressource');
  text('current-stock', resource ? amount(stock(entity)) : '—');
  text('inspector-unit', resource ? unitLabel(resource) : 'Keine Einheit geladen');
  const before = hasWindow(projection) && resource ? windowStock(projection, 'before', selectedId) : null;
  const after = hasWindow(projection) && resource ? windowStock(projection, 'after', selectedId) : null;
  const relevant = windowTransfers(projection).filter((transfer) => transfer.resource === resourceId);
  const incoming = relevant.filter((transfer) => transfer.to === selectedId).reduce((sum, transfer) => sum + transfer.amount, 0);
  const outgoing = relevant.filter((transfer) => transfer.from === selectedId).reduce((sum, transfer) => sum + transfer.amount, 0);
  text('balance-window', hasWindow(projection) ? `Buchungsfenster: Tick ${projection.balance.fromTick} → ${projection.balance.toTick}` : 'Noch kein ausgeführtes Buchungsfenster.');
  text('balance-before', amount(before)); text('balance-after', amount(after));
  text('balance-in', before !== null ? `+ ${amount(incoming)}` : '—'); text('balance-out', before !== null ? `− ${amount(outgoing)}` : '—');
  text('balance-delta', before !== null && after !== null ? signed(after - before) : '—');
  text('balance-note', before !== null && after !== null ? 'Vorher, nachher und Transfers gehören zu diesem bestätigten Fenster. Weitere Zustandsregeln stehen im Ereignisprotokoll.' : 'Der aktuelle Bestand ist sichtbar. Ein Vorher-Nachher-Vergleich entsteht mit dem nächsten ausgeführten Tick.');
  text('entity-json', entity ? JSON.stringify({ id: entity.id, parentId: entity.parentId, kind: entity.kind, role: entity.role, revision: entity.revision, volume: entity.volume, sourceRef: entity.sourceRef, dimensions: entity.dimensions }, null, 2) : 'Kein Bereich ausgewählt.');
}

function renderActiveView(projection) {
  if (activeTab === 'system') renderSystem(projection);
  else if (activeTab === 'flows') renderFlows(projection);
  else if (activeTab === 'signals') renderSignals(projection);
  else renderHistory(projection);
}

function pickEntity(id, openSystem = false) {
  if (!entitiesOf(shownProjection).some((entity) => entity.id === id)) return;
  selectedId = id;
  if (openSystem) selectTab('system');
  else renderProjection(shownProjection);
}

function party(caption, selected = false) {
  const box = node('div', `flow-party${selected ? ' is-selected' : ''}`);
  add(box, node('span', '', caption));
  const strong = node('strong'), button = node('button'), value = node('small');
  button.type = 'button'; button.addEventListener('click', () => pickEntity(button.dataset.entityId));
  add(strong, button); add(box, strong, value);
  return { box, button, value };
}
function transferArrow() {
  const box = node('div', 'flow-arrow'), value = node('strong'), glyph = node('span');
  glyph.setAttribute('aria-hidden', 'true'); add(box, value, glyph);
  return { box, value, glyph };
}
function renderFlowStrip(projection, selected, incoming, outgoing, sums, map) {
  if (!selected) { empty($('flow-strip'), 'Diese Welt enthält noch keinen auswählbaren Bereich.', '⇄'); flowStripNodes = null; return; }
  if (!flowStripNodes) {
    const before = party('Eingangsbereich'), focus = party('Ausgewählt', true), after = party('Ausgangsbereich'), inArrow = transferArrow(), outArrow = transferArrow();
    flowStripNodes = { before, focus, after, inArrow, outArrow };
    $('flow-strip').replaceChildren(before.box, inArrow.box, focus.box, outArrow.box, after.box);
  }
  for (const [target, entity] of [[flowStripNodes.before, map.get(incoming?.from)], [flowStripNodes.focus, selected], [flowStripNodes.after, map.get(outgoing?.to)]]) {
    target.button.textContent = entity ? label(entity) : 'Kein Weg'; target.button.dataset.entityId = entity?.id || ''; target.button.disabled = !entity;
    target.value.textContent = entity && resourceId ? `${amount(stock(entity))} ${unitLabel(resourceOf(projection))}` : 'für diese Auswahl';
  }
  for (const [target, route] of [[flowStripNodes.inArrow, incoming], [flowStripNodes.outArrow, outgoing]]) {
    const value = sums.get(route?.id) || 0;
    target.box.classList.toggle('no-transfer', !value); target.value.textContent = route ? hasWindow(projection) ? amount(value) : 'offen' : '—'; target.glyph.textContent = route ? '→' : '·';
  }
}

function renderSystem(projection) {
  const map = entityMap(projection), selected = map.get(selectedId), routes = routesOf(projection).filter((route) => route.resource === resourceId);
  text('entity-path', selected ? pathOf(selectedId, projection).map(label).join(' / ') : 'Kein Bereich ausgewählt.');
  text('scene-state', frozen ? 'Bild eingefroren' : `Tick ${count(projection.world.tick)}`);
  const sums = new Map(); for (const transfer of windowTransfers(projection)) if (transfer.resource === resourceId) sums.set(transfer.routeId, (sums.get(transfer.routeId) || 0) + transfer.amount);
  const incoming = routes.filter((route) => route.to === selectedId).sort((a, b) => (sums.get(b.id) || 0) - (sums.get(a.id) || 0))[0];
  const outgoing = routes.filter((route) => route.from === selectedId).sort((a, b) => (sums.get(b.id) || 0) - (sums.get(a.id) || 0))[0];
  renderFlowStrip(projection, selected, incoming, outgoing, sums, map);

  const path = selected ? pathOf(selectedId, projection) : [];
  const ancestors = path.slice(0, -1).slice(-2);
  const children = new Map(); for (const entity of entitiesOf(projection)) { if (!children.has(entity.parentId)) children.set(entity.parentId, []); children.get(entity.parentId).push(entity); }
  const visible = [], remaining = [], maxCards = 14;
  const collect = (entity, depth) => {
    if (!entity || visible.length >= maxCards) return;
    visible.push(entity);
    if (depth >= 2) return;
    const available = children.get(entity.id) || [];
    let included = 0;
    for (const child of available) { if (included >= 6 || visible.length >= maxCards) break; collect(child, depth + 1); included++; }
    if (available.length > included) remaining.push([entity.id, available.length - included]);
  };
  for (const ancestor of ancestors) visible.push(ancestor);
  collect(selected, 0);
  const nextKey = JSON.stringify([selectedId, visible.map((entity) => [entity.id, entity.parentId, entity.label, entity.kind]), remaining]);
  if (nextKey !== sceneKey) {
    const focusedId = document.activeElement?.dataset?.compartmentId;
    compartmentNodes.clear();
    const createCard = (entity, selectedCard = false, ancestorCard = false) => {
      const card = node('article', `compartment${selectedCard ? ' selected' : ''}${ancestorCard ? ' ancestor' : ''}`), head = node('div', 'compartment-head');
      const button = node('button', '', label(entity)); button.type = 'button'; button.dataset.compartmentId = entity.id;
      button.addEventListener('click', () => { pickEntity(entity.id); compartmentNodes.get(entity.id)?.button.focus({ preventScroll: true }); });
      add(head, button, node('span', 'compartment-kind', kindNames[entity.kind] || entity.kind));
      const value = node('div', 'compartment-stock');
      const nested = node('div', `compartment-children${ancestorCard ? ' single' : ''}`);
      add(card, head, value, nested);
      compartmentNodes.set(entity.id, { card, value, nested, button }); return card;
    };
    const fragment = document.createDocumentFragment(); let parent = fragment;
    for (const ancestor of ancestors) { const card = createCard(ancestor, false, true); parent.append(card); parent = compartmentNodes.get(ancestor.id).nested; }
    const makeBranch = (entity, depth = 0) => {
      const card = createCard(entity, entity.id === selectedId);
      if (depth < 2) for (const child of children.get(entity.id) || []) if (visible.some((candidate) => candidate.id === child.id) && !compartmentNodes.has(child.id)) compartmentNodes.get(entity.id).nested.append(makeBranch(child, depth + 1));
      const omitted = remaining.find(([id]) => id === entity.id)?.[1];
      if (omitted) compartmentNodes.get(entity.id).nested.append(node('p', 'remaining-children', `${count(omitted)} weitere direkte Bereiche sind über die Auswahl erreichbar.`));
      if (!compartmentNodes.get(entity.id).nested.childNodes.length) compartmentNodes.get(entity.id).nested.hidden = true;
      return card;
    };
    if (selected) parent.append(makeBranch(selected));
    $('compartment-scene').replaceChildren(fragment);
    if (!selected) empty($('compartment-scene'), 'Keine Bereiche vorhanden.', '▣');
    sceneKey = nextKey;
    if (focusedId && compartmentNodes.has(focusedId)) compartmentNodes.get(focusedId).button.focus({ preventScroll: true });
  }
  for (const entity of visible) {
    const target = compartmentNodes.get(entity.id)?.value;
    if (target) { const value = resourceId ? amount(stock(entity)) : '—'; if (target.dataset.value !== `${resourceId}:${value}`) { target.replaceChildren(document.createTextNode(value), node('small', '', resourceShortNames[resourceId] || resourceId || 'keine Ressource')); target.dataset.value = `${resourceId}:${value}`; } }
  }
  text('scene-coverage', `${count(visible.length)} von ${count(entitiesOf(projection).length)} Bereichen im Fokus`);
  for (const [id, value] of [['world-entities', projection.world.entityCount], ['world-routes', projection.world.routeCount], ['world-processes', projection.world.processCount], ['world-events', projection.world.eventCount]]) text(id, count(value));
  text('event-budget', `${count(projection.world.eventCount)} von ${count(projection.world.maxEvents)} Ereignissen erhalten. Am Budget hält die Engine kontrolliert an; die Historie wird nicht rotiert.`);
}

function endpoint(entity) { const button = node('button', 'route-endpoint', label(entity)); button.type = 'button'; button.dataset.entityId = entity?.id || ''; button.addEventListener('click', () => pickEntity(button.dataset.entityId, true)); return button; }

function renderFlows(projection) {
  const map = entityMap(projection), routes = routesOf(projection).filter((route) => route.resource === resourceId && (!$('flow-focus').checked || route.from === selectedId || route.to === selectedId));
  text('flow-count', `${count(routes.length)} Routen`);
  text('flow-window', hasWindow(projection) ? `Verbuchte Mengen von Tick ${projection.balance.fromTick} bis ${projection.balance.toTick} · ${unitLabel(resourceOf(projection))}` : 'Noch kein ausgeführtes Buchungsfenster. Registrierte Routen sind bereits sichtbar.');
  const totals = new Map(); for (const transfer of windowTransfers(projection)) totals.set(transfer.routeId, (totals.get(transfer.routeId) || 0) + transfer.amount);
  const desired = [];
  for (const route of routes.slice(0, 120)) {
    let record = routeNodes.get(route.id);
    if (!record) {
      const row = node('tr'), routeCell = node('td'), from = endpoint(map.get(route.from)), to = endpoint(map.get(route.to));
      add(routeCell, from, node('span', 'route-arrow', '→'), to, node('small', '', route.id));
      const value = node('td', 'amount'), valueText = document.createTextNode(''), resourceText = node('small'), parameters = node('td');
      add(value, valueText, resourceText); add(row, routeCell, value, parameters);
      record = { row, from, to, valueText, resourceText, parameters }; routeNodes.set(route.id, record);
    }
    record.from.textContent = label(map.get(route.from)); record.to.textContent = label(map.get(route.to));
    record.valueText.data = hasWindow(projection) ? amount(totals.get(route.id) || 0) : '—'; record.resourceText.textContent = unitLabel(resourceOf(projection));
    record.parameters.replaceChildren(document.createTextNode(amount(route.vmax)), node('small', '', `Km ${amount(route.km)}`)); desired.push(record.row);
  }
  if (!routes.length) { const row = node('tr'), cell = node('td', '', 'Für diese Auswahl sind keine Ressourcenrouten registriert.'); cell.colSpan = 3; add(row, cell); desired.push(row); }
  if (routes.length > 120) { const row = node('tr'), cell = node('td', '', `Ansicht: erste 120 von ${count(routes.length)} Routen. Der vollständige Checkpoint enthält die registrierten Wege.`); cell.colSpan = 3; row.append(cell); desired.push(row); }
  reconcile($('flow-table'), desired);
  const totalFragment = document.createDocumentFragment();
  for (const resource of resourcesOf(projection)) {
    const row = node('div', 'resource-total'), name = node('div'); add(name, node('strong', '', resourceNames[resource.id] || resource.id), node('small', '', unitLabel(resource)), node('small', '', `Start: ${amount(resource.initial)} · Bilanzabweichung: ${amount(resource.error)}`)); add(row, name, node('span', '', amount(resource.total))); totalFragment.append(row);
  }
  $('resource-totals').replaceChildren(totalFragment);
}

function renderSignals(projection) {
  const events = eventsOf(projection), sent = events.filter((event) => event.type === 'SIGNAL_EMIT'), arrived = events.filter((event) => event.type === 'SIGNAL_ARRIVED');
  text('signal-sent', count(sent.length)); text('signal-arrived', count(arrived.length)); text('signal-pending', count(pendingSignals(projection)));
  text('signal-state', `${count(channelsOf(projection).length)} Kanäle`);
  const map = entityMap(projection), channelMap = new Map(channelsOf(projection).map((channel) => [channel.id, channel]));
  const desired = [];
  for (const channel of channelsOf(projection).slice(0, 24)) {
    let record = channelNodes.get(channel.id);
    if (!record) {
      const card = node('article', 'channel-card'), direction = node('div', 'channel-direction'), from = endpoint(map.get(channel.from)), to = endpoint(map.get(channel.to)), title = node('strong'), delay = node('small');
      add(direction, from, node('span', '', '⇢'), to); add(card, title, direction, delay);
      record = { card, from, to, title, delay }; channelNodes.set(channel.id, record);
    }
    record.from.textContent = label(map.get(channel.from)); record.to.textContent = label(map.get(channel.to));
    record.title.textContent = signalNames[channel.signal] || channel.signal; record.delay.textContent = `${count(channel.delayTicks)} Modell-Ticks Verzögerung · ${channel.id}`; desired.push(record.card);
  }
  if (!channelsOf(projection).length) desired.push(node('p', 'hint', 'In diesem Szenario sind keine Signalkanäle registriert.'));
  if (channelsOf(projection).length > 24) desired.push(node('p', 'hint', `Ansicht: 24 von ${count(channelsOf(projection).length)} Kanälen. Vollständige Kanäle im Checkpoint.`));
  reconcile($('channel-list'), desired);
  const signalEvents = [...sent, ...arrived].sort((a, b) => b.sequence - a.sequence), eventFragment = document.createDocumentFragment();
  for (const event of signalEvents.slice(0, 20)) {
    const details = event.details || {}, channel = channelMap.get(details.channelId);
    const card = node('div', 'signal-event');
    add(card, node('strong', '', `#${event.sequence} · ${eventNames[event.type]}`), node('small', '', `${label(map.get(event.actor))} · ${amount(event.modelMs)} ms${channel ? ` · ${label(map.get(channel.to))}` : ''}`)); eventFragment.append(card);
  }
  if (!signalEvents.length) eventFragment.append(node('p', 'hint', 'Das bereitgestellte Eventpaket enthält keine Sendungs- oder Ankunftsereignisse.'));
  $('signal-events').replaceChildren(eventFragment);
  text('signal-coverage', `Angezeigt: ${Math.min(20, signalEvents.length)} Signalereignisse · im Paket: ${count(signalEvents.length)}. Das Eventpaket enthält ${count(events.length)} von ${count(projection.events?.totalCount)} Welt-Ereignissen.`);
}

function reconcile(parent, desired) {
  const keep = new Set(desired); let cursor = parent.firstChild;
  for (const child of desired) { if (child === cursor) cursor = cursor.nextSibling; else parent.insertBefore(child, cursor); }
  for (const child of [...parent.childNodes]) if (!keep.has(child)) child.remove();
}

function renderHistory(projection) {
  text('history-tick', count(projection.world.tick)); text('history-model-time', `${amount(projection.world.modelMs)} ms Modellzeit`);
  text('history-gap', seconds(projection.world.gapMs)); text('history-wall', seconds(projection.runtime?.observedWallMs));
  const audit = projection.audit;
  $('audit-box').dataset.state = audit ? projection.auditStale ? 'stale' : audit.passed ? 'pass' : 'fail' : 'empty';
  text('audit-title', !audit ? 'Noch keine Prüfung für diesen Stand' : projection.auditStale ? 'Prüfung gehört zu einem früheren Stand' : audit.passed ? 'Lokale Modellprüfung bestanden' : 'Abweichungen in der Modellprüfung');
  text('audit-summary', audit ? `${count(audit.eventCount)} Ereignisse geprüft · Modellzeit ${amount(audit.checkedAtModelMs)} ms. ${projection.auditStale ? 'Der aktuelle Zustand benötigt eine neue Prüfung.' : 'Der Prüfbereich ist der deklarierte lokale Modellvertrag.'}` : 'Audit ausführen prüft den vorhandenen Modellstand. Eine noch offene Prüfung erhält kein Erfolgssignal.');
  const violations = Array.isArray(audit?.violations) ? audit.violations : [];
  $('audit-violations').hidden = !violations.length;
  $('audit-violations').replaceChildren(...violations.slice(0, 20).map((violation) => node('li', '', typeof violation === 'string' ? violation : JSON.stringify(violation))));
  const query = $('event-search').value.toLocaleLowerCase('de'), events = eventsOf(projection);
  for (const event of events) eventRecords.set(`${projection.generation}:${event.sequence}`, event);
  const filtered = events.filter((event) => [event.type, event.actor, event.details?.routeId, event.details?.to].join(' ').toLocaleLowerCase('de').includes(query));
  const visible = filtered.slice(-80).reverse();
  text('event-coverage', `Angezeigt: ${count(visible.length)} · Treffer im Paket: ${count(filtered.length)} · Paket: ${count(events.length)} · Welt: ${count(projection.events?.totalCount)}. Davor ausgelassen: ${count(projection.events?.omittedBefore)}. Sequenzen ${projection.events?.fromSequence ?? '—'}–${projection.events?.toSequence ?? '—'}.`);
  const desired = [];
  for (const event of visible) {
    const key = `${projection.generation}:${event.sequence}`;
    let button = eventNodes.get(key);
    if (!button) {
      button = node('button', `event-row${event.type === 'OBSERVATION_GAP' ? ' is-gap' : ''}`); button.type = 'button'; button.dataset.eventKey = key;
      const description = node('span'); add(description, node('strong', '', `#${event.sequence} · ${eventNames[event.type] || event.type}`), node('small', '', event.actor));
      add(button, description, node('span', '', `${amount(event.modelMs)} ms`));
      button.addEventListener('click', () => { selectedEvent = key; text('event-json', JSON.stringify(eventRecords.get(key), null, 2)); $('event-detail').open = true; for (const [id, element] of eventNodes) element.classList.toggle('is-selected', id === key); });
      eventNodes.set(key, button);
    }
    button.classList.toggle('is-selected', selectedEvent === key); desired.push(button);
  }
  const focusedKey = document.activeElement?.dataset?.eventKey;
  if (focusedKey && eventNodes.has(focusedKey) && !desired.includes(eventNodes.get(focusedKey))) { desired.push(eventNodes.get(focusedKey)); text('event-coverage', `${$('event-coverage').textContent} Zusätzlich bleibt das fokussierte Ereignis bedienbar.`); }
  if (!desired.length) desired.push(node('p', 'hint', 'Keine Ereignisse im ausgewählten Paketfilter. Andere oder nicht übermittelte Ereignisse bleiben außerhalb dieses Fensters.'));
  reconcile($('event-list'), desired);
  const retained = new Set(events.map((event) => `${projection.generation}:${event.sequence}`));
  for (const key of eventNodes.keys()) if (!retained.has(key) && key !== selectedEvent && key !== focusedKey) { eventNodes.delete(key); eventRecords.delete(key); }
}

function updateQuickResult() {
  const rejected = Boolean(operationError) && !busy();
  text('quick-result-label', `${rejected ? 'Aktion abgelehnt' : frozen ? 'Eingefrorenes Bild' : 'Bestätigter Zustand'} · ${tabNames[activeTab]}`);
  $('quick-result').dataset.state = fatal || rejected ? 'error' : frozen ? 'frozen' : busy() ? 'pending' : 'ready';
  $('quick-result-button').disabled = !shownProjection;
  $('quick-result-button').setAttribute('aria-controls', `panel-${activeTab}`);
  if (!shownProjection) { text('quick-result-text', fatal ? 'Engine nicht erreichbar' : 'Warte auf die Engine'); return; }
  const projection = shownProjection, tick = count(projection.world.tick);
  if (rejected) { text('quick-result-text', frozen ? `Bild T${tick} · letzter Engine-Stand T${count(liveProjection?.world.tick)}` : `Letzter bestätigter Stand: Tick ${tick}`); return; }
  if (frozen) { text('quick-result-text', `Bild: Tick ${tick} · Engine: Tick ${count(liveProjection?.world.tick)}`); return; }
  if (busy()) { text('quick-result-text', `Anfrage ausstehend · bestätigt: Tick ${tick}`); return; }
  if (activeTab === 'system') {
    const entity = entitiesOf(projection).find((candidate) => candidate.id === selectedId), before = hasWindow(projection) ? windowStock(projection, 'before', selectedId) : null, after = hasWindow(projection) ? windowStock(projection, 'after', selectedId) : null;
    text('quick-result-text', `T${tick} · Bestand ${resourceId ? amount(stock(entity)) : '—'}${before !== null && after !== null ? ` · Δ ${signed(after - before)}` : ''}`);
  } else if (activeTab === 'flows') {
    const total = windowTransfers(projection).filter((transfer) => transfer.resource === resourceId).reduce((sum, transfer) => sum + transfer.amount, 0);
    text('quick-result-text', `T${tick} · ${hasWindow(projection) ? `${amount(total)} übertragen` : 'noch kein Transferfenster'}`);
  } else if (activeTab === 'signals') text('quick-result-text', `T${tick} · ${count(pendingSignals(projection))} Signale unterwegs`);
  else text('quick-result-text', `T${tick} · ${count(projection.world.eventCount)} Events · Lücken ${seconds(projection.world.gapMs)}`);
}

function selectTab(name, focus = false) {
  if (!(name in tabNames)) return;
  activeTab = name;
  for (const button of document.querySelectorAll('[data-tab]')) { const selected = button.dataset.tab === name; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; if (selected && focus) button.focus({ preventScroll: true }); }
  for (const panel of document.querySelectorAll('[role="tabpanel"]')) panel.hidden = panel.id !== `panel-${name}`;
  if (shownProjection) renderActiveView(shownProjection);
  updateQuickResult();
}

for (const button of document.querySelectorAll('[data-tab]')) {
  button.addEventListener('click', () => selectTab(button.dataset.tab));
  button.addEventListener('keydown', (event) => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const buttons = [...document.querySelectorAll('[data-tab]')], index = buttons.indexOf(button); const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length; selectTab(buttons[next].dataset.tab, true); });
}
for (const button of document.querySelectorAll('[data-open-tab]')) button.addEventListener('click', () => selectTab(button.dataset.openTab, true));
for (const button of document.querySelectorAll('[data-action]')) button.addEventListener('click', () => send(button.dataset.action, button.dataset.action === 'STEP' ? { ticks: Number(button.dataset.ticks) } : button.dataset.action === 'GAP' ? { deltaMs: 1000 } : {}));
$('dismiss-message').addEventListener('click', clearMessage);
$('controls-toggle').addEventListener('click', () => { const open = $('controls-toggle').getAttribute('aria-expanded') !== 'true'; $('controls-toggle').setAttribute('aria-expanded', String(open)); $('controls-panel').classList.toggle('is-open', open); });
$('scenario-choice').addEventListener('change', () => { $('profile-count-field').hidden = $('scenario-choice').value !== 'profiles'; });
$('reset-button').addEventListener('click', () => { importGeneration += 1; send('RESET', { scenario: $('scenario-choice').value, parameters: $('scenario-choice').value === 'profiles' ? { profileCount: Number($('profile-count').value) } : {} }); });
$('freeze-button').addEventListener('click', () => {
  frozen = !frozen;
  if (!frozen && liveProjection) queuePaint(liveProjection, true);
  else { window.clearTimeout(paintTimer); paintTimer = null; renderRuntime(); }
  announce(frozen ? `Anzeige bei Tick ${count(shownProjection?.world.tick)} eingefroren. Die Engine wird damit nicht angehalten.` : `Anzeige fortgesetzt. Neuester bestätigter Tick ${count(liveProjection?.world.tick)}.`);
});
$('quick-result-button').addEventListener('click', () => {
  const target = $(`panel-${activeTab}`), reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); target.focus({ preventScroll: true });
});
$('entity-search').addEventListener('input', () => { if (shownProjection) renderSelection(shownProjection); });
$('entity-choice').addEventListener('change', () => pickEntity($('entity-choice').value));
$('resource-choice').addEventListener('change', () => { resourceId = $('resource-choice').value; if (shownProjection) renderProjection(shownProjection); });
$('flow-focus').addEventListener('change', () => { if (shownProjection) renderFlows(shownProjection); });
$('event-search').addEventListener('input', () => { if (shownProjection) renderHistory(shownProjection); });
$('audit-button').addEventListener('click', () => send('AUDIT'));
$('export-button').addEventListener('click', () => send('EXPORT'));
$('add-entity-form').addEventListener('submit', (event) => { event.preventDefault(); const id = send('ADD_ENTITY', { id: $('new-entity-id').value, label: $('new-entity-label').value, parentId: $('new-entity-child').checked ? selectedId || null : null, kind: 'custom' }); if (id !== null) { $('entity-add-state').dataset.state = 'pending'; text('entity-add-state', 'Bereich angefragt. Warte auf die Antwort der Engine.'); } });
$('snapshot-file').addEventListener('change', async () => {
  const file = $('snapshot-file').files?.[0]; if (!file) return;
  const generation = ++importGeneration;
  $('import-state').dataset.state = 'pending'; text('import-state', 'Datei wird lokal gelesen und als JSON geprüft.');
  try {
    if (!/\.json$/i.test(file.name)) throw new Error('Eine Datei mit Endung .json auswählen.');
    if (file.size > 16 * 1024 * 1024) throw new Error('Die Datei ist größer als 16 MiB.');
    const bytes = await file.arrayBuffer(); if (generation !== importGeneration) return;
    const raw = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    JSON.parse(raw);
    text('import-state', `${file.name}: Wiederaufnahme angefragt. Der bisherige Lauf bleibt bis zur Annahme aktiv.`);
    send('RESTORE', { text: raw });
  } catch (error) {
    if (generation !== importGeneration) return;
    operationError = error.message; updateQuickResult();
    $('import-state').dataset.state = 'error'; text('import-state', `Datei abgelehnt. ${error.message} Der bisherige Lauf bleibt erhalten.`); announce('Checkpointdatei abgelehnt. Der bisherige Lauf bleibt erhalten.');
  } finally { if (generation === importGeneration) $('snapshot-file').value = ''; }
});

try {
  worker = new Worker(new URL('./world-worker.mjs', import.meta.url), { type: 'module' });
  worker.addEventListener('message', handleResponse);
  worker.addEventListener('error', () => { fatal = true; pending.clear(); message('Die lokale Engine konnte nicht weiter ausgeführt werden. Der letzte bestätigte Stand bleibt sichtbar. Der Startweg steht in der Dokumentation.', 'error'); announce('Die lokale Engine ist nicht erreichbar.'); renderRuntime(); });
  worker.addEventListener('messageerror', () => { message('Eine Workerantwort konnte nicht gelesen werden. Der letzte bestätigte Stand bleibt sichtbar.', 'error'); });
  send('RESET', { scenario: 'compartments', parameters: {} });
} catch (error) {
  fatal = true; message(`Die lokale Engine konnte nicht gestartet werden. ${error.message}`, 'error'); renderRuntime();
}
window.addEventListener('pageshow', (event) => { const navigation = performance.getEntriesByType('navigation')[0]; if (!event.persisted && navigation?.type !== 'back_forward') window.scrollTo({ top: 0, behavior: 'instant' }); }, { once: true });
