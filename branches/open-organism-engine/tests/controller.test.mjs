import test from 'node:test';
import assert from 'node:assert/strict';
import {ModelController} from '../src/controller.mjs';
const model=()=>new ModelController({scenario:'competition',instanceFactory:()=> 'test:controller'});
const command=(c,id,type,payload={})=>c.dispatch({id,type,payload});
test('controller balance binds the whole requested batch to the actual transfers',()=>{
  const c=model(),result=command(c,1,'STEP',{ticks:20});assert.equal(result.type,'RESULT');
  const {balance}=result.projection;assert.equal(balance.fromTick,0);assert.equal(balance.toTick,20);assert(balance.transfers.length>20);
  for(const [id,before]of Object.entries(balance.before)){
    const incoming=balance.transfers.filter(t=>t.to===id).reduce((s,t)=>s+t.amount,0),outgoing=balance.transfers.filter(t=>t.from===id).reduce((s,t)=>s+t.amount,0);
    assert(Math.abs(balance.after[id].reserve-(before.reserve+incoming-outgoing))<1e-9);
  }
  assert.equal(result.projection.events.totalCount,c.world.events.length);
  assert.equal(result.projection.events.omittedBefore,c.world.events.length-result.projection.events.items.length);
});
test('invalid commands, resets and corrupt restores preserve the accepted world',()=>{
  const c=model();command(c,1,'STEP',{ticks:2});const before=c.world.snapshot(),generation=c.generation;
  for(const [type,payload]of [['RESET',{scenario:'unknown'}],['RESET',{parameters:{profileCount:100000}}],['STEP',{ticks:-1}],['RESTORE',{text:'{}'}],['START',{surprise:true}],['ADD_ENTITY',{id:'bad',label:'x',kind:'brain'}]]){
    assert.equal(command(c,2,type,payload).type,'ERROR');assert.deepEqual(c.world.snapshot(),before);assert.equal(c.generation,generation);
  }
  assert.equal(c.dispatch({id:0,type:'STEP',payload:{ticks:1}}).type,'ERROR');
});
test('audits bind a head, become stale after a mutation and refresh explicitly',()=>{
  const c=model();let p=command(c,1,'AUDIT').projection;assert(p.audit.passed);assert.equal(p.auditStale,false);
  p=command(c,2,'STEP',{ticks:1}).projection;assert.equal(p.auditStale,true);assert.notEqual(p.audit.head,p.world.head);
  p=command(c,3,'AUDIT').projection;assert(p.audit.passed);assert.equal(p.auditStale,false);
  const saved=command(c,4,'EXPORT');assert(saved.text.includes('halveth.organism-checkpoint.v1'));
  const restored=command(c,5,'RESTORE',{text:saved.text});assert.equal(restored.type,'RESULT');assert(restored.projection.generation>saved.projection.generation);
  assert(restored.projection.revision>saved.projection.revision);assert.equal(restored.projection.world.head,saved.projection.world.head);
});
test('the scheduler bounds catch-up and records uncovered delay separately',()=>{
  const c=model();command(c,1,'START');assert(c.advanceRuntime(1000));
  assert.equal(c.world.tick,5);assert.equal(c.world.timeMs,250);assert.equal(c.world.undocumentedGapMs,750);
  assert.equal(c.projection().runtime.observedWallMs,1000);assert(c.world.audit().passed);
  assert.equal(command(c,2,'STEP',{ticks:1}).type,'ERROR');
  command(c,3,'PAUSE');const before=c.world.snapshot();assert.equal(c.advanceRuntime(500),false);assert.deepEqual(c.world.snapshot(),before);
});
test('journal exhaustion is visible and a failed step preserves the prior world',()=>{
  const c=new ModelController({scenario:'competition',parameters:{maxEvents:100},instanceFactory:()=> 'test:budget'});
  const before=c.world.snapshot();const result=command(c,1,'STEP',{ticks:20});
  assert.equal(result.type,'ERROR');assert.match(result.message,/log full/);assert.deepEqual(c.world.snapshot(),before);
});
test('repeated START preserves the observed scheduler remainder',()=>{
  const c=model();command(c,1,'START');c.advanceRuntime(49);command(c,2,'START');c.advanceRuntime(1);
  assert.equal(c.world.tick,1);assert.equal(c.runtime.observedWallMs,50);assert.equal(c.wallRemainderMs,0);
});
test('a gap failure cannot commit the preceding runtime ticks',()=>{
  const c=new ModelController({scenario:'competition',parameters:{maxEvents:110},instanceFactory:()=> 'test:composite'});
  command(c,1,'STEP',{ticks:2});command(c,2,'START');const before=c.world.snapshot();
  assert.throws(()=>c.advanceRuntime(1000),/log full/);assert.deepEqual(c.world.snapshot(),before);
  assert.equal(c.runtime.lastRejectedIntervalMs,1000);assert(c.world.audit().passed);
});
test('explicit invalid parameter values are rejected rather than replaced by defaults',()=>{
  const c=model(),before=c.world.snapshot();
  for(const [type,payload]of [['RESET',{scenario:null}],['RESET',{parameters:null}],['RESET',{parameters:{tickMs:null}}],['RESET',{parameters:{instanceId:null}}],['STEP',{ticks:null}]]){
    assert.equal(command(c,1,type,payload).type,'ERROR');assert.deepEqual(c.world.snapshot(),before);
  }
});
test('a new generation clears all scheduler observation fields',()=>{
  const c=model();command(c,1,'START');c.advanceRuntime(49);command(c,2,'PAUSE');
  const saved=command(c,3,'EXPORT').text;c.runtime.lastRejectedIntervalMs=123;
  for(const [type,payload]of [['RESET',{scenario:'competition'}],['RESTORE',{text:saved}]]){
    const result=command(c,4,type,payload);assert.equal(result.type,'RESULT');
    assert.equal(result.projection.runtime.pendingTickMs,0);assert.equal(result.projection.runtime.lastRejectedIntervalMs,null);
  }
});
