// SPDX-License-Identifier: MIT
// Versioned review requirements; no operational action or provider-wide judgement.
import {coverageContract,coverageDefinitions} from './coverage.mjs';

export const decisionContract='halveth.lagefaden.decision-relevance.v1';
const requirement=(facetId,label,acceptedBasis,why)=>Object.freeze({facetId,label,acceptedBasis:Object.freeze(acceptedBasis),why});
export const decisionProfiles=Object.freeze([
  Object.freeze({
    id:'CATALOG_COORDINATES',version:'1.0.0',title:'Koordinaten aus diesem Katalogfall übernehmen?',
    description:'Prüfen, ob gespeicherte Koordinaten mit Katalogzeit und Abrufreceipt vorliegen. Das Profil bereitet eine Datenübernahme vor.',
    required:Object.freeze([
      requirement('coordinates','Konkrete Koordinaten',['DATA'],'Ein Ortsname allein liefert keinen gebundenen Koordinatenwert.'),
      requirement('catalogTime','Katalog-/Geometriezeit',['DATA','DERIVED'],'Der Punkt soll zusammen mit seiner Katalog-/Geometriezeit lesbar bleiben.'),
      requirement('receipts','Abrufreceipts',['RECEIPT'],'Die Übernahme soll auf die gespeicherte Quelle und ihren Abruf zurückführen.')
    ])
  }),
  Object.freeze({
    id:'CATALOG_REVISIONS',version:'1.0.0',title:'Zeitstände innerhalb eines Katalogfalls vergleichen?',
    description:'Prüfen, ob Katalogkennung, Änderungszeit und Abrufzeit für einen Vergleich gebunden sind. Interpretierte Zeiten bleiben gesondert prüfbar.',
    required:Object.freeze([
      requirement('catalogIdentity','Gemeinsame Katalogkennung',['DATA'],'Der Zeitvergleich bleibt innerhalb desselben Katalogfalls.'),
      requirement('catalogUpdate','Katalog-Änderungszeit',['DATA','DERIVED'],'Eine Abrufzeit ersetzt die Änderungszeit des Katalogeintrags nicht.'),
      requirement('captureTime','Abrufzeit',['RECEIPT'],'Der Zeitpunkt des gespeicherten Abrufs bleibt vom Katalog-Update getrennt.')
    ])
  }),
  Object.freeze({
    id:'PHYSICAL_INDEPENDENCE',version:'1.0.0',title:'Unabhängige physische Beobachtungen zählen?',
    description:'Prüfen, welche Herkunftsbelege für eine solche Zählung vorliegen. Darstellungszahl und Quellverweise behalten ihre eigene Bedeutung.',
    required:Object.freeze([
      requirement('sensorIdentity','Identität der physischen Sensoren',['DATA'],'Die erfassenden Sensoren müssen im gebundenen Datenweg unterscheidbar sein.'),
      requirement('measurementChain','Authentisierte physische Messkette',['DATA','RECEIPT'],'Die Herkunftskette soll auf die konkreten Erfassungen zurückführen.'),
      requirement('independentCount','Zahl unabhängiger physischer Messungen',['DATA','DERIVED'],'Die Zählung benötigt einen gebundenen Unabhängigkeitsmaßstab; URLs und Kopien reichen als Zählbasis nicht.')
    ])
  })
]);
const states=new Set(['DATA','RECEIPT','DERIVED','DESIGN','UNKNOWN']);
const fail=code=>{throw Error(code);};
function getProfile(id) {return decisionProfiles.find(profile=>profile.id===id)??fail('UNKNOWN_DECISION_PROFILE');}

function sourceFacts(matrix,source,index) {
  const facts=new Map();
  for(const [rowIndex,definition] of coverageDefinitions.entries()) {
    const row=matrix.rows[rowIndex];
    if(row?.id!==definition.id||!Array.isArray(row.cells)||row.cells.length!==matrix.sources.length) fail('INVALID_DECISION_MATRIX');
    const cell=row.cells[index];
    if(cell?.sourceId!==source.id||cell.caseId!==source.caseId) fail('DECISION_SOURCE_CASE_MISMATCH');
    if(source.availability!=='PRESENT') {
      if(cell.state!==source.availability||cell.facets.length!==0)fail('INVALID_UNAVAILABLE_COLUMN');
      continue;
    }
    if(!Array.isArray(cell.facets)||cell.facets.length!==definition.facets.length)fail('INVALID_DECISION_FACETS');
    for(const [partIndex,facetId] of definition.facets.entries()) {
      const facet=cell.facets[partIndex];
      if(facet?.id!==facetId||!states.has(facet.state)||!Array.isArray(facet.evidence))fail('INVALID_DECISION_FACETS');
      if(facts.has(facetId)&&JSON.stringify(facts.get(facetId))!==JSON.stringify(facet))fail('CONFLICTING_FACET_BINDING');
      facts.set(facetId,facet);
    }
  }
  return facts;
}

