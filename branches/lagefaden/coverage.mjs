// SPDX-License-Identifier: MIT
// Compare answer scopes of separate stored cases; never merge their events.
import {evaluateUsgsPair} from './usgs-source.mjs';
import {evaluateEonetPair,evaluateCemsPair} from './public-sources.mjs';
import {realWRows,eonetWRows,cemsWRows,wQuestions} from './w-space.mjs';

export const coverageContract = 'halveth.lagefaden.w-coverage.v1';
const sources = Object.freeze({
  USGS:{label:'USGS',file:'usgs',contract:'halveth.lagefaden.usgs-snapshot.v1'},
  EONET:{label:'NASA EONET',file:'eonet',contract:'halveth.lagefaden.eonet-snapshot.v1'},
  CEMS:{label:'Copernicus EMS',file:'cems',contract:'halveth.lagefaden.cems-snapshot.v1'}
});
const definitions = [
  ['WER?','Publisher und Identität der erfassenden Sensoren',['publisher','sensorIdentity']],
  ['WEN?','Konkret betroffene Menschen oder Einrichtungen',['affected']],
  ['WEM?','Adressat des Datensatzes und Ziel der lokalen Prüfung',['addressee','destination']],
  ['WESSEN?','Quellenangabe und weitergehende Verfügungs-/Zuständigkeitsrechte',['attribution','rights']],
  ['WAS?','Bezeichnung im ausgewählten Katalogfall',['title']],
  ['WANN?','Katalog-/Geometriezeit, Änderungszeit und Abrufzeit',['catalogTime','catalogUpdate','captureTime']],
  ['WIE LANGE?','Berechenbarer Abstand und tatsächliche Ereignisdauer',['interval','duration']],
  ['WIE OFT?','Gezählte Darstellungen und unabhängige physische Messungen',['representations','independentCount']],
  ['WO?','Textlicher Ortsbezug und konkrete Koordinaten im Snapshot',['locationText','coordinates']],
  ['WOHER?','Abrufadressen, externe Quellverweise und authentisierte Messkette',['endpoints','references','measurementChain']],
  ['WOHIN?','Ziel der lokalen Weiterverarbeitung',['destination']],
  ['WIE?','Gespeicherter Datenweg und physischer Erfassungsweg',['format','measurementChain']],
  ['WARUM?','Ursache des konkreten Ereignisses',['cause']],
  ['WESHALB?','Begründung der lokalen Katalogeinordnung',['classification']],
  ['WOFÜR?','Zweck dieser Anwendung',['purpose']],
  ['WOMIT?','Abrufreceipts mit URL, Zeit, Bytezahl und Rohantwort-Hash',['receipts']],
  ['WODURCH?','Gemeinsame Katalogkennung und Messunabhängigkeit',['catalogIdentity','independentCount']],
  ['WELCHE VERSION?','Snapshot-Vertrag, Abrufstand und Katalog-Änderungszeit',['contract','captureTime','catalogUpdate']],
  ['WIE SICHER?','Lokale Prüfung und unabhängige Bestätigung der Außenlage',['classification','outsideValidation']],
  ['WAS WENN?','Im Programm beschriebene Gegenprobe',['counterfactual']],
  ['WIE WEITER?','Nächster vorgeschlagener Prüfschritt',['nextCheck']],
  ['WAS FEHLT?','Abgeleitetes Lückeninventar einschließlich Revisionsgeschichte',['gapInventory','revisionHistory']]
];
export const coverageDefinitions = Object.freeze(definitions.map(([question,scope,facets],index)=>Object.freeze({
  id:'W'+String(index+1).padStart(2,'0'),question,scope,facets:Object.freeze(facets)
})));
if (JSON.stringify(coverageDefinitions.map(row=>row.question)) !== JSON.stringify(wQuestions)) throw Error('W_SCHEMA_MISMATCH');
const facetNames = {
  publisher:'Katalog-Publisher',sensorIdentity:'Identität der physischen Sensoren',affected:'Konkret Betroffene',
  addressee:'Bestimmter Adressat',destination:'Ziel der lokalen Prüfung',attribution:'Quellenangabe',rights:'Verfügungsrechte und Zuständigkeit',
  title:'Katalogbezeichnung',catalogTime:'Katalog-/Geometriezeit',catalogUpdate:'Katalog-Änderungszeit',captureTime:'Abrufzeit',
  interval:'Berechneter Zeitabstand',duration:'Tatsächliche Ereignisdauer',representations:'Zahl der Darstellungen',independentCount:'Zahl unabhängiger physischer Messungen',
  locationText:'Textlicher Ortsbezug',coordinates:'Konkrete Koordinaten',endpoints:'Abrufadressen',references:'Externe Quellverweise',measurementChain:'Authentisierte physische Messkette',
  format:'Gespeicherter Datenweg',cause:'Ereignisursache',classification:'Lokale Katalogeinordnung',purpose:'Anwendungszweck',receipts:'Abrufreceipts',
  catalogIdentity:'Gemeinsame Katalogkennung',contract:'Snapshot-Vertrag',outsideValidation:'Unabhängig bestätigte Außenlage',
  counterfactual:'Beschriebene Gegenprobe',nextCheck:'Nächster Prüfschritt',gapInventory:'Lückeninventar',revisionHistory:'Vollständige Revisionsgeschichte'
};
const basisStates = new Set(['DATA','RECEIPT','DERIVED','DESIGN','UNKNOWN']);
const directStates = new Set(['DATA','RECEIPT']);
const fail = code => {throw Error(code);};
function sourceMeta(id) {return typeof id==='string'&&Object.hasOwn(sources,id) ? sources[id] : fail('UNKNOWN_SOURCE');}
function pointerValue(object,pointer) {
  let value=object;
  for(const key of pointer.slice(1).split('/')) {
    const decoded=key.replaceAll('~1','/').replaceAll('~0','~');
    if(value===null || typeof value!=='object' || !Object.hasOwn(value,decoded)) return undefined;
    value=value[decoded];
  }
  return value;
}
function sourceFact(snapshot,state,value,pointers) {
  if(!basisStates.has(state) || state==='UNKNOWN' || !pointers.length) fail('INVALID_FACT');
  const evidence=pointers.map(pointer=>({kind:'SNAPSHOT_FIELD',pointer,value:pointerValue(snapshot,pointer)}));
  if(evidence.some(ref=>ref.value===undefined||ref.value===null||ref.value===''||(Array.isArray(ref.value)&&ref.value.length===0))) return {state:'UNKNOWN',value:'Dieses Feld ist im gespeicherten Snapshot nicht mit einem Wert enthalten.',evidence:[]};
  return {state,value,evidence};
}
function designFact(value,locator) {return {state:'DESIGN',value,evidence:[{kind:'LOCAL_DESIGN',path:'w-space.mjs',locator}]};}
const unknown = value => ({state:'UNKNOWN',value,evidence:[]});

