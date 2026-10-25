// SPDX-License-Identifier: MIT
import { METHODS, TOOLS, FAMILIES, VERSION } from './catalog.mjs';

const ENVIRONMENTS = ['PUBLIC_SOURCES','OWN_LOCAL','PROGRAM'];
const OBSERVATIONS = ['IDEA','SOURCE','LOCAL','IMPACT'];
const AXES = ['ENTRY_SURFACE','TRANSPORT_EDGE','PARSER_CANONICALIZATION','AUTHENTICATED_IDENTITY','AUTHORIZATION_OBJECT_BINDING','STATE_TRANSITION','VERSION_UPDATE','DEPENDENCY_ENVIRONMENT','OBSERVABILITY_RECOVERY'];
function plain(value, keys, label) {
  if (!value || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw Error(label + ': Plain-JSON-Objekt erforderlich');
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!keys.includes(key) || !Object.hasOwn(descriptor, 'value')) throw Error(label + ': unbekanntes oder dynamisches Feld ' + key);
  }
  if (Reflect.ownKeys(value).length !== Object.keys(value).length) throw Error(label + ': nicht serialisierbare Felder');
}
function text(value, max, label) {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) throw Error(label + ': ungültiger Text oder Längenlimit');
  for (let i=0;i<value.length;i++) {
    const code=value.charCodeAt(i);
    if (code>=0xD800 && code<=0xDBFF) { const next=value.charCodeAt(++i); if (!(next>=0xDC00&&next<=0xDFFF)) throw Error(label+': ungültiges Unicode'); }
    else if (code>=0xDC00&&code<=0xDFFF) throw Error(label+': ungültiges Unicode');
  }
  return value;
}
export function validateInput(input) {
  plain(input,['family','environment','observation','question','scope'],'Eingabe');
  if (typeof input.family!=='string' || !Object.hasOwn(FAMILIES,input.family)) throw Error('Unbekannte Forschungsfamilie');
  if (!ENVIRONMENTS.includes(input.environment) || !OBSERVATIONS.includes(input.observation)) throw Error('Unbekannter Ausgangszustand');
  text(input.question,2400,'Frage');
  plain(input.scope,['target','owner','policyUrl','allowedAction'],'Scope');
  for (const key of ['target','owner','allowedAction']) text(input.scope[key],500,key);
  text(input.scope.policyUrl,1500,'Policy-URL');
  if (input.scope.policyUrl) {
    let url; try { url=new URL(input.scope.policyUrl); } catch { throw Error('Policy-URL: gültige HTTPS-Adresse erforderlich'); }
    if (url.protocol!=='https:' || url.username || url.password) throw Error('Policy-URL: nur HTTPS ohne Zugangsdaten');
  }
  return input;
}
const task=(id,title,detail,role)=>({id,title,detail,role,state:'NEW',evidenceState:'NOT_RECORDED'});
export function buildPlan(input) {
  validateInput(input);
  const methods=METHODS.filter(method=>method.family===input.family);
  const needed=['target','owner','policyUrl','allowedAction'].filter(key=>!input.scope[key].trim());
  const route=input.environment==='PROGRAM'?'BIND_CURRENT_PROGRAM_POLICY':input.environment==='OWN_LOCAL'?'COMPARE_OWNED_SYNTHETIC_FIXTURE':'TRACE_PUBLIC_SOURCE';
  const first=route==='BIND_CURRENT_PROGRAM_POLICY'
    ?task('scope','Aktuelle Policy und exaktes Asset binden',needed.length?'Noch offen: '+needed.join(', ')+'. Zuerst Quelle und zulässige Handlung dokumentieren.':'Die Felder sind ausgefüllt. Nun die tatsächliche Policy, Ausschlüsse und erlaubten Verfahren an der Quelle prüfen.','RACHEL')
    :route==='COMPARE_OWNED_SYNTHETIC_FIXTURE'
      ?task('scope','Eigenen lokalen Prüfstand festlegen','Dieses Browserlabor kann seine festen synthetischen Beispiele berechnen. Andere lokale Dienste oder Geräte brauchen einen eigenen Ausführungsscope.','HALVETH')
      :task('scope','Öffentliche Quelle und Version lesen','Einen konkreten Quellstand, den tatsächlichen Consumer und die gewünschte Sicherheitseigenschaft festhalten.','HALVETH');
  const tasks=[first,
    task('trace','Vorwärts und rückwärts denselben Consumer finden','Eingabe durch Parser und Verifier verfolgen; die vermutete Wirkung rückwärts durch Entscheidung und benötigte Kontrolle verfolgen. Beide Sichten müssen denselben versionsgebundenen Punkt adressieren.','HALVETH'),
    task('counter','Gegenmodell und kleinste Gegenprobe formulieren',methods[0].counter+' Unterscheidende lokale Prüfung: '+methods[0].test,'LUCINET'),
    task('effect','Beobachtung und behauptete Wirkung vergleichen','Version, Eingabe, tatsächlich beobachtete Ausgabe und fehlende Wirkungskante getrennt notieren. Ein Source-Fund oder Modellpass bleibt in seinem Scope.','LUCINET'),
    task('review','Korrektur und normalen Pfad gegenprüfen','Absichtlich defekte Kontrolle, korrigierte Variante und legitime Nutzung gegen dieselbe erwartete Eigenschaft prüfen.','LUCINET'),
    task('handoff','Berichtsstand und Wiederaufnahme festhalten','Reproduktion, Grenzen, Verantwortlichkeit und nächsten Auslöser dokumentieren. Aktuelle Einreichungs- und Veröffentlichungsregeln getrennt prüfen.','RACHEL')];
  return {
    schema:'halveth.security-research-plan.v1',logicVersion:VERSION,
    input:JSON.parse(JSON.stringify(input)),route,
    authority:{state:'DECLARED_NOT_VERIFIED',externalExecution:'NONE',policyFetch:'NONE',targetContact:'NONE'},
    observation:{state:'USER_DECLARED',kind:input.observation},
    claimCeiling:'DETERMINISTIC_RESEARCH_PLAN_ONLY',
    axes:AXES.map(id=>({id,state:'UNKNOWN',reason:'Für diesen konkreten Fall noch quellengebunden zu prüfen.'})),
    methods:methods.map(m=>m.id),tools:[...new Set(methods.flatMap(m=>m.tools))],tasks,
    openQuestions:methods.map(m=>m.question),
    stop:'Vor fremdem Datenzugriff, Payload, Zustandsänderung, Last, Versand oder Veröffentlichung einen getrennten aktuellen Scope binden.',
    reopen:'Neue versionsgebundene Quelle, unterscheidende lokale Beobachtung oder konkrete autorisierte Wirkungskante.',
    progressMeaning:'Vom Nutzer markierter Arbeitsstand; keine Verifikation von Wirkung, Erlaubnis, Einreichung oder Vergütung.',
  };
}

