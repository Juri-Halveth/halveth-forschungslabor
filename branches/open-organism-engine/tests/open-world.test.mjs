import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,verifyEventChain} from '../src/open-world.mjs';
import {buildCompartmentWorld} from '../src/biology-world.mjs';
import {profileWorld} from '../src/registry-bridge.mjs';

function worldWithRoute(opts={},vmax=10,km=0){
  const w=createWorld(opts);w.defineResource({id:'x'});
  w.addEntity({id:'a',resources:{x:10}});
  w.addEntity({id:'b',resources:{x:0}});
  w.addEntity({id:'c',resources:{x:0}});
  w.addRoute({id:'a:b:x',from:'a',to:'b',resource:'x',vmax,km});return w;
}

test('directed flux conserves per entity inventory and references its cause',()=>{
  const w=worldWithRoute();w.request({routeId:'a:b:x',amount:2,reason:'test'});w.advance(50);
  assert.equal(w.observe('a').resources.x,9.5);assert.equal(w.observe('b').resources.x,.5);
  assert.equal(w.audit().passed,true);
  assert.equal(w.snapshot().events.findLast(e=>e.type==='RESOURCE_TRANSFER').details.reason,'test');
});
test('no implicit reverse transport is introduced',()=>{
  const w=worldWithRoute();
  assert.throws(()=>w.request({routeId:'b:a:x',amount:1}),/unknown route/);
  w.advance(1000);assert.equal(w.observe('a').resources.x,10);
});
test('different finite transport velocities and saturation parameters give different fluxes',()=>{
  const a=worldWithRoute(),b=worldWithRoute({},10,100);
  a.request({routeId:'a:b:x',amount:5});b.request({routeId:'a:b:x',amount:5});
  a.advance(50);b.advance(50);
  assert(a.observe('b').resources.x>b.observe('b').resources.x);
});
test('many claimants do not create resource ex nihilo',()=>{
  const w=worldWithRoute();w.addRoute({id:'a:c:x',from:'a',to:'c',resource:'x',vmax:1000});
  w.request({routeId:'a:b:x',amount:100,weight:1});w.request({routeId:'a:c:x',amount:100,weight:1});
  w.advance(50);assert(w.audit().passed);assert(w.observe('a').resources.x>=0);
  assert(Math.abs(w.observe('a').resources.x+w.observe('b').resources.x+w.observe('c').resources.x-10)<1e-8);
});
test('weighted allocation is bounded and deterministic',()=>{
  const prepare=()=>{const w=worldWithRoute({},500);w.addRoute({id:'a:c:x',from:'a',to:'c',resource:'x',vmax:500});
    w.request({routeId:'a:b:x',amount:10,weight:4});w.request({routeId:'a:c:x',amount:10,weight:1});w.advance(50);return w;};
  const a=prepare(),b=prepare();assert.equal(a.observe('b').resources.x,8);
  assert.equal(a.observe('c').resources.x,2);assert.deepEqual(a.snapshot(),b.snapshot());
});
test('signals have explicit channels, origin and finite causal latency',()=>{
  const w=worldWithRoute();w.addChannel({id:'a:b:signal',from:'a',to:'b',signal:'TEST',delayTicks:3});
  w.emit({channelId:'a:b:signal',payload:{message:'hello'}});
  w.advance(100);assert.equal(w.inbox('b').length,0);w.advance(50);
  assert.equal(w.inbox('b').length,1);assert.equal(w.inbox('b')[0].payload.message,'hello');
  assert.equal(w.audit().passed,true);
});
test('full inbox records a dropped signal instead of silently erasing evidence',()=>{
  const w=worldWithRoute({maxInbox:1});w.addChannel({id:'a:b:signal',from:'a',to:'b',signal:'TEST'});
  w.emit({channelId:'a:b:signal'});w.emit({channelId:'a:b:signal'});w.advance(50);
  assert.equal(w.inbox('b').length,1);assert.equal(w.counters.signalsDropped,1);
  assert(w.events.some(e=>e.type==='INBOX_CAPACITY'));
});
test('clock gaps are explicit, not fabricated elapsed activity',()=>{
  const w=worldWithRoute();w.advance(100);w.gap(3600000);
  assert.equal(w.snapshot().modelMs,100);assert.equal(w.snapshot().undocumentedGapMs,3600000);
  assert.equal(w.audit().passed,true);
});
test('identity persists while state changes',()=>{
  const w=worldWithRoute();const before=w.observe('a');w.request({routeId:'a:b:x',amount:1});w.advance(50);
  const after=w.observe('a');assert.equal(before.id,after.id);assert.notEqual(before.revision,after.revision);
  assert.equal(after.origin,'a');
});
test('historical head and state snapshots cannot be modified from outside',()=>{
  const w=worldWithRoute();const detached=w.snapshot();detached.entities[0].resources.x=-999;
  detached.events[0].details.unit='fake';assert.equal(w.audit().passed,true);
  assert(verifyEventChain(w.events,w.head));
  const damaged=structuredClone(w.events);damaged.at(-1).type='FORGED';
  assert.equal(verifyEventChain(damaged,w.head),false);
});
test('audit detects silent state edits even if total remains conserved',()=>{
  const w=worldWithRoute();w.entities.get('a').resources.x-=1;w.entities.get('b').resources.x+=1;
  assert.equal(w.audit().passed,false);assert(w.audit().violations.some(v=>v.startsWith('unlogged inventory change')));
});
test('processes may only issue messages on their own outbound route',()=>{
  const w=worldWithRoute();w.addRoute({id:'c:b:x',from:'c',to:'b',resource:'x',vmax:2});
  w.addProcess({id:'bad',entityId:'a',run:ctx=>ctx.request({routeId:'c:b:x',amount:1})});
  assert.throws(()=>w.advance(50),/elsewhere/);
});
test('bad IDs and missing parents fail before model entry',()=>{
  const w=createWorld();w.defineResource({id:'x'});
  assert.throws(()=>w.addEntity({id:'foo/../../passwd'}));
  assert.throws(()=>w.addEntity({id:'orphan',parentId:'missing'}));
  assert.throws(()=>w.addEntity({id:'x',resources:{wrong:1}}));
});
test('biological multi-compartment scenario conserves abstract resources across long run',()=>{
  const w=buildCompartmentWorld();w.advance(25000);
  assert.equal(w.entities.size,19);assert(w.routes.size>20);
  assert.equal(w.audit().passed,true);assert(w.counters.flows>1000);
  assert(w.counters.signalsArrived>0);
});
test('profile bridge supports 68 distinct original-style roles without a hardcoded entity limit',()=>{
  const profiles=Array.from({length:68},(_,i)=>({id:`profile-${i}`,label:`P${i}`,role:`Perspective ${i}`}));
  const w=profileWorld({schema:'halveth.universe.v1',entities:profiles});w.advance(30000);
  assert.equal(w.entities.size,69);assert.equal(w.channels.size,68);assert(w.counters.signalsEmitted>0);
  assert.equal(w.audit().passed,true);
});
test('same simulation result regardless of advance chunk sizes',()=>{
  const a=buildCompartmentWorld(),b=buildCompartmentWorld();a.advance(1000);
  for(let i=0;i<20;i++) {b.advance(13);b.advance(37);}
  assert.deepEqual(a.snapshot(),b.snapshot());
});
