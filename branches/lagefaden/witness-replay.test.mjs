// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateReplay} from './witness-replay.mjs';
import {witnessCases} from './witness-cases.mjs';
const sample=id=>structuredClone(witnessCases.find(c=>c.id===id).packet);
const end=p=>evaluateReplay(p,p.events.length+1);

test('six replay end states match the separately declared fixture expectations without mutating inputs',()=>{
  for(const c of witnessCases){
    const before=JSON.stringify(c),r=end(c.packet);
    for(const [key,value] of Object.entries(c.expected))assert.equal(r[key],value,`${c.id}: ${key}`);
    assert.equal(r.routeState,'UNKNOWN');assert.equal(r.action,'HUMAN_REVIEW_ONLY');
    assert.equal(r.hardwareConnected,false);assert.equal(JSON.stringify(c),before);
  }
});
test('forward, reaction, and observation of reaction add no independent route observation',()=>{
  const p=sample('STALE_VIEW');
  assert.equal(evaluateReplay(p,1).ownRouteObservations,1);
  const r=evaluateReplay(p,4);
  assert.equal(r.receivedEvents,4);assert.equal(r.ownRouteObservations,1);
  assert.equal(r.freshDeclaredOrigins,1);assert.equal(r.peerSignals,2);
  assert.deepEqual(r.core.rows.map(x=>[x.id,x.rootId]),[['A1','A1'],['B1','A1']]);
  assert.equal(r.rows.find(x=>x.id==='C1').routeEvidence,'NO_ROUTE_OBSERVATION');
});
test('replay prefix exposes only received messages and ages observations against its own checkpoint',()=>{
  const p=sample('STALE_VIEW');
  assert.equal(evaluateReplay(p,0).receivedEvents,0);
  assert.equal(evaluateReplay(p,0).core,null);
  assert.equal(evaluateReplay(p,1).rows[0].ageMinutes,1);
  assert.equal(end(p).rows[0].ageMinutes,9);
  assert.equal(evaluateReplay(p,4).rows.some(r=>r.id==='C2'),false);
  assert.equal(end(p).rows.at(-1).timeState,'STALE');
  assert.equal(end(p).conflict,false);
  assert.equal(end(sample('CURRENT_CONFLICT')).conflict,true);
});
test('lost and restored sight do not manufacture a new observation',()=>{
  const p=sample('VIEW_RECOVERY');
  assert.equal(evaluateReplay(p,3).viewGaps.find(g=>g.nodeId==='C').reason,'VIEW_LOST');
  const restored=evaluateReplay(p,4);
  assert.equal(restored.ownRouteObservations,1);
  assert.equal(restored.viewGaps.find(g=>g.nodeId==='C').reason,'RESTORED_AWAITING_OBSERVATION');
  assert.equal(end(p).viewGaps.some(g=>g.nodeId==='C'),false);
  assert.equal(end(p).ownRouteObservations,2);
});
test('unbound forwards remain visible and their descendants cannot acquire a synthetic root',()=>{
  const p=sample('MISSING_ORIGIN');
  p.events.splice(1,0,{id:'B_copy',nodeId:'B',kind:'FORWARD',at:'2026-10-27T10:03:00Z',observedAt:null,refId:'B1',claim:null});
  const r=end(p);assert.deepEqual(r.missingProvenance,['B1','B_copy']);
  assert.equal(r.ownRouteObservations,1);assert.equal(r.core.reportCount,1);
  assert.equal(r.reviewState,'PROVENANCE_REVIEW');
});
test('reviewer absence holds the human workflow independently of reports',()=>{
  const p=sample('HIDDEN_DEPENDENCE');p.reviewAvailable=false;
  assert.equal(end(p).core.status,'PROVISIONAL_CONSISTENT');
  assert.equal(end(p).reviewState,'REVIEWER_UNAVAILABLE');
  assert.equal(end(p).routeState,'UNKNOWN');
});
test('consistent declared IDs do not prove sensor independence or reveal the author-only controller',()=>{
  const r=end(sample('HIDDEN_DEPENDENCE'));
  assert.equal(r.freshDeclaredOrigins,3);assert.equal(r.sensorIndependence,'UNKNOWN');
  assert.equal(r.sourceAuthentication,'NOT_PERFORMED');
  assert.equal(r.core.status,'PROVISIONAL_CONSISTENT');
  assert.equal('controller' in r,false);
});
test('invalid and future references, duplicate IDs, unsorted time and route claims on reactions reject',()=>{
  const variants=[p=>p.events[1].refId='future',p=>p.events[1].id='A1',
    p=>p.events[2].at='2026-10-27T10:01:00Z',p=>p.events[2].claim='free',
    p=>p.events[3].refId='A1',p=>p.events[0].extra='ignored',
    p=>p.events[0].observedAt='2026-10-27T10:09:00Z',p=>p.events[0].at='2026-10-27T11:00:00Z'];
  for(const mutate of variants){const p=sample('STALE_VIEW');mutate(p);assert.throws(()=>evaluateReplay(p,0));}
  for(const step of [-1,1.5,100,'1'])assert.throws(()=>evaluateReplay(sample('STALE_VIEW'),step),/INVALID_STEP/);
});
test('forwarding a peer reaction is not accepted as a route report',()=>{
  const p=sample('STALE_VIEW');p.events[3].kind='FORWARD';p.events[3].observedAt=null;
  assert.throws(()=>end(p),/FORWARD_NOT_ROUTE_REPORT/);
});
test('a known observation with unknown time stays time-unknown after forwarding',()=>{
  const p=sample('STALE_VIEW');p.events[0].observedAt=null;
  const r=end(p);assert.equal(r.rows[1].timeState,'TIME_UNKNOWN');
  assert.equal(r.freshDeclaredOrigins,0);assert.equal(r.reviewState,'GAP_REVIEW');
});
test('impossible calendar dates and sparse node declarations reject instead of normalizing',()=>{
  const p=sample('STALE_VIEW');p.events[0].observedAt='2026-02-31T10:00:00Z';
  assert.throws(()=>end(p),/INVALID_OBSERVED_TIME/);
  const q=sample('STALE_VIEW');q.nodes=Array(1);q.events=[];
  assert.throws(()=>end(q),/INVALID_REPLAY/);
});
