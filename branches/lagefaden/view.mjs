// SPDX-License-Identifier: MIT
import {evaluatePacket} from './model.mjs';
import {cases} from './cases.mjs';
import {syntheticWRows,unavailableWRows} from './w-space.mjs';
import {buildSourceCoverage,unavailableSource} from './coverage.mjs';
import {mountCoverage} from './coverage-view.mjs';
import {mountWitnessReplay} from './witness-view.mjs';
const byId = id => document.getElementById(id);
const date = stamp => new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Berlin'}).format(new Date(stamp)) + ' Uhr (Berlin)';
const picker = byId('case-picker');
const findingText = {possible_object:'möglicher Gegenstand', alternative_explanation:'andere Erklärung', unresolved:'offen'};
let selected = 0;
const updateCoverage = mountCoverage();
mountWitnessReplay();

function renderWGrid(targetId, rows) {
  const grid = byId(targetId);
  grid.replaceChildren();
  for (const row of rows) {
    const box = document.createElement('div');
    box.className = 'w-item';
    const dt = document.createElement('dt');
    dt.textContent = row.question;
    const badge = document.createElement('span');
    badge.className = 'w-state';
    badge.dataset.state = row.state;
    badge.textContent = row.state;
    dt.append(badge);
    const dd = document.createElement('dd');
    dd.textContent = row.value;
    box.append(dt, dd);
    grid.append(box);
  }
}