export function classifyCoverage(facets) {
  if(!Array.isArray(facets) || !facets.length || facets.some(f=>!f || !basisStates.has(f.state))) fail('INVALID_COVERAGE_FACETS');
  const known=facets.filter(f=>f.state!=='UNKNOWN');
  if(!known.length) return 'UNKNOWN';
  return known.length===facets.length && known.every(f=>directStates.has(f.state)) ? 'DOCUMENTED' : 'PARTIAL';
}

function evaluateSnapshot(id,s) {
  const meta=sourceMeta(id);
  if(s?.contract!==meta.contract) fail('INVALID_SNAPSHOT_CONTRACT');
  let result,answers,receipts;
  if(id==='USGS') {
    if(s.feed?.url!=='https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
      || s.detail?.url!==s.records?.summary?.properties?.detail) fail('INVALID_SOURCE_RECEIPT');
    result=evaluateUsgsPair(s.records.summary,s.records.detail); answers=realWRows(s,result); receipts=['feed','detail'];
  } else if(id==='EONET') {
    const eventId=s.records?.summary?.id;
    if(s.list?.url!=='https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20'
      || s.detail?.url!=='https://eonet.gsfc.nasa.gov/api/v3/events/'+eventId) fail('INVALID_SOURCE_RECEIPT');
    result=evaluateEonetPair(s.records.summary,s.records.detail); answers=eonetWRows(s,result); receipts=['list','detail'];
  } else {
    const code=s.records?.mapping?.code;
    if(s.mappingList?.url!=='https://mapping.emergency.copernicus.eu/activations/api/activations/?limit=10'
      || s.rapidList?.url!=='https://rapidmapping.emergency.copernicus.eu/backend/dashboard-api/public-activations-info/?limit=10'
      || s.detail?.url!=='https://rapidmapping.emergency.copernicus.eu/backend/dashboard-api/public-activations/?code='+code) fail('INVALID_SOURCE_RECEIPT');
    result=evaluateCemsPair(s.records.mapping,s.records.rapid,s.records.detail); answers=cemsWRows(s,result); receipts=['mappingList','rapidList','detail'];
  }
  if(JSON.stringify(result)!==JSON.stringify(s.evaluation)) fail('EVALUATION_MISMATCH');
  for(const key of receipts) {
    const r=s[key];
    if(!Number.isSafeInteger(r.bytes)||r.bytes<1||!/^\d{4}-\d\d-\d\dT.*Z$/.test(r.retrievedAt)||!Number.isFinite(Date.parse(r.retrievedAt))
      || !/^[a-f0-9]{64}$/.test(r.sha256)) fail('INVALID_SOURCE_RECEIPT');
  }
  return {result,answers,receipts};
}

