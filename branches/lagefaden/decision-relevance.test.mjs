// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {buildCoverageMatrix,buildSourceCoverage,unavailableSource} from './coverage.mjs';
import {decisionProfiles,evaluateDecisionRelevance,makeDecisionExport} from './decision-relevance.mjs';
const ids=['USGS','EONET','CEMS'];
const columns=await Promise.all(ids.map(async id=>buildSourceCoverage(id,new Uint8Array(await fs.readFile(new URL('data/'+id.toLowerCase()+'-example.json',import.meta.url))))));
const matrix=buildCoverageMatrix(columns);
const review=(profile,id)=>evaluateDecisionRelevance(matrix,profile).sourceReviews.find(source=>source.sourceId===id);

test('coordinate requirements use their own source case; a known point elsewhere cannot close a gap',()=>{
  assert.equal(review('CATALOG_COORDINATES','EONET').state,'INPUT_REQUIREMENTS_BOUND');
  for(const id of ['USGS','CEMS']) {
    const result=review('CATALOG_COORDINATES',id);
    assert.equal(result.state,'REVIEW_OPEN_REQUIREMENTS');
    assert.deepEqual(result.openRequirementIds,['coordinates']);
    assert.equal(result.caseId,matrix.sources.find(source=>source.id===id).caseId);
  }
  assert.ok(review('CATALOG_COORDINATES','EONET').otherUnknown.some(f=>f.id==='locationText'));
  assert.ok(review('CATALOG_COORDINATES','EONET').otherUnknown.some(f=>f.id==='cause'));
});

test('a changed review profile changes required inputs without changing the underlying coverage',()=>{
  const before=JSON.stringify(matrix);
  assert.equal(review('CATALOG_REVISIONS','USGS').state,'INPUT_REQUIREMENTS_BOUND');
  assert.deepEqual(review('CATALOG_REVISIONS','EONET').openRequirementIds,['catalogUpdate']);
  const cems=review('CATALOG_REVISIONS','CEMS');
  assert.equal(cems.state,'REVIEW_DERIVED_INPUTS');
  assert.equal(cems.requirements.find(r=>r.facetId==='catalogUpdate').fact.state,'DERIVED');
  assert.ok(cems.requirements.find(r=>r.facetId==='catalogUpdate').fact.value.includes('2026-10-21'));
  assert.ok(cems.requirements.find(r=>r.facetId==='catalogUpdate').fact.value.includes('2026-10-26'));
  assert.equal(JSON.stringify(matrix),before);
});

test('physical independence stays open despite multiple representations and EONET references',()=>{
  for(const id of ids) {
    const result=review('PHYSICAL_INDEPENDENCE',id);
    assert.equal(result.state,'REVIEW_OPEN_REQUIREMENTS');
    assert.deepEqual(result.openRequirementIds,['sensorIdentity','measurementChain','independentCount']);
    for(const scenario of result.counterfactuals) {
      assert.equal(scenario.remainingOpenRequirementIds.length,2);
      assert.equal(scenario.wouldCloseOnlyOpenRequirement,false);
      assert.equal(scenario.sourceMutationPerformed,false);
    }
  }
});

test('conditional gap sensitivity distinguishes the last missing input and existing derivation review',()=>{
  const usgs=review('CATALOG_COORDINATES','USGS').counterfactuals[0];
  assert.equal(usgs.mode,'CONDITIONAL_REQUIREMENT_CHANGE_ONLY');
  assert.equal(usgs.wouldCloseOnlyOpenRequirement,true);
  assert.deepEqual(usgs.remainingOpenRequirementIds,[]);
  const cems=review('CATALOG_COORDINATES','CEMS').counterfactuals[0];
  assert.equal(cems.wouldCloseOnlyOpenRequirement,true);
  assert.equal(cems.existingDerivedReviewWouldRemain,true);
});

test('an unavailable source is not assessed and receives no invented requirement counterfactual',()=>{
  const partial=buildCoverageMatrix([columns[0],unavailableSource('EONET'),columns[2]]);
  const result=evaluateDecisionRelevance(partial,'CATALOG_COORDINATES').sourceReviews[1];
  assert.equal(result.state,'UNAVAILABLE');assert.equal(result.scopeState,'SOURCE_NOT_ASSESSED');
  assert.deepEqual(result.requirements,[]);assert.deepEqual(result.counterfactuals,[]);
});

test('a synthetic design-basis substitution cannot satisfy a data-only coordinate requirement',()=>{
  const synthetic=structuredClone(matrix);
  const coordinate=synthetic.rows.find(r=>r.question==='WO?').cells[1].facets.find(f=>f.id==='coordinates');
  coordinate.state='DESIGN';
  const result=evaluateDecisionRelevance(synthetic,'CATALOG_COORDINATES').sourceReviews[1];
  assert.equal(result.state,'REVIEW_OPEN_REQUIREMENTS');
  assert.equal(result.requirements.find(r=>r.facetId==='coordinates').state,'BASIS_NOT_ACCEPTED');
});

test('invalid profiles, missing dimensions, cross-case cells and inconsistent repeated facets are rejected',()=>{
  assert.throws(()=>evaluateDecisionRelevance(matrix,'OTHER'),/UNKNOWN_DECISION_PROFILE/);
  assert.throws(()=>evaluateDecisionRelevance(matrix,'toString'),/UNKNOWN_DECISION_PROFILE/);
  const short=structuredClone(matrix);short.rows.pop();
  assert.throws(()=>evaluateDecisionRelevance(short,'CATALOG_COORDINATES'),/INVALID_DECISION_MATRIX/);
  const wrong=structuredClone(matrix);wrong.rows[0].cells[0].caseId='another-case';
  assert.throws(()=>evaluateDecisionRelevance(wrong,'CATALOG_COORDINATES'),/DECISION_SOURCE_CASE_MISMATCH/);
  const conflict=JSON.parse(JSON.stringify(matrix));conflict.rows.find(r=>r.question==='WELCHE VERSION?').cells[0].facets.find(f=>f.id==='captureTime').value='different';
  assert.throws(()=>evaluateDecisionRelevance(conflict,'CATALOG_REVISIONS'),/CONFLICTING_FACET_BINDING/);
});

test('review exports retain the coverage object, declared profile and all source receipts without authorizing action',()=>{
  const before=JSON.stringify(matrix);
  const exported=makeDecisionExport(matrix,'PHYSICAL_INDEPENDENCE');
  assert.equal(exported.coverage,matrix);
  assert.equal(exported.decisionReview.profile.origin,'LOCAL_DESIGN_PROFILE');
  assert.equal(exported.decisionReview.operationalActionAuthorized,false);
  for(const source of exported.decisionReview.sourceReviews)assert.deepEqual(source.snapshotReceipt,matrix.sources.find(s=>s.id===source.sourceId).snapshotReceipt);
  assert.equal(JSON.stringify(matrix),before);
  assert.equal(Object.isFrozen(decisionProfiles),true);
  assert.ok(decisionProfiles.every(p=>Object.isFrozen(p)&&Object.isFrozen(p.required)&&p.required.every(r=>Object.isFrozen(r.acceptedBasis))));
});
