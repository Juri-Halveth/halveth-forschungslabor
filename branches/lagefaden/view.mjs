// SPDX-License-Identifier: MIT
import {evaluatePacket} from './model.mjs';
import {cases} from './cases.mjs';
import {evaluateUsgsPair} from './usgs-source.mjs';
const byId = id => document.getElementById(id);
const picker = byId('case-picker');
const findingText = {possible_object:'möglicher Gegenstand', alternative_explanation:'andere Erklärung', unresolved:'offen'};
let selected = 0;

const w = (question, value, state='UNKNOWN') => ({question, value, state});
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

function syntheticWRows(item, result) {
  const packet = item.packet;
  const origins = [...new Set(result.rows.map(row => row.declaredOriginId))];
  const findings = [...new Set(result.rows.map(row => findingText[row.finding]))];
  const originals = result.rows.filter(row => row.kind === 'ORIGINAL_DECLARED');
  const ages = originals.map(row => row.ageMinutes).filter(Number.isFinite);
  const copies = result.reportCount - result.originalReportCount;
  const ageText = ages.length
    ? `${Math.min(...ages).toFixed(0)}–${Math.max(...ages).toFixed(0)} Minuten zum Referenzzeitpunkt`
    : 'UNKNOWN – keine vollständige Beobachtungszeit';
  return [
    w('WER?', origins.length ? origins.join(', ') + ' · nur deklarierte Ursprünge' : 'UNKNOWN', 'DEKLARIERT'),
    w('WEN?', 'UNKNOWN – betroffene Person/Entität ist kein Feld dieses Modells'),
    w('WEM?', 'UNKNOWN – konkrete Empfängerrolle ist nicht gebunden'),
    w('WESSEN?', 'UNKNOWN – Eigentum, Zuständigkeit und Rechte werden nicht aus originId geraten'),
    w('WAS?', findings.join(' · ') || 'UNKNOWN', findings.length ? 'DEKLARIERT' : 'UNKNOWN'),
    w('WANN?', `Referenz: ${packet.referenceTime} · Frischefenster: ${packet.freshnessMinutes} min`, 'BELEGT'),
    w('WIE LANGE?', ageText, ages.length ? 'ABGELEITET' : 'UNKNOWN'),
    w('WIE OFT?', `${result.reportCount} Meldungen · ${copies} Weitergaben · Revisionszahl außerhalb der Kette UNKNOWN`, 'ABGELEITET'),
    w('WO?', 'UNKNOWN – kein Ortsfeld im synthetischen Vertrag'),
    w('WOHER?', origins.length ? origins.join(', ') + ' · nicht authentisiert' : 'UNKNOWN', 'DEKLARIERT'),
    w('WOHIN?', 'Menschliche Prüfung; das Modell trifft keine Lageentscheidung', 'BELEGT'),
    w('WIE?', 'Original-/Kopierkette über parentId; Beobachtung und Empfang bleiben getrennt', 'BELEGT'),
    w('WARUM?', 'UNKNOWN – Ursache oder Motiv des Ereignisses ist nicht enthalten'),
    w('WESHALB?', `Aktueller Prüfstatus: ${result.status}; abgeleitet aus Kopien, Zeitfenster und Befunden`, 'ABGELEITET'),
    w('WOFÜR?', 'Doppelzählungen, alte Beobachtungen und Widersprüche vor einer menschlichen Entscheidung sichtbar machen', 'BELEGT'),
    w('WOMIT?', 'caseId, originId, parentId, observedAt, receivedAt und finding', 'BELEGT'),
    w('WODURCH?', 'Zusammenhang nur durch deklarierte Kopierkante und unveränderte Beobachtung; Herkunft nicht authentisiert', 'BELEGT'),
    w('WELCHE VERSION?', `${result.contract} · Fall ${result.caseId}`, 'BELEGT'),
    w('WIE SICHER?', `Außenlage: ${result.worldState} · Herkunftsauthentisierung: ${result.sourceAuthentication}`, 'BELEGT'),
    w('WAS WENN?', 'Bei Widerspruch, Zeitlücke, offenem Befund oder nur einer Quelle bleibt die Prüfung offen', 'BELEGT'),
    w('WIE WEITER?', result.action === 'HUMAN_REVIEW_ONLY' ? 'HUMAN_REVIEW_ONLY' : result.action, 'BELEGT'),
    w('WAS FEHLT?', 'Authentisierte Quelle, Ort, Betroffene, Ursache/Motiv, Sensorweg, Rechte/Zuständigkeit und unabhängige Außenbeobachtung')
  ];
}