export async function buildSourceCoverage(id,bytes) {
  const meta=sourceMeta(id);
  if(!(bytes instanceof Uint8Array)||bytes.length<1||bytes.length>1000000) fail('INVALID_SNAPSHOT_BYTES');
  const snapshot=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  const {result,answers,receipts}=evaluateSnapshot(id,snapshot);
  const hex=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  const f=Object.fromEntries(Object.keys(facetNames).map(key=>[key,unknown('In diesem gespeicherten Fall nicht gebunden.')]));
  const fact=(key,state,value,pointers)=>{f[key]=sourceFact(snapshot,state,value,pointers);};
  const receiptPointers=receipts.flatMap(key=>['url','retrievedAt','bytes','sha256'].map(field=>'/'+key+'/'+field));
  const timePointers=receipts.map(key=>'/'+key+'/retrievedAt');
  fact('publisher','RECEIPT',meta.label+' als Publisher der gebundenen Abrufadressen.',receipts.map(key=>'/'+key+'/url'));
  fact('title','DATA',result.title,[id==='CEMS'?'/records/rapid/name':'/records/detail/'+(id==='USGS'?'properties/title':'title')]);
  fact('captureTime','RECEIPT',receipts.map(key=>snapshot[key].retrievedAt).join(' · '),timePointers);
  fact('endpoints','RECEIPT',receipts.map(key=>snapshot[key].url).join(' · '),receipts.map(key=>'/'+key+'/url'));
  fact('receipts','RECEIPT',receipts.length+' Abrufreceipts mit URL, Zeit, Bytezahl und Rohantwort-SHA-256.',receiptPointers);
  fact('contract','DATA',snapshot.contract,['/contract']);
  fact('format','RECEIPT','Minimierter JSON-Snapshot aus den gebundenen API-Abrufen.',['/contract',...receipts.map(key=>'/'+key+'/url')]);
  const identityPointers=id==='CEMS'?['/records/mapping/code','/records/rapid/code','/records/detail/code']:['/records/summary/id','/records/detail/id'];
  fact('catalogIdentity','DATA',result.eventId??result.activationCode,identityPointers);
  fact('classification','DERIVED',answers.find(row=>row.question==='WESHALB?').value,[...identityPointers,'/evaluation/state']);
  fact('representations','DERIVED',answers.find(row=>row.question==='WIE OFT?').value,identityPointers);
  f.destination=designFact('Lokale Ansicht zur menschlichen Prüfung.','WOHIN?');
  f.attribution=designFact('Quellenzuordnung und Zitierhinweise im LAGEFADEN-Lesetext.','WESSEN?; README.md');
  f.purpose=designFact(answers.find(row=>row.question==='WOFÜR?').value,'WOFÜR?');
  f.counterfactual=designFact(answers.find(row=>row.question==='WAS WENN?').value,'WAS WENN?');
  f.nextCheck=designFact(answers.find(row=>row.question==='WIE WEITER?').value,'WIE WEITER?');
  if(id==='USGS') {
    fact('catalogTime','DATA',result.eventTimeSummary,['/records/summary/properties/time','/records/detail/properties/time']);
    fact('catalogUpdate','DATA',result.updateTimeDetail,['/records/detail/properties/updated']);
    fact('locationText','DATA','Ortsbezug nur im Ereignistitel: '+result.title,['/records/detail/properties/title']);
    fact('coordinates','DATA','Koordinaten im gespeicherten Katalogeintrag.',['/records/summary/geometry/coordinates']);
    fact('interval','DERIVED',answers.find(row=>row.question==='WIE LANGE?').value,['/records/summary/properties/time','/feed/retrievedAt']);
  } else if(id==='EONET') {
    fact('catalogTime','DATA','Geometriezeiten: '+result.firstGeometryTime+' bis '+result.lastGeometryTime,['/records/detail/geometry']);
    fact('coordinates','DATA',JSON.stringify(result.lastLocation),['/records/detail/geometry']);
    fact('references','DATA',result.sourceReferenceIds.join(', '),['/records/detail/sources']);
    fact('interval','DERIVED',answers.find(row=>row.question==='WIE LANGE?').value,['/records/detail/geometry']);
    // Coordinates provide a location; a country/place name is not fabricated from them.
  } else {
    fact('catalogTime','DERIVED',result.eventTime+' / '+result.activationTime+'; unmarkierte API-Zeit als UTC nach Anbieterbeschreibung.',['/records/rapid/eventTime','/records/rapid/activationTime','/evaluation/sourceTimeInterpretation']);
    fact('catalogUpdate','DERIVED',result.mappingUpdateTime+' / '+result.rapidUpdateTime+'; UTC-Interpretation nach Anbieterbeschreibung.',['/records/mapping/lastUpdate','/records/rapid/lastUpdate','/evaluation/sourceTimeInterpretation']);
    fact('locationText','DATA',snapshot.records.mapping.countries?.join(', ')+' · '+result.title,['/records/mapping/countries','/records/rapid/name']);
    fact('interval','DERIVED',answers.find(row=>row.question==='WIE LANGE?').value,['/records/rapid/eventTime','/records/rapid/activationTime','/evaluation/sourceTimeInterpretation']);
  }
  const missing=Object.keys(f).filter(key=>key!=='gapInventory'&&f[key].state==='UNKNOWN');
  f.gapInventory={state:'DERIVED',value:missing.map(key=>facetNames[key]).join(' · '),evidence:[{kind:'LOCAL_DERIVATION',path:'coverage.mjs',locator:'missing facets under '+coverageContract}]};
  const facts=Object.fromEntries(Object.entries(f).map(([key,value])=>[key,{id:key,label:facetNames[key],...value}]));
  const rows=coverageDefinitions.map((definition,index)=>{
    if(answers[index]?.question!==definition.question) fail('W_ANSWER_ORDER_MISMATCH');
    const facets=definition.facets.map(key=>facts[key]);
    const state=classifyCoverage(facets);
    const answerState=state==='DOCUMENTED'?'BELEGT':state==='UNKNOWN'?'UNKNOWN'
      :facets.every(f=>f.state==='DESIGN')?'ENTWURF':facets.every(f=>f.state==='DERIVED')?'ABGELEITET':'TEILANTWORT';
    return {...definition,answer:{...answers[index],state:answerState},facets,state};
  });
  return {
    id,label:meta.label,availability:'PRESENT',caseId:result.eventId??result.activationCode,title:result.title,
    snapshotReceipt:{path:'data/'+meta.file+'-example.json',bytes:bytes.length,sha256:hex,contract:snapshot.contract,
      retrievedAt:receipts.map(key=>snapshot[key].retrievedAt)},
    rows,facts,snapshot,evaluation:result,answers:rows.map(row=>row.answer)
  };
}