export function updateTask(plan,id,state) {
  if (!['NEW','IN_PROGRESS','DONE'].includes(state)) throw Error('Unbekannter Auftragszustand');
  if (!plan.tasks.some(t=>t.id===id)) throw Error('Unbekannter Auftrag');
  return {...plan,tasks:plan.tasks.map(t=>t.id===id?{...t,state,evidenceState:'USER_DECLARED_PROGRESS'}:t)};
}
export function planMarkdown(plan) {
  const quoted=value=>String(value).replace(/\r\n?/g,'\n').split('\n').map(line=>'    '+line).join('\n');
  const lines=['# Lokaler Security-Forschungsplan','',`Methode: ${plan.logicVersion}`,`Bereich: ${FAMILIES[plan.input.family]}`,
    `Route: ${plan.route}`,'','Die Angaben sind Nutzereingaben. Dieser Plan führt keine Netzprüfung aus.','',
    '## Angegebene Frage','',quoted(plan.input.question||'Noch zu formulieren'),'','## Angegebener Scope',''];
  for(const [key,label]of [['target','Asset / Prüfstand'],['owner','Eigentümer'],['policyUrl','Policy-Quelle'],['allowedAction','Erlaubte Handlung']])lines.push(label+':','',quoted(plan.input.scope[key]||'UNKNOWN'),'');
  if(plan.exportReceipt)lines.push('Exportzeit: '+plan.exportReceipt.recordedAt,'Zeitbasis: '+plan.exportReceipt.timeBasis,'');
  for (const t of plan.tasks) lines.push(`## ${t.title}`,`Rolle: ${t.role} · Arbeitsstand: ${t.state}`,t.detail,'');
  lines.push('## Offene Fragen',...plan.openQuestions.map(q=>'- '+q),'','## Werkzeuge',...plan.tools.map(id=>'- '+TOOLS.find(t=>t.id===id).name),'','## Grenze',plan.stop,'','## Wiederaufnahme',plan.reopen,'','## Beleggrenze',plan.claimCeiling,plan.progressMeaning);
  return lines.join('\n')+'\n';
}

