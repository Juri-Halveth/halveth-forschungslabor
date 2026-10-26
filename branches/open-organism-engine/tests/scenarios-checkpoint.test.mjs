import test from 'node:test';
import assert from 'node:assert/strict';
import {buildScenario} from '../src/scenarios.mjs';
import {exportScenarioCheckpoint,restoreScenarioCheckpoint} from '../src/checkpoint.mjs';
import {sha256} from '../src/sha256.mjs';
function reseal(envelope){const {checkpointSha256,...state}=envelope.snapshot;envelope.snapshot.checkpointSha256=sha256(JSON.stringify(state));const {envelopeSha256,...body}=envelope;envelope.envelopeSha256=sha256(JSON.stringify(body));return JSON.stringify(envelope);}
for(const name of ['compartments','competition','profiles'])test(name+': checkpoint resumes the actual callbacks and pending state',()=>{
  const a=buildScenario(name,{instanceId:'test:checkpoint',...(name==='profiles'?{profileCount:69}:{})});
  a.world.advance(5050);a.world.advance(1.125);a.world.gap(250);
  const text=exportScenarioCheckpoint(a),b=restoreScenarioCheckpoint(text);
  assert.deepEqual(b.world.snapshot(),a.world.snapshot());
  a.world.advance(2222.875);b.world.advance(2222.875);
  assert.deepEqual(b.world.snapshot(),a.world.snapshot());assert(b.world.audit().passed);
});
test('checkpoint integrity is distinct from source authority and recipe binding',()=>{
  const a=buildScenario('competition'),input=JSON.parse(exportScenarioCheckpoint(a));
  input.snapshot.routes[0].vmax=999;assert.throws(()=>restoreScenarioCheckpoint(reseal(input)),/invalid checkpoint/);
  const changed=JSON.parse(exportScenarioCheckpoint(a));changed.snapshot.events[0].details.version='forged';
  assert.throws(()=>restoreScenarioCheckpoint(reseal(changed)),/bound scenario recipe/);
  assert.throws(()=>restoreScenarioCheckpoint('{"schema":1,"schema":2}'),/duplicate/i);
  assert.throws(()=>buildScenario('profiles',{profileCount:1001}),/1..1000/);
  assert.throws(()=>buildScenario('competition',{profileCount:5}),/belongs/);
  assert.throws(()=>buildScenario('compartments',{tickMs:NaN}),/finite|1..1000/);
});
test('an empty user-declared node survives restore without creating resources',()=>{
  const a=buildScenario('profiles',{profileCount:1});
  a.world.addEntity({id:'custom-1',label:'<img src=x onerror=alert(1)>',kind:'custom',parentId:'origin',sourceRef:'USER_DECLARED_LOCAL_NODE'});
  const b=restoreScenarioCheckpoint(exportScenarioCheckpoint(a));
  assert.equal(b.world.entities.size,3);assert.equal(b.world.audit().resourceTotals.attention,1);
  assert.equal(b.world.observe('custom-1').label,'<img src=x onerror=alert(1)>');
});
test('export rejects a changed recipe before producing a non-restorable download',()=>{
  const a=buildScenario('competition');a.world.defineResource({id:'additional'});
  assert(a.world.audit().passed);assert.throws(()=>exportScenarioCheckpoint(a),/bound model definition/);
});