export function unavailableSource(id,availability='UNAVAILABLE') {
  const meta=sourceMeta(id);
  if(!['PENDING','UNAVAILABLE'].includes(availability)) fail('INVALID_AVAILABILITY');
  return {id,label:meta.label,availability,caseId:null,title:null,snapshotReceipt:null,rows:[],facts:{}};
}

export function buildCoverageMatrix(columns) {
  if(!Array.isArray(columns)||columns.length!==Object.keys(sources).length) fail('INCOMPLETE_SOURCE_REGISTRY');
  if(new Set(columns.map(c=>c.id)).size!==columns.length) fail('DUPLICATE_SOURCE');
  for(const column of columns) {
    sourceMeta(column.id);
    if(!['PRESENT','PENDING','UNAVAILABLE'].includes(column.availability)) fail('INVALID_AVAILABILITY');
    if(column.availability==='PRESENT' && (column.rows.length!==coverageDefinitions.length
      || column.rows.some((row,i)=>row.id!==coverageDefinitions[i].id || row.state!==classifyCoverage(row.facets)))) fail('INVALID_COLUMN');
  }
  const ordered=Object.keys(sources).map(id=>columns.find(column=>column.id===id)??fail('MISSING_SOURCE'));
  const present=ordered.filter(column=>column.availability==='PRESENT');
  const allPresent=present.length===ordered.length;
  const sharedUnknown=allPresent?Object.keys(facetNames).filter(key=>present.every(c=>c.facts[key]?.state==='UNKNOWN')):[];
  const anyUnknown=Object.keys(facetNames).filter(key=>present.some(c=>c.facts[key]?.state==='UNKNOWN'));
  const contrast=Object.keys(facetNames).filter(key=>present.some(c=>c.facts[key]?.state==='UNKNOWN')&&present.some(c=>c.facts[key]?.state!=='UNKNOWN'));
  const inventory=present.flatMap(c=>Object.values(c.facts).filter(f=>f.state!=='UNKNOWN').map(f=>({sourceId:c.id,caseId:c.caseId,snapshotReceipt:c.snapshotReceipt,...f})));
  return {
    contract:coverageContract,comparison:'ANSWER_SCOPE_COMPARISON',crossCatalogEventIdentity:'NOT_EVALUATED',
    scope:'Three stored example cases; not a provider-wide capability assessment.',
    commonGapStatus:allPresent?'ASSESSED_FOR_THREE_STORED_CASES':'INCOMPLETE_SOURCE_COVERAGE',
    sources:ordered.map(({id,label,availability,caseId,title,snapshotReceipt})=>({id,label,availability,caseId,title,snapshotReceipt})),
    rows:coverageDefinitions.map((def,index)=>({...def,cells:ordered.map(c=>c.availability==='PRESENT'
      ?{sourceId:c.id,caseId:c.caseId,...c.rows[index]}:{sourceId:c.id,caseId:null,state:c.availability,facets:[],answer:null})})),
    sharedUnknown:sharedUnknown.map(id=>({id,label:facetNames[id]})),
    anyUnknown:anyUnknown.map(id=>({id,label:facetNames[id],sources:present.filter(c=>c.facts[id]?.state==='UNKNOWN').map(c=>c.id)})),
    contrast:contrast.map(id=>({id,label:facetNames[id],sources:present.map(c=>({sourceId:c.id,caseId:c.caseId,...c.facts[id]}))})),
    answerInventory:inventory
  };
}