function show(index) {
  selected = index;
  const item = cases[index];
  const result = evaluatePacket(item.packet);
  [...picker.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  byId('case-title').textContent = item.title;
  byId('case-explanation').textContent = item.explanation;
  byId('report-count').textContent = String(result.reportCount);
  byId('origin-count').textContent = String(result.freshDeclaredOrigins);
  byId('case-status').textContent = ({REVIEW_CONFLICT:'Widerspruch: menschlich prüfen', REVIEW_GAP:'Zeitlücke: menschlich prüfen', REVIEW_UNRESOLVED:'Offener Befund: menschlich prüfen', REVIEW_SINGLE_SOURCE:'Nur eine frische Quelle angegeben: menschlich prüfen', PROVISIONAL_CONSISTENT:'Meldungen passen zusammen – Ursprung weiterhin nur deklariert'})[result.status];
  const list = byId('report-list');
  list.replaceChildren();
  for (const row of result.rows) {
    const li = document.createElement('li');
    li.append(document.createTextNode(`${row.id} · ${row.kind === 'COPY_DECLARED' ? 'Weitergabe von '+row.rootId : 'Originalmeldung'} · ${findingText[row.finding]}`));
    const small = document.createElement('small');
    small.textContent = `Ursprung: ${row.declaredOriginId} · ${row.timeState === 'FRESH_DECLARED' ? 'Beobachtung im Zeitfenster' : row.timeState === 'STALE_OBSERVATION' ? 'Beobachtung zu alt' : 'Beobachtungszeit unbekannt'}`;
    li.append(small); list.append(li);
  }
  renderWGrid('w-grid', syntheticWRows(item, result));
}
for (const [index, item] of cases.entries()) {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = `${String(index+1).padStart(2,'0')} · ${item.title}`;
  button.addEventListener('click', () => show(index)); picker.append(button);
}
byId('download').addEventListener('click', () => {
  const data = {sample:cases[selected], evaluation:evaluatePacket(cases[selected].packet)};
  const blob = new Blob([JSON.stringify(data,null,2)+'\n'], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`lagefaden-${data.sample.packet.caseId.toLowerCase()}.json`;
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
show(0);

async function showRealSnapshot() {
  try {
    const response = await fetch('./data/usgs-example.json');
    if (!response.ok) throw Error('SNAPSHOT_NOT_AVAILABLE');
    const source = await buildSourceCoverage('USGS',new Uint8Array(await response.arrayBuffer()));
    const {snapshot,evaluation:result} = source;
    byId('real-event').textContent = result.title;
    byId('real-times').textContent = 'Ereignis: ' + date(result.eventTimeSummary) + ' · Letzte Katalogänderung: ' + date(result.updateTimeDetail);
    byId('real-captured').textContent = 'USGS-Feed abgerufen: ' + date(snapshot.feed.retrievedAt) + ' · ID: ' + result.eventId;
    byId('real-detail-link').href = snapshot.detail.url;
    byId('real-representations').textContent = String(result.representationCount);
    byId('real-events').textContent = '1';
    byId('real-meaning').textContent = result.eventTimeMatches
      ? 'Beide USGS-Darstellungen nennen dieselbe Kennung und Ereigniszeit. Eine zweite URL ist kein zweiter Herkunftsnachweis.'
      : 'Die Ereigniskennung stimmt überein, aber die Ereigniszeiten weichen ab. Diese Änderung braucht eine menschliche Prüfung.';
    renderWGrid('real-w-grid', source.answers);
    updateCoverage(source);
  } catch (error) {
    byId('real-event').textContent = 'Datierter USGS-Snapshot nicht verfügbar';
    byId('real-meaning').textContent = 'Der echte Datenfall wird ohne gültigen lokalen Snapshot nicht ausgewertet.';
    renderWGrid('real-w-grid', unavailableWRows());
    updateCoverage(unavailableSource('USGS'));
  }
}
showRealSnapshot();

async function showEonetSnapshot() {
  try {
    const response = await fetch('./data/eonet-example.json');
    if (!response.ok) throw Error('SNAPSHOT_NOT_AVAILABLE');
    const source = await buildSourceCoverage('EONET',new Uint8Array(await response.arrayBuffer()));
    const {snapshot,evaluation:result} = source;
    byId('eonet-title').textContent = result.title;
    byId('eonet-stat').textContent = '2 API-Ansichten → 1 kuratiertes Ereignis';
    byId('eonet-times').textContent = 'Erste / letzte Geometriezeit: ' + date(result.firstGeometryTime) + ' / ' + date(result.lastGeometryTime);
    byId('eonet-refs').textContent = result.referencesMatch
      ? result.referenceCount + ' verlinkte Quellen: ' + result.sourceReferenceIds.join(', ') + '. Ihre Mess-Unabhängigkeit bleibt offen.'
      : 'Die Quellverweise unterscheiden sich zwischen Übersicht und Detail. Menschlich prüfen.';
    byId('eonet-captured').textContent = 'Listenabruf: ' + date(snapshot.list.retrievedAt) + ' · Detailabruf: ' + date(snapshot.detail.retrievedAt) + ' · ID: ' + result.eventId;
    byId('eonet-link').href = snapshot.detail.url;
    renderWGrid('eonet-w-grid',source.answers);
    updateCoverage(source);
  } catch {
    byId('eonet-title').textContent = 'Datierter EONET-Snapshot nicht verfügbar';
    byId('eonet-stat').textContent = 'Keine Auswertung';
    byId('eonet-refs').textContent = 'Ohne gültigen lokalen Snapshot bleibt dieser Datenfall offen.';
    renderWGrid('eonet-w-grid',unavailableWRows());
    updateCoverage(unavailableSource('EONET'));
  }
}

async function showCemsSnapshot() {
  try {
    const response = await fetch('./data/cems-example.json');
    if (!response.ok) throw Error('SNAPSHOT_NOT_AVAILABLE');
    const source = await buildSourceCoverage('CEMS',new Uint8Array(await response.arrayBuffer()));
    const {snapshot,evaluation:result} = source;
    const code = result.activationCode;
    byId('cems-title').textContent = result.title;
    byId('cems-stat').textContent = '2 API-Ansichten → 1 Aktivierung';
    byId('cems-times').textContent = 'Ereignis: ' + date(result.eventTime) + ' · Aktiviert: ' + date(result.activationTime);
    byId('cems-updates').textContent = result.updatesMatch
      ? 'Beide Ansichten zuletzt geändert: ' + date(result.mappingUpdateTime)
      : 'Änderungszeiten verschieden: Mapping ' + date(result.mappingUpdateTime) + ' · Rapid ' + date(result.rapidUpdateTime) + '. Das ist ein Prüfpunkt, kein zweites Ereignis.';
    byId('cems-captured').textContent = 'Listen abgerufen: ' + date(snapshot.mappingList.retrievedAt) + ' / ' + date(snapshot.rapidList.retrievedAt);
    byId('cems-credit-code').textContent = code;
    byId('cems-link').href = snapshot.detail.url;
    renderWGrid('cems-w-grid',source.answers);
    updateCoverage(source);
  } catch {
    byId('cems-title').textContent = 'Datierter CEMS-Snapshot nicht verfügbar';
    byId('cems-stat').textContent = 'Keine Auswertung';
    byId('cems-updates').textContent = 'Ohne gültigen öffentlichen Snapshot bleibt dieser Datenfall offen.';
    renderWGrid('cems-w-grid',unavailableWRows());
    updateCoverage(unavailableSource('CEMS'));
  }
}
showEonetSnapshot();
showCemsSnapshot();