function realWRows(snapshot, result) {
  const summary = snapshot.records.summary;
  const p = summary.properties ?? {};
  const coords = Array.isArray(summary.geometry?.coordinates) ? summary.geometry.coordinates : [];
  const where = [p.place, coords.length >= 2 ? `lon ${coords[0]}, lat ${coords[1]}` : null].filter(Boolean).join(' · ');
  const eventAt = Date.parse(result.eventTimeSummary);
  const retrievedAt = Date.parse(snapshot.feed.retrievedAt);
  const delayMinutes = Number.isFinite(eventAt) && Number.isFinite(retrievedAt)
    ? Math.max(0, (retrievedAt-eventAt)/60000).toFixed(0) + ' Minuten Ereignis → Feed-Abruf'
    : 'UNKNOWN';
  return [
    w('WER?', 'USGS als Katalog-Publisher; physische Sensoren/Operatoren in dieser Probe UNKNOWN', 'BELEGT'),
    w('WEN?', 'UNKNOWN – betroffene Menschen/Organisationen werden aus diesem Katalogeintrag nicht abgeleitet'),
    w('WEM?', 'Öffentlicher Datenzugang; LAGEFADEN zeigt ihn einer menschlichen Prüferin/einem menschlichen Prüfer', 'BELEGT'),
    w('WESSEN?', 'Katalogdarstellung: USGS; weitergehende Eigentums-/Zuständigkeitsfragen werden nicht geraten', 'BELEGT'),
    w('WAS?', result.title, 'BELEGT'),
    w('WANN?', `Ereignis ${result.eventTimeSummary} · Update ${result.updateTimeDetail} · Abruf ${snapshot.feed.retrievedAt}`, 'BELEGT'),
    w('WIE LANGE?', delayMinutes, delayMinutes === 'UNKNOWN' ? 'UNKNOWN' : 'ABGELEITET'),
    w('WIE OFT?', `${result.representationCount} API-Darstellungen · 1 gemeinsame Ereigniskennung · Anzahl physischer Beobachtungen UNKNOWN`, 'BELEGT'),
    w('WO?', where || 'UNKNOWN – kein auswertbarer Ort/Koordinatenwert', where ? 'BELEGT' : 'UNKNOWN'),
    w('WOHER?', `Feed: ${snapshot.feed.url} · Detail: ${snapshot.detail.url}`, 'BELEGT'),
    w('WOHIN?', 'Gebundener lokaler Snapshot → LAGEFADEN → menschliche Prüfung', 'BELEGT'),
    w('WIE?', 'Zwei GeoJSON-Repräsentationen werden über dieselbe USGS-Ereigniskennung verglichen; Sensorweg wird nicht erfunden', 'BELEGT'),
    w('WARUM?', 'UNKNOWN – geologische Ursache wird aus diesem Datenweg nicht hergeleitet'),
    w('WESHALB?', result.eventTimeMatches ? 'Gleiche Event-ID und gleiche Ereigniszeit tragen die Einstufung „ein Katalogereignis“' : 'Gleiche Event-ID, aber Zeitabweichung → offene Prüfung', 'ABGELEITET'),
    w('WOFÜR?', 'Quellen-, Zeit- und Kopienprüfung vor einer menschlichen Entscheidung', 'BELEGT'),
    w('WOMIT?', 'Offizieller USGS-GeoJSON-Feed, Detail-URL, Abrufzeiten, Bytezahlen und SHA-256-Receipts', 'BELEGT'),
    w('WODURCH?', 'Gemeinsame Event-ID bindet die Darstellungen katalogseitig; unabhängige Sensorherkunft bleibt UNKNOWN', 'BELEGT'),
    w('WELCHE VERSION?', `${snapshot.contract} · Katalog-Update ${result.updateTimeDetail} · Snapshot ${snapshot.feed.retrievedAt}`, 'BELEGT'),
    w('WIE SICHER?', 'Gleiches USGS-Katalogereignis: belegt durch ID/Zeiten. Sensorunabhängigkeit und Außenlage: UNKNOWN', 'BELEGT'),
    w('WAS WENN?', 'Weichen Event-ID oder Ereigniszeit ab, wird nicht automatisch zusammengeführt; menschliche Prüfung', 'BELEGT'),
    w('WIE WEITER?', 'Rohantwort-Fixtures für Replay bewahren, zweite Plattform quellengebunden anschließen und Zuordnungen gegen Gegenfälle testen', 'BELEGT'),
    w('WAS FEHLT?', 'Authentisierte Sensorprovenienz, Zahl unabhängiger Messungen, vollständige Revisionsgeschichte, Betroffene, Ursache und konkreter Nutzerworkflow')
  ];
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
    const snapshot = await response.json();
    if (snapshot.contract !== 'halveth.lagefaden.usgs-snapshot.v1'
      || snapshot.feed.url !== 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
      || snapshot.detail.url !== snapshot.records.summary.properties.detail) throw Error('INVALID_SOURCE_RECEIPT');
    const result = evaluateUsgsPair(snapshot.records.summary, snapshot.records.detail);
    if (JSON.stringify(result) !== JSON.stringify(snapshot.evaluation)) throw Error('EVALUATION_MISMATCH');
    const date = stamp => new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Berlin'}).format(new Date(stamp));
    byId('real-event').textContent = result.title;
    byId('real-times').textContent = 'Ereignis: ' + date(result.eventTimeSummary) + ' · Letzte Katalogänderung: ' + date(result.updateTimeDetail);
    byId('real-captured').textContent = 'USGS-Feed abgerufen: ' + date(snapshot.feed.retrievedAt) + ' · ID: ' + result.eventId;
    byId('real-detail-link').href = snapshot.detail.url;
    byId('real-representations').textContent = String(result.representationCount);
    byId('real-events').textContent = '1';
    byId('real-meaning').textContent = result.eventTimeMatches
      ? 'Beide USGS-Darstellungen nennen dieselbe Kennung und Ereigniszeit. Eine zweite URL ist kein zweiter Herkunftsnachweis.'
      : 'Die Ereigniskennung stimmt überein, aber die Ereigniszeiten weichen ab. Diese Änderung braucht eine menschliche Prüfung.';
    renderWGrid('real-w-grid', realWRows(snapshot, result));
  } catch (error) {
    byId('real-event').textContent = 'Datierter USGS-Snapshot nicht verfügbar';
    byId('real-meaning').textContent = 'Der echte Datenfall wird ohne gültigen lokalen Snapshot nicht ausgewertet.';
    renderWGrid('real-w-grid', [
      w('WER?', 'UNKNOWN'), w('WEN?', 'UNKNOWN'), w('WEM?', 'UNKNOWN'), w('WESSEN?', 'UNKNOWN'),
      w('WAS?', 'UNKNOWN'), w('WANN?', 'UNKNOWN'), w('WIE LANGE?', 'UNKNOWN'), w('WIE OFT?', 'UNKNOWN'),
      w('WO?', 'UNKNOWN'), w('WOHER?', 'UNKNOWN'), w('WOHIN?', 'UNKNOWN'), w('WIE?', 'UNKNOWN'),
      w('WARUM?', 'UNKNOWN'), w('WESHALB?', 'Snapshot fehlt oder ist ungültig', 'BELEGT'),
      w('WOFÜR?', 'Datenwegprüfung; ohne Snapshot keine Auswertung', 'BELEGT'), w('WOMIT?', 'UNKNOWN'),
      w('WODURCH?', 'UNKNOWN'), w('WELCHE VERSION?', 'UNKNOWN'), w('WIE SICHER?', 'Keine Auswertung', 'BELEGT'),
      w('WAS WENN?', 'Snapshot erneut quellengebunden erfassen', 'BELEGT'),
      w('WIE WEITER?', 'Fehler sichtbar halten; nicht aus alten oder fremden Daten ergänzen', 'BELEGT'),
      w('WAS FEHLT?', 'Der gebundene Datensatz selbst')
    ]);
  }
}
showRealSnapshot();
