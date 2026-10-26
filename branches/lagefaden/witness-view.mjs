// SPDX-License-Identifier: MIT
import {evaluateReplay} from './witness-replay.mjs';
import {witnessCases} from './witness-cases.mjs';
const byId=id=>document.getElementById(id);
const kindText={OBSERVATION:'Eigene Sicht angegeben',FORWARD:'Weitergabe',REACTION:'Reaktion auf eine Meldung',
  PEER_ACTION_OBSERVATION:'Handlung eines anderen Knotens beobachtet',VIEW_LOST:'Sichtverlust gemeldet',VIEW_RESTORED:'Sicht wiederhergestellt gemeldet'};
const claimText={possibly_blocked:'Hilfsweg möglicherweise versperrt',free:'Hilfsweg frei',unresolved:'Wegbefund offen'};
const stateText={REVIEWER_UNAVAILABLE:'Die menschliche Prüfung ist nicht besetzt.',PROVENANCE_REVIEW:'Der Ursprung einer Weitergabe fehlt.',
  CONFLICT_REVIEW:'Aktuelle eigene Angaben widersprechen sich.',GAP_REVIEW:'Eine Sicht oder ihr Zeitbezug bleibt offen.',HUMAN_REVIEW:'Die Angaben liegen zur menschlichen Prüfung vor.'};
const viewText={NO_ROUTE_OBSERVATION:'Noch keine eigene Wegbeobachtung',VIEW_LOST:'Sichtverlust angegeben',
  RESTORED_AWAITING_OBSERVATION:'Wieder da · neue Sichtung steht aus',OBSERVATION_RECEIVED:'Eigene Wegbeobachtung eingegangen'};
const clock=s=>new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'UTC'}).format(new Date(s));
const el=(tag,text,className)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;};
export function mountWitnessReplay(){
  const select=byId('witness-case');
  let selected=0,step=witnessCases[0].packet.events.length+1;
  witnessCases.forEach((c,i)=>{const o=el('option',`${String(i+1).padStart(2,'0')} · ${c.title}`);o.value=String(i);select.append(o);});
  function render(){
    const c=witnessCases[selected],r=evaluateReplay(c.packet,step);
    byId('witness-story').textContent=c.story;
    byId('witness-position').textContent=`Schritt ${step} / ${r.totalSteps} · ${clock(r.asOf)} UTC · erfundene Modellzeit`;
    const progress=byId('witness-progress');progress.max=r.totalSteps;progress.value=step;
    byId('witness-prev').disabled=step===0;byId('witness-next').disabled=step===r.totalSteps;
    byId('witness-event-count').textContent=String(r.receivedEvents);
    byId('witness-own-count').textContent=String(r.ownRouteObservations);
    byId('witness-copy-count').textContent=String(r.forwardedReports);
    byId('witness-peer-count').textContent=String(r.peerSignals);
    byId('witness-state').textContent=stateText[r.reviewState];
    byId('witness-state').dataset.state=r.reviewState;
    byId('witness-fresh').textContent=`${r.freshDeclaredOrigins} frische Ursprungskennungen angegeben. Ihre tatsächliche Unabhängigkeit bleibt offen.`;
    const nodes=byId('witness-nodes');nodes.replaceChildren();
    for(const n of c.packet.nodes){
      const rows=r.rows.filter(row=>row.nodeId===n);
      const card=el('article',null,'witness-node');
      card.dataset.node=n;
      card.append(el('span',`◈ ${n}`,'witness-node-mark'),el('h4',`Virtueller Beobachter ${n}`));
      card.append(el('p',viewText[r.viewGaps.find(g=>g.nodeId===n)?.reason ?? 'OBSERVATION_RECEIVED'],'witness-view-state'));
      const ul=el('ul');
      if(!rows.length)ul.append(el('li','Noch keine Nachricht eingegangen.'));
      for(const row of rows){
        const li=el('li',`${row.id} · ${kindText[row.kind]}`);
        if(row.rootId)li.append(el('small',`Wegursprung ${row.rootId}${row.kind==='FORWARD' ? ' · bleibt eine Weitergabe' : ''}`));
        ul.append(li);
      }
      card.append(ul);nodes.append(card);
    }
    const list=byId('witness-events');list.replaceChildren();
    if(!r.rows.length)list.append(el('li','Start: Es liegt noch keine Nachricht vor.'));
    for(const row of r.rows){
      const li=el('li');li.dataset.kind=row.kind;
      li.append(el('strong',`${row.id} · ${kindText[row.kind]}`));
      li.append(el('span',`Eingang ${clock(row.at)} UTC${row.refId ? ' · Bezug: '+row.refId : ''}`));
      if(row.claim)li.append(el('p',claimText[row.claim]));
      if(row.rootId){
        const age=row.ageMinutes===null ? 'Beobachtungszeit fehlt' : `${Math.round(row.ageMinutes)} Minuten seit der Ursprungssichtung`;
        li.append(el('small',`Wegursprung: ${row.rootId} · ${age} · ${({IN_WINDOW:'im 60-Minuten-Fenster',STALE:'zu alt für dieses Zeitfenster',TIME_UNKNOWN:'Zeit offen'})[row.timeState]}`));
      } else li.append(el('small',row.routeEvidence==='PROVENANCE_MISSING' ? 'Ursprung fehlt · keine eigene Wegsichtung hinzugezählt.' : 'Kein neuer Befund über den Hilfsweg.'));
      list.append(li);
    }
    const gaps=byId('witness-gaps');gaps.replaceChildren();
    for(const g of r.viewGaps)gaps.append(el('li',`${g.nodeId}: ${viewText[g.reason]}.`));
    for(const missing of r.missingProvenance)gaps.append(el('li',`${missing}: referenzierter Ursprung fehlt.`));
    for(const old of r.core?.rows.filter(row=>row.kind==='ORIGINAL_DECLARED'&&row.timeState!=='FRESH_DECLARED') ?? [])gaps.append(el('li',`${old.id}: ${old.timeState==='STALE_OBSERVATION' ? 'eigene Sicht ist zu alt' : 'Beobachtungszeit fehlt'}.`));
    if(r.conflict)gaps.append(el('li','A und C geben verschiedene aktuelle Wegbefunde an. Eine neue, unabhängig belegte Sicht könnte zur Klärung beitragen.'));
    if(!gaps.children.length)gaps.append(el('li','Im Paket liegen die aktuellen Angaben vor. Die Authentisierung der Quellen und die reale Weglage sind weiter offen.'));
    byId('witness-author-note').textContent=c.authorNote;
  }
  select.addEventListener('change',()=>{selected=Number(select.value);step=witnessCases[selected].packet.events.length+1;render();});
  byId('witness-prev').addEventListener('click',()=>{step--;render();});
  byId('witness-next').addEventListener('click',()=>{step++;render();});
  byId('witness-reset').addEventListener('click',()=>{step=0;render();});
  byId('witness-end').addEventListener('click',()=>{step=witnessCases[selected].packet.events.length+1;render();});
  byId('witness-export').addEventListener('click',()=>{
    const c=witnessCases[selected];
    const data={contract:'halveth.lagefaden.witness-export.v1',sample:c.packet,evaluation:evaluateReplay(c.packet,step),
      comparison:{state:'PROTOCOL_PREPARED_NOT_RUN',protocol:'WITNESS_REPLAY.md',humanBenefit:'NOT_MEASURED'}};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}));
    const a=el('a');a.href=url;a.download=`lagefaden-witness-${c.id.toLowerCase()}.json`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  render();
}
