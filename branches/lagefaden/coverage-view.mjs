// SPDX-License-Identifier: MIT
import {buildCoverageMatrix,unavailableSource} from './coverage.mjs';

const labels={DOCUMENTED:'Im Datensatz',PARTIAL:'Teilantwort',UNKNOWN:'Offen',PENDING:'Lädt',UNAVAILABLE:'Nicht verfügbar'};
const marks={DOCUMENTED:'●',PARTIAL:'◐',UNKNOWN:'○',PENDING:'…',UNAVAILABLE:'—'};
const basis={DATA:'Gespeichertes Datenfeld',RECEIPT:'Abrufreceipt',DERIVED:'Berechnet / eingeordnet',DESIGN:'Anwendungsentwurf',UNKNOWN:'Offene Teilfrage'};
const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
const byId=id=>document.getElementById(id);

export function mountCoverage() {
  const sources=new Map(['USGS','EONET','CEMS'].map(id=>[id,unavailableSource(id,'PENDING')]));
  let matrix,filter='all',selection={rowId:'W09',sourceId:'USGS'};
  function visible(row) {
    if(filter==='gaps') return row.cells.some(c=>c.state==='UNKNOWN'||c.state==='UNAVAILABLE'||c.state==='PENDING'||c.facets.some(f=>f.state==='UNKNOWN'));
    if(filter==='contrast') {
      const present=row.cells.filter(c=>c.answer);
      return present.length>1 && new Set(present.map(c=>c.facets.map(f=>f.id+':'+f.state).join('|'))).size>1;
    }
    return true;
  }
  function detail() {
    const row=matrix.rows.find(r=>r.id===selection.rowId);
    const cell=row.cells.find(c=>c.sourceId===selection.sourceId);
    const source=matrix.sources.find(s=>s.id===cell.sourceId);
    byId('coverage-detail-title').textContent=row.question+' · '+source.label;
    byId('coverage-detail-scope').textContent='Geprüfter Ausschnitt: '+row.scope+'.';
    byId('coverage-detail-answer').textContent=cell.answer?.value??(cell.state==='PENDING'?'Der lokale Snapshot wird geladen.':'Der lokale Snapshot fehlt oder ist ungültig. Seine Antworten werden nicht als Ereignislücken gezählt.');
    byId('coverage-detail-case').textContent=source.caseId ? 'Gebundener Fall: '+source.caseId+' · '+source.title : 'Für diese Spalte liegt noch kein gültiger Fall vor.';
    const parts=byId('coverage-facets');parts.replaceChildren();
    for(const f of cell.facets) {
      const li=el('li',undefined,'coverage-facet');
      li.dataset.basis=f.state;
      li.append(el('strong',f.label),el('span',basis[f.state],'coverage-basis'),el('p',f.value));
      if(f.evidence.length) {
        const refs=el('details');refs.append(el('summary','Belegstelle ansehen'));
        for(const ref of f.evidence) {
          if(ref.kind==='SNAPSHOT_FIELD') {
            refs.append(el('code',source.snapshotReceipt.path+'#'+ref.pointer));
            refs.append(el('pre',JSON.stringify(ref.value,null,2)));
          } else refs.append(el('code',ref.path+' · '+ref.locator));
        }
        li.append(refs);
      }
      parts.append(li);
    }
    const receipt=byId('coverage-receipt');receipt.replaceChildren();
    if(source.snapshotReceipt) {
      const link=el('a','Gespeicherten Snapshot öffnen ↗');link.href=source.snapshotReceipt.path;
      receipt.append(link,el('code','SHA-256: '+source.snapshotReceipt.sha256),el('small','Hash des geladenen Snapshot-Files; Rohantwort-Hashes stehen separat in dessen Abrufreceipts.'));
    }
  }
  function render() {
    matrix=buildCoverageMatrix([...sources.values()]);
    const available=matrix.sources.filter(c=>c.availability==='PRESENT').length;
    byId('coverage-status').textContent=available+' von 3 gespeicherten Fällen verfügbar · 22 festgelegte Fragen · jede Spalte behält ihre Ereigniskennung';
    for(const source of matrix.sources) byId('coverage-case-'+source.id.toLowerCase()).textContent=source.caseId??labels[source.availability];
    const body=byId('coverage-body');body.replaceChildren();
    const shown=matrix.rows.filter(visible);
    for(const row of shown) {
      const tr=el('tr');const th=el('th',row.question);th.scope='row';tr.append(th);
      for(const cell of row.cells) {
        const td=el('td');const button=el('button',undefined,'coverage-cell');button.type='button';button.dataset.state=cell.state;
        button.dataset.question=row.question;button.dataset.source=cell.sourceId;
        button.setAttribute('aria-label',row.question+' · '+matrix.sources.find(s=>s.id===cell.sourceId).label+' · '+labels[cell.state]);
        button.setAttribute('aria-controls','coverage-detail');
        button.setAttribute('aria-pressed',String(selection.rowId===row.id&&selection.sourceId===cell.sourceId));
        const symbol=el('span',marks[cell.state],'coverage-mark');symbol.setAttribute('aria-hidden','true');
        button.append(symbol,el('span',labels[cell.state]));
        button.addEventListener('click',()=>{
          selection={rowId:row.id,sourceId:cell.sourceId};
          for(const other of body.querySelectorAll('button'))other.setAttribute('aria-pressed',String(other===button));
          detail();
        });
        td.append(button);tr.append(td);
      }
      body.append(tr);
    }
    if(!shown.length) {
      const tr=el('tr'),td=el('td','In den verfügbaren Spalten passt aktuell keine Frage zu diesem Filter.');td.colSpan=4;tr.append(td);body.append(tr);
    }
    byId('coverage-filter-count').textContent=shown.length+' von 22 Fragen sichtbar';
    const shared=byId('coverage-shared');shared.replaceChildren();
    if(matrix.commonGapStatus==='INCOMPLETE_SOURCE_COVERAGE')shared.append(el('li','Der gemeinsame Lückenvergleich wartet auf alle drei gültigen Snapshots.'));
    else for(const f of matrix.sharedUnknown)shared.append(el('li',f.label));
    const contrast=byId('coverage-contrast');contrast.replaceChildren();
    for(const f of matrix.contrast) {
      const bound=f.sources.filter(s=>s.state!=='UNKNOWN').map(s=>s.sourceId+' / '+s.caseId).join(' · ');
      contrast.append(el('li',f.label+': gebunden bei '+bound));
    }
    if(!matrix.contrast.length)contrast.append(el('li',available<2?'Mindestens zwei gültige Fälle werden benötigt.':'Im definierten Facettenvergleich liegt keine solche Differenz vor.'));
    byId('coverage-answer-count').textContent=matrix.answerInventory.length+' gebundene Teilantworten';
    byId('coverage-export').disabled=available===0;
    detail();
  }
  for(const button of document.querySelectorAll('[data-coverage-filter]'))button.addEventListener('click',()=>{
    filter=button.dataset.coverageFilter;
    for(const other of document.querySelectorAll('[data-coverage-filter]'))other.setAttribute('aria-pressed',String(other===button));
    render();
  });
  byId('coverage-export').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(matrix,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download='lagefaden-w-coverage-v1.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  render();
  return source=>{if(!sources.has(source.id))throw Error('UNKNOWN_COVERAGE_SOURCE');sources.set(source.id,source);render();};
}