export function stampExport(plan,recordedAt) {
  if(typeof recordedAt!=='string'||!Number.isFinite(Date.parse(recordedAt))||new Date(recordedAt).toISOString()!==recordedAt)throw Error('Exakte ISO-UTC-Exportzeit erforderlich');
  return {...plan,exportReceipt:{recordedAt,timeBasis:'CLIENT_WALL_CLOCK_NOT_CALIBRATED',meaning:'Export event only; no source discovery, authorization, submission or payment time'}};
}

export function runFixture(id,control=false) {
  if (typeof control!=='boolean') throw Error('Kontrolle muss boolesch sein');
  if (id==='serialization') {
    const left=['a','bc'],right=control?['a','bc']:['ab','c'];
    return {id,kind:'SYNTHETIC_REPRESENTATION_COMPARISON',input:{left,right},
      original:{left:left.join(''),right:right.join(''),equal:left.join('')===right.join('')},
      bound:{left:JSON.stringify(left),right:JSON.stringify(right),equal:JSON.stringify(left)===JSON.stringify(right)},
      conclusion:control?'Gleiche Tupel bleiben in beiden Darstellungen gleich.':'Die Verkettung ist gleich; die zwei geordneten Tupel sind verschieden. Typisierte Grenzen erhalten den Unterschied.',
      ceiling:'Darstellungsvergleich; keine kryptografische Hashkollision und keine Zahlungswirkung.'};
  }
  if (id==='identity') {
    const principal='alice',owner=control?'alice':'bob';
    return {id,kind:'SYNTHETIC_AUTHORIZATION_COMPARISON',input:{principal,owner},
      original:{decision:'ALLOW',reason:'Nur Anmeldung geprüft.'},
      bound:{decision:principal===owner?'ALLOW':'DENY',reason:'Angemeldetes Subjekt mit Objekteigentümer verglichen.'},
      conclusion:control?'Das eigene Objekt bleibt erlaubt.':'Die gehärtete Regel weist die vertauschte Objektidentität zurück.',
      ceiling:'Zwei feste In-Memory-Subjekte; keine Anfrage an ein fremdes Konto.'};
  }
  if (id==='lifecycle') {
    const oldState={requestOwner:'alice'};
    const original=control?{requestOwner:null}:{...oldState};
    const bound={requestOwner:null};
    return {id,kind:'SYNTHETIC_WORKER_LIFECYCLE',input:{priorRequest:'alice',abort:!control,nextRequest:'starts-before-owner-is-set'},
      original:{visibleOwner:original.requestOwner??'UNSET'},bound:{visibleOwner:bound.requestOwner??'UNSET'},
      conclusion:control?'Bei normaler Bereinigung bleibt in beiden Modellen kein Besitzer stehen.':'Nach dem modellierten Abbruch sieht der fehlerhafte Worker noch Alice. Die korrigierte Regel setzt den Zustand vor dem nächsten Request zurück.',
      ceiling:'Zustandsmodell ohne PHP-Engine, native Speicherzugriffe, Use-after-free oder RCE.'};
  }
  if (id==='finality') {
    const requestedHeight=control?118:119,head=120,finalized=118;
    return {id,kind:'SYNTHETIC_CONSUMER_VIEW',input:{requestedHeight,head,finalized},
      original:{view:'HEAD',available:requestedHeight<=head},bound:{view:'FINALIZED',available:requestedHeight<=finalized},
      conclusion:control?'Dieser Block liegt bereits in beiden Sichten.':'Der Block ist in der aktuellen Sicht vorhanden und noch nicht in der finalisierten Sicht. Welche Sicht korrekt ist, bestimmt der Consumer-Vertrag.',
      ceiling:'Modell zweier beabsichtigt verschiedener Sichten; kein TRON-Runtime- oder Mainnet-Befund.'};
  }
  throw Error('Unbekannter lokaler Versuch');
}
