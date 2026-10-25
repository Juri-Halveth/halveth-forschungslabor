// SPDX-License-Identifier: MIT
import { METHODS, TOOLS, TRACKS, CASE_STUDIES, SOURCES, FAMILIES, ROLES } from './catalog.mjs';
import { buildPlan, updateTask, planMarkdown, runFixture } from './model.mjs';

const $=id=>document.getElementById(id);
const el=(tag,className,content)=>{const node=document.createElement(tag);if(className)node.className=className;if(content!==undefined)node.textContent=content;return node;};
function link(label,href,className='') {const node=el('a',className,label);node.href=href;if(href.startsWith('https://'))node.rel='noreferrer noopener';return node;}
const bySource=id=>SOURCES.find(s=>s.id===id);
function sourceLinks(ids) {const nav=el('nav','source-links');nav.setAttribute('aria-label','Primärquellen');for(const id of ids){const source=bySource(id);nav.append(link(source.publisher+' ↗',source.url));}return nav;}
function labeled(label,content) {const p=el('p');p.append(el('strong','',label),document.createTextNode(content));return p;}
let selectedFamily='all',query='',fixture='serialization',plan=null;

function renderMethods() {
  const list=METHODS.filter(m=>(selectedFamily==='all'||m.family===selectedFamily)&&[m.title,m.question,m.invariant,m.counter,m.test,...m.tools].join(' ').toLocaleLowerCase('de').includes(query));
  $('methods-grid').replaceChildren();
  for(const m of list) {
    const card=el('article','method-card');card.append(el('span','',FAMILIES[m.family].toUpperCase()),el('h3','',m.title),el('p','',m.question));
    const details=el('details'),summary=el('summary','','Prüffrage vertiefen'),body=el('div','method-detail');
    body.append(labeled('Erhaltene Eigenschaft',m.invariant),labeled('Gegenmodell',m.counter),labeled('Kleinste Prüfung',m.test),labeled('Werkzeuge',m.tools.map(id=>TOOLS.find(t=>t.id===id).name).join(' · ')),sourceLinks(m.sources));
    if(m.demo){const button=el('button','secondary','Im lokalen Modell öffnen ↗');button.type='button';button.addEventListener('click',()=>{selectFixture(m.demo);$('labor').scrollIntoView({behavior:motion(),block:'start'});});body.append(button);}
    details.append(summary,body);card.append(details);$('methods-grid').append(card);
  }
  $('no-methods').hidden=list.length!==0;$('method-results').textContent=`${list.length} von ${METHODS.length} Methoden`;
}
const motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
function selectFixture(id) {fixture=id;$('control').checked=false;document.querySelectorAll('[data-fixture]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fixture===id)));renderFixture();}
function renderFixture() {
  const result=runFixture(fixture,$('control').checked),out=$('fixture-output');out.replaceChildren();
  const intro=el('p','fixture-intro','Eingabe: '+JSON.stringify(result.input));
  const columns=el('div','fixture-columns');
  const labels=fixture==='finality'?['AKTUELLE SICHT','FINALISIERTE SICHT']:fixture==='serialization'?['MEHRDEUTIGE VERKETTUNG','TYPISIERTE FELDGRENZEN']:['ABSICHTLICH FEHLERHAFTE REGEL','GEBUNDENE REGEL'];
  [result.original,result.bound].forEach((value,i)=>{const panel=el('div','fixture-panel');panel.append(el('h3','',labels[i]),el('pre','',JSON.stringify(value,null,2)));columns.append(panel);});
  const conclusion=el('div','fixture-conclusion');conclusion.append(el('p','',result.conclusion),el('p','micro',result.ceiling));out.append(intro,columns,conclusion);
}

function inputFromForm(){return {family:$('family').value,environment:$('environment').value,observation:$('observation').value,question:$('question').value,scope:{target:$('target').value,owner:$('owner').value,policyUrl:$('policy-url').value,allowedAction:$('allowed-action').value}};}
function emptyPlan() {
  const empty=el('div','plan-empty');empty.append(el('span','reticle','⊕'),el('p','eyebrow','DEIN AUSGANGSPUNKT'),el('h3','','Eine gute Frage öffnet den nächsten Schritt.'),el('p','','Du erhältst sechs bearbeitbare Aufgaben, passende Werkzeuge und die Fragen, die deine Vermutung unterscheiden können.'),el('span','tag','REGELBASIERTER NAVIGATOR'));$('plan-output').replaceChildren(empty);
}
function download(type) {
  if(!plan)return;
  const content=type==='json'?JSON.stringify(plan,null,2)+'\n':planMarkdown(plan);
  const url=URL.createObjectURL(new Blob([content],{type:type==='json'?'application/json;charset=utf-8':'text/markdown;charset=utf-8'}));
  const a=el('a');a.href=url;a.download='halveth-security-pruefplan.'+(type==='json'?'json':'md');document.body.append(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),10000);
  $('export-status').textContent='Download angeboten. Die Datei enthält auch deine Eingaben; vor dem Teilen prüfen.';
}
function renderPlan() {
  const out=$('plan-output');out.replaceChildren();
  const head=el('div','plan-heading'),title=el('h3','',FAMILIES[plan.input.family]+' · dein Prüfplan');title.id='plan-title';title.tabIndex=-1;head.append(title,el('span','tag','LOKAL BERECHNET'));
  out.append(head,el('p','plan-route',plan.route));const tasks=el('ol','tasks');
  plan.tasks.forEach((task,i)=>{
    const article=el('li','task');article.dataset.state=task.state;
    const top=el('div','task-top');top.append(el('span','task-num',String(i+1).padStart(2,'0')),el('h4','',task.title),el('span','task-role',task.role));
    const select=el('select');select.setAttribute('aria-label','Arbeitsstand: '+task.title);
    for(const [value,label]of [['NEW','Neu'],['IN_PROGRESS','In Arbeit'],['DONE','Erledigt · selbst markiert']]){const option=el('option','',label);option.value=value;select.append(option);}select.value=task.state;
    select.addEventListener('change',()=>{plan=updateTask(plan,task.id,select.value);article.dataset.state=select.value;});
    article.append(top,el('p','',task.detail),select);tasks.append(article);
  });out.append(tasks);
  const actions=el('div','export-actions');for(const [type,label]of [['json','JSON herunterladen'],['md','Markdown herunterladen']]){const button=el('button','secondary',label);button.type='button';button.addEventListener('click',()=>download(type));actions.append(button);}
  const reset=el('button','secondary','Plan & Eingaben leeren');reset.type='button';reset.addEventListener('click',()=>{plan=null;$('plan-form').reset();$('scope-fields').open=false;$('plan-error').hidden=true;emptyPlan();});actions.append(reset);out.append(actions);
  const details=el('details','plan-meta');details.append(el('summary','','Offene Achsen & Beleggrenze'));const ul=el('ul');for(const axis of plan.axes)ul.append(el('li','',axis.id+' · UNKNOWN'));details.append(ul,el('p','',plan.progressMeaning),el('p','',plan.stop));out.append(details);
  const status=el('p','export-status');status.id='export-status';status.setAttribute('role','status');out.append(status);
}
function calculate(scroll=false){try{plan=buildPlan(inputFromForm());$('plan-error').hidden=true;renderPlan();if(scroll)$('plan-output').scrollIntoView({behavior:motion(),block:'start'});}catch(error){$('plan-error').textContent=error.message;$('plan-error').hidden=false;}}

function renderCatalog() {
  $('method-count').textContent=String(METHODS.length);$('tool-count').textContent=String(TOOLS.length);$('source-count').textContent='('+SOURCES.length+')';
  for(const track of TRACKS){const card=el('article','track');card.append(el('p','eyebrow',track.kind),el('h3','',track.title),el('p','',track.description));const tags=el('div','mini-tags');for(const id of track.methods)tags.append(el('span','mini-tag',METHODS.find(m=>m.id===id).title));card.append(tags,link(track.action+' ↗',track.link),el('p','ceiling',track.ceiling));$('tracks-grid').append(card);}
  for(const [id,label]of [['all','Alle Methoden'],...Object.entries(FAMILIES)]){const button=el('button','',label);button.type='button';button.dataset.family=id;button.setAttribute('aria-pressed',String(id===selectedFamily));button.addEventListener('click',()=>{selectedFamily=id;$('family-filters').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.family===id)));renderMethods();});$('family-filters').append(button);}
  for(const study of CASE_STUDIES){const card=el('article','case');card.id='fall-'+study.id;const top=el('div','case-top');top.append(el('span','tag',study.platform.toUpperCase()),el('span','',String(study.year)));card.append(top,el('h3','',study.title));const dl=el('dl');for(const [label,value]of [['URSACHE',study.mechanism],['BELEG',study.proof],['KORREKTUR',study.fix]])dl.append(el('dt','',label),el('dd','',value));card.append(dl,el('p','case-lesson',study.lesson));const details=el('details');details.append(el('summary','','Übertragungsgrenze'),el('p','',study.limit));card.append(details,el('p','outcome',study.outcome),sourceLinks(study.sources));$('cases-grid').append(card);}
  for(const tool of TOOLS){const card=el('article','tool-card');card.append(el('h3','',tool.name),el('p','',tool.role),link('OFFIZIELLE QUELLE ↗',bySource(tool.source).url),el('small','',tool.mode));$('tools-grid').append(card);}
  for(const role of ROLES){const card=el('article','role');card.append(el('p','role-name',role.system),el('h3','',role.title),el('p','',role.text));$('roles-grid').append(card);}
  for(const source of SOURCES){const a=link('',source.url);a.append(el('span','',source.publisher),document.createTextNode(source.title+' ↗'));$('sources-grid').append(a);}
}
renderCatalog();renderMethods();renderFixture();
$('method-search').addEventListener('input',event=>{query=event.target.value.toLocaleLowerCase('de').trim();renderMethods();});
document.querySelectorAll('[data-fixture]').forEach(button=>button.addEventListener('click',()=>selectFixture(button.dataset.fixture)));
$('control').addEventListener('change',renderFixture);
$('plan-form').addEventListener('submit',event=>{event.preventDefault();calculate(true);});
$('start-thinking').addEventListener('click',()=>{calculate();$('denkprozess').scrollIntoView({behavior:motion(),block:'start'});});
$('environment').addEventListener('change',()=>{if($('environment').value==='PROGRAM')$('scope-fields').open=true;});
// A fresh navigation starts at the entrance. Browser back/forward keeps its own position.
if ('scrollRestoration' in history) history.scrollRestoration='manual';
window.addEventListener('pageshow',event=>{const nav=performance.getEntriesByType('navigation')[0];if(!event.persisted&&nav?.type!=='back_forward')window.scrollTo({top:0,behavior:'instant'});},{once:true});