export function evaluateDecisionRelevance(matrix,profileId) {
  const profile=getProfile(profileId);
  if(matrix?.contract!==coverageContract||matrix.comparison!=='ANSWER_SCOPE_COMPARISON'||matrix.crossCatalogEventIdentity!=='NOT_EVALUATED'
    ||!Array.isArray(matrix.sources)||matrix.sources.length!==3||JSON.stringify(matrix.sources.map(s=>s.id).sort())!==JSON.stringify(['CEMS','EONET','USGS'])
    ||!Array.isArray(matrix.rows)||matrix.rows.length!==coverageDefinitions.length)fail('INVALID_DECISION_MATRIX');
  const sourceReviews=matrix.sources.map((source,index)=>{
    if(!['PRESENT','PENDING','UNAVAILABLE'].includes(source.availability))fail('INVALID_DECISION_AVAILABILITY');
    if(source.availability==='PRESENT'&&(typeof source.caseId!=='string'||!source.caseId||!/^[a-f0-9]{64}$/.test(source.snapshotReceipt?.sha256)))fail('UNBOUND_DECISION_SOURCE');
    const facts=sourceFacts(matrix,source,index);
    const base={sourceId:source.id,sourceLabel:source.label,caseId:source.caseId,snapshotReceipt:source.snapshotReceipt};
    if(source.availability!=='PRESENT')return {...base,state:source.availability,requirements:[],openRequirementIds:[],otherUnknown:[],counterfactuals:[],scopeState:'SOURCE_NOT_ASSESSED'};
    const requirements=profile.required.map(rule=>{
      const fact=facts.get(rule.facetId)??fail('MISSING_PROFILE_FACET');
      const state=fact.state==='UNKNOWN'?'REQUIRED_UNKNOWN':!rule.acceptedBasis.includes(fact.state)?'BASIS_NOT_ACCEPTED'
        :fact.state==='DERIVED'?'REQUIRES_DERIVATION_REVIEW':'BOUND_INPUT';
      if(state!=='REQUIRED_UNKNOWN'&&state!=='BASIS_NOT_ACCEPTED'&&!fact.evidence.length)fail('UNBOUND_REQUIRED_INPUT');
      return {...rule,state,fact};
    });
    const open=requirements.filter(r=>['REQUIRED_UNKNOWN','BASIS_NOT_ACCEPTED'].includes(r.state));
    const derived=requirements.filter(r=>r.state==='REQUIRES_DERIVATION_REVIEW');
    return {
      ...base,state:open.length?'REVIEW_OPEN_REQUIREMENTS':derived.length?'REVIEW_DERIVED_INPUTS':'INPUT_REQUIREMENTS_BOUND',
      scopeState:'DECLARED_REVIEW_PROFILE_ONLY',requirements,openRequirementIds:open.map(r=>r.facetId),
      otherUnknown:[...facts.values()].filter(f=>f.state==='UNKNOWN'&&!profile.required.some(r=>r.facetId===f.id)),
      counterfactuals:open.map(r=>({facetId:r.facetId,mode:'CONDITIONAL_REQUIREMENT_CHANGE_ONLY',
        condition:'Eine für dieses Profil akzeptierte, beleggebundene Teilantwort würde ergänzt; vorhandene Daten bleiben im Modell gleich.',
        remainingOpenRequirementIds:open.filter(other=>other.facetId!==r.facetId).map(other=>other.facetId),
        existingDerivedReviewWouldRemain:derived.length>0,
        wouldCloseOnlyOpenRequirement:open.length===1,
        sourceMutationPerformed:false}))
    };
  });
  return {
    contract:decisionContract,profile:{...profile,origin:'LOCAL_DESIGN_PROFILE'},coverageContract:matrix.contract,
    effect:'LOCAL_REVIEW_DISPLAY_AND_EXPORT',operationalActionAuthorized:false,
    impactEvidence:'DECLARED_REQUIREMENT_SENSITIVITY; HUMAN_DECISION_IMPROVEMENT_NOT_MEASURED',
    crossCatalogEventIdentity:'NOT_EVALUATED',sourceReviews,
    rowRelevance:coverageDefinitions.map(row=>({rowId:row.id,requiredFacetIds:row.facets.filter(id=>profile.required.some(r=>r.facetId===id))}))
  };
}

export function makeDecisionExport(matrix,profileId) {
  return {contract:'halveth.lagefaden.review-export.v1',coverage:matrix,decisionReview:evaluateDecisionRelevance(matrix,profileId)};
}
