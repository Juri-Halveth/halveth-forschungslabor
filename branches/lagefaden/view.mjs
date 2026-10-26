// SPDX-License-Identifier: MIT
import {evaluatePacket} from './model.mjs';
import {cases} from './cases.mjs';
const byId = id => document.getElementById(id);
const picker = byId('case-picker');
const findingText = {possible_object:'möglicher Gegenstand', alternative_explanation:'andere Erklärung', unresolved:'offen'};
let selected = 0;
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
