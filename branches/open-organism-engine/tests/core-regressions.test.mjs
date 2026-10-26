import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,restoreWorld,verifyEventChain,ENGINE_VERSION} from '../src/open-world.mjs';
import {sha256} from '../src/sha256.mjs';

function routeWorld(config={},stock=10){
  const w=createWorld({tickMs:1000,...config});w.defineResource({id:'x'});
  w.addEntity({id:'a',resources:{x:stock}});w.addEntity({id:'b',resources:{x:0}});w.addEntity({id:'c',resources:{x:0}});
  w.addRoute({id:'ab',from:'a',to:'b',resource:'x',vmax:stock});return w;
}
const near=(a,b)=>assert(Math.abs(a-b)<=Math.max(Number.MIN_VALUE,Math.abs(b)*1e-12),String(a)+' != '+b);
const unchangedFailure=(w,operation,match)=>{
  const before=w.snapshot();assert.throws(operation,match);assert.deepEqual(w.snapshot(),before);assert.equal(w.audit().passed,true);
};
const reseal=snapshot=>{const {checkpointSha256,...body}=snapshot;return {...body,checkpointSha256:sha256(JSON.stringify(body))};};

test('C01: event-budget rejection preserves resource, entity and dimension state',()=>{
  const a=createWorld({maxEvents:1});unchangedFailure(a,()=>a.defineResource({id:'x'}),/log full/);
  const b=createWorld({maxEvents:3});b.defineResource({id:'x'});b.addEntity({id:'a',resources:{x:1}});
  unchangedFailure(b,()=>b.addEntity({id:'b',resources:{x:1}}),/log full/);
  const c=createWorld({maxEvents:2});c.addEntity({id:'a'});
  unchangedFailure(c,()=>c.setDimension('a','n',1),/log full/);
});

test('C01: full journal cannot silently attach routes, channels, relations or processes',()=>{
  for(const operation of [
    w=>w.addRoute({id:'ac',from:'a',to:'c',resource:'x',vmax:1}),
    w=>w.addChannel({id:'signal',from:'a',to:'b',signal:'PULSE'}),
    w=>w.relate({from:'a',to:'b',kind:'related'}),
    w=>w.addProcess({id:'p',entityId:'a',run:()=>{}}),
    w=>w.request({routeId:'ab',amount:1})
  ]){
    const w=routeWorld({maxEvents:6});unchangedFailure(w,()=>operation(w),/log full/);
  }
});

test('C01/C09: journal exhaustion rolls back all ticks in the failed advance call',()=>{
  const w=routeWorld({maxEvents:9});w.request({routeId:'ab',amount:1});
  unchangedFailure(w,()=>w.advance(3000),/log full/);
  assert.equal(w.timeMs,0);assert.equal(w.pending.length,1);
});

test('C09: callback failure rolls back time, dimensions, messages, requests and counters',()=>{
  const w=routeWorld();w.addChannel({id:'pulse',from:'a',to:'b',signal:'PULSE'});
  w.addProcess({id:'first',entityId:'a',run:ctx=>{ctx.update('partial',1);ctx.request({routeId:'ab',amount:1});ctx.emit({channelId:'pulse'});}});
  w.addProcess({id:'second',entityId:'b',run:()=>{throw new Error('process fault');}});
  unchangedFailure(w,()=>w.advance(1000),/process fault/);
});

test('I01: advanceWithGap rolls back successful ticks if the following gap exhausts the journal',()=>{
  const w=routeWorld({maxEvents:9});w.request({routeId:'ab',amount:1});
  unchangedFailure(w,()=>w.advanceWithGap(1000,750),/log full/);
  assert.equal(w.tick,0);assert.equal(w.pending.length,1);assert.equal(w.undocumentedGapUs,0);
});

test('advanceWithGap validates both canonical microsecond inputs before any callback or mutation',()=>{
  const w=routeWorld();let called=0;w.addProcess({id:'p',entityId:'a',run:()=>{called++;}});
  const before=w.snapshot(),contracts=structuredClone(before.contracts);
  for(const [delta,gap]of [[1000,.0005],[50-7.5e-11,1000],[86400001,1],[1,undefined],[null,1],[1,-1]]){
    assert.throws(()=>w.advanceWithGap(delta,gap));assert.deepEqual(w.snapshot(),before);assert.equal(called,0);
  }
  const result=w.advanceWithGap(1000,8001/1000);
  assert.equal(result.tick,1);assert.equal(result.undocumentedGapUs,8001);assert.equal(called,1);
  assert.equal(w.timeMs,1000);assert.equal(w.undocumentedGapMs,8.001);assert(w.audit().passed);
  assert.deepEqual(w.snapshot().contracts,contracts);
});

test('C02: a shared saturated route releases its unused share to another route',()=>{
  const x=createWorld({tickMs:1000});x.defineResource({id:'x'});
  for(const [id,amount]of [['a',10],['b',0],['c',0]])x.addEntity({id,resources:{x:amount}});
  x.addRoute({id:'ab',from:'a',to:'b',resource:'x',vmax:1});x.addRoute({id:'ac',from:'a',to:'c',resource:'x',vmax:10});
  x.request({routeId:'ab',amount:10});x.request({routeId:'ab',amount:10});x.request({routeId:'ac',amount:10});x.advance(1000);
  near(x.observe('a').resources.x,0);near(x.observe('b').resources.x,1);near(x.observe('c').resources.x,9);assert(x.audit().passed);
});

test('C04/C12: finite weights remain usable across tiny and large common scales',()=>{
  for(const scale of [1e-300,1e-10,1,1e200,1e307]){
    const w=routeWorld();w.addRoute({id:'ac',from:'a',to:'c',resource:'x',vmax:10});
    w.request({routeId:'ab',amount:10,weight:4*scale});w.request({routeId:'ac',amount:10,weight:scale});w.advance(1000);
    near(w.observe('b').resources.x,8);near(w.observe('c').resources.x,2);assert(w.audit().passed);
  }
  const w=routeWorld();w.request({routeId:'ab',amount:10,weight:1e308});w.advance(1000);
  assert.equal(w.observe('a').resources.x,0);assert.equal(w.observe('b').resources.x,10);assert(w.audit().passed);
});

test('C13: large finite demands conserve the source with ordinary weights',()=>{
  const w=routeWorld({},1e200);w.addRoute({id:'ac',from:'a',to:'c',resource:'x',vmax:1e200});
  for(const routeId of ['ab','ac'])w.request({routeId,amount:1e200});
  w.advance(1000);near(w.observe('b').resources.x,5e199);near(w.observe('c').resources.x,5e199);
  assert.equal(w.observe('a').resources.x,0);assert(w.audit().passed);
});

test('small positive stocks and requests are not erased by a fixed epsilon',()=>{
  const w=routeWorld({},1e-200);w.request({routeId:'ab',amount:1e-200,weight:1e-300});w.advance(1000);
  assert.equal(w.observe('b').resources.x,1e-200);assert(w.audit().passed);
});

test('capacity does not underflow concentration before a large vmax restores a finite flux',()=>{
  const w=createWorld({tickMs:1000});w.defineResource({id:'x'});
  w.addEntity({id:'a',resources:{x:1e-16},volume:1e308});w.addEntity({id:'b'});
  w.addRoute({id:'ab',from:'a',to:'b',resource:'x',vmax:1e308,km:1});w.request({routeId:'ab',amount:1e-16});w.advance(1000);
  near(w.observe('b').resources.x,1e-16);assert(w.audit().passed);
});

test('the smallest positive stock survives a saturation intermediate underflow',()=>{
  const w=createWorld({tickMs:1000});w.defineResource({id:'x'});
  w.addEntity({id:'a',resources:{x:Number.MIN_VALUE}});w.addEntity({id:'b'});
  w.addRoute({id:'ab',from:'a',to:'b',resource:'x',vmax:1e308,km:1e308});w.request({routeId:'ab',amount:Number.MIN_VALUE});w.advance(1000);
  assert.equal(w.observe('b').resources.x,Number.MIN_VALUE);assert(w.audit().passed);
});

test('a declared resource named constructor uses its own stock entries',()=>{
  const w=createWorld({tickMs:1000});w.defineResource({id:'constructor'});
  w.addEntity({id:'a',resources:{constructor:1}});w.addEntity({id:'b'});
  w.addRoute({id:'ab',from:'a',to:'b',resource:'constructor',vmax:1});w.request({routeId:'ab',amount:1});w.advance(1000);
  assert.equal(w.observe('b').resources.constructor,1);assert(w.audit().passed);
});

test('full journals preserve transit and an already populated inbox',()=>{
  const w=createWorld({maxEvents:7});w.addEntity({id:'a'});w.addEntity({id:'b'});
  w.addChannel({id:'pulse',from:'a',to:'b',signal:'PULSE'});w.emit({channelId:'pulse'});w.advance(50);
  assert.equal(w.inbox('b').length,1);
  unchangedFailure(w,()=>w.clearInbox('b',{signal:'PULSE'}),/log full/);
  unchangedFailure(w,()=>w.emit({channelId:'pulse'}),/log full/);
});

test('C08: a second finite initial stock cannot overflow total supply',()=>{
  const w=createWorld();w.defineResource({id:'x'});w.addEntity({id:'a',resources:{x:Number.MAX_VALUE}});
  unchangedFailure(w,()=>w.addEntity({id:'b',resources:{x:Number.MAX_VALUE}}),/initial supply/);
  assert(Number.isFinite(w.audit().resourceTotals.x));
});

test('C14: non-JSON dimensions and metadata fail before mutation',()=>{
  const w=createWorld();w.addEntity({id:'a'});
  const sparse=Array(1),accessor={};Object.defineProperty(accessor,'value',{get:()=>1,enumerable:true});
  for(const value of [new Map([['x',1]]),new Set([1]),new Date(0),1n,undefined,NaN,Infinity,sparse,accessor,{nested:undefined},'\ud800']){
    unchangedFailure(w,()=>w.setDimension('a','value',value));
    unchangedFailure(w,()=>w.addEntity({id:'bad',sourceRef:{candidate:value}}));
  }
  const data={nested:[1,{ok:true}]};w.setDimension('a','value',data);data.nested[1].ok=false;
  assert.equal(w.observe('a').dimensions.value.nested[1].ok,true);assert(w.audit().passed);
});

test('C06 and audit scope: unlogged definitions, identity, disappearance and queues are detected',()=>{
  const changes=[
    w=>{w.entities.get('a').resources.unknown=1;},
    w=>{w.entities.get('a').id='other';},
    w=>{w.entities.get('a').parentId='b';},
    w=>{w.entities.get('a').origin='other';},
    w=>{w.entities.get('a').volume=2;},
    w=>{w.entities.get('a').label='changed';},
    w=>{w.entities.get('a').revision++;},
    w=>{w.entities.delete('c');},
    w=>{w.resources.get('x').unit='changed';},
    w=>{w.resources.delete('x');},
    w=>{w.routes.delete('ab');},
    w=>{w.channels.delete('pulse');},
    w=>{w.processes.delete('p');},
    w=>{w.processes.get('p').parameters.changed=true;},
    w=>{w.pending[0].amount=2;},
    w=>{w.pending=[];},
    w=>{w.signalTransit[0].payload='changed';},
    w=>{w.signalTransit=[];},
    w=>{w.inboxes.get('b').push({id:99});},
    w=>{w.counters.flows++;},
    w=>{w.initialSupply.set('x',9);},
    w=>{w.requestSeq++;},
    w=>{w.worldId='other';},
    w=>{w.timeMs=1;},
    w=>{w.tick=1;}
  ];
  for(const change of changes){
    const w=routeWorld();w.addChannel({id:'pulse',from:'a',to:'b',signal:'PULSE'});
    w.addProcess({id:'p',entityId:'a',run:()=>{}});w.request({routeId:'ab',amount:1});w.emit({channelId:'pulse'});
    assert(w.audit().passed);change(w);assert.equal(w.audit().passed,false,change.toString());
  }
});

test('C10: all process entity reads use the same tick-start state',()=>{
  for(const reverse of [false,true]){
    const w=createWorld();w.addEntity({id:'a',dimensions:{n:0}});w.addEntity({id:'b'});
    const first=()=>w.addProcess({id:'one',entityId:'a',run:ctx=>{ctx.update('n',1);ctx.update('self_seen',ctx.read('a').dimensions.n);}});
    const second=()=>w.addProcess({id:'two',entityId:'b',run:ctx=>ctx.update('seen',ctx.read('a').dimensions.n)});
    for(const register of reverse?[second,first]:[first,second])register();
    w.advance(50);assert.equal(w.observe('a').dimensions.n,1);assert.equal(w.observe('a').dimensions.self_seen,0);
    assert.equal(w.observe('b').dimensions.seen,0);assert(w.audit().passed);
  }
});

test('C03: selective receive preserves messages intended for another local process',()=>{
  const w=createWorld();w.addEntity({id:'a'});w.addEntity({id:'b'});
  for(const signal of ['ALPHA','BETA']){
    w.addChannel({id:signal.toLowerCase(),from:'a',to:'b',signal});
    w.addProcess({id:'p:'+signal.toLowerCase(),entityId:'b',run:ctx=>ctx.update(signal.toLowerCase(),ctx.receive({signal}).length)});
    w.emit({channelId:signal.toLowerCase()});
  }
  w.advance(50);assert.deepEqual(w.observe('b').dimensions,{alpha:1,beta:1});assert.deepEqual(w.inbox('b'),[]);assert(w.audit().passed);
});

test('C05: async callbacks and generator callbacks are rejected before registration',()=>{
  const w=createWorld();w.addEntity({id:'a'});
  for(const run of [async()=>{},function*(){yield 1;},async function*(){yield 1;}]){
    unchangedFailure(w,()=>w.addProcess({id:'bad',entityId:'a',run}),/synchronous/);
  }
});

test('C05: a normal function returning a Promise rolls back and its late context expires',async()=>{
  const w=createWorld();w.addEntity({id:'a'});
  w.addProcess({id:'p',entityId:'a',run:ctx=>Promise.resolve().then(()=>ctx.update('late',1))});
  const before=w.snapshot();assert.throws(()=>w.advance(50),/synchronously/);await Promise.resolve();await Promise.resolve();
  assert.deepEqual(w.snapshot(),before);assert(w.audit().passed);
});

test('retained process contexts cannot read, update or consume after the callback',()=>{
  const w=createWorld();w.addEntity({id:'a'});let retained;
  w.addProcess({id:'p',entityId:'a',run:ctx=>{retained=ctx;}});w.advance(50);
  const before=w.snapshot();
  for(const operation of [()=>retained.read('a'),()=>retained.update('late',1),()=>retained.receive(),()=>retained.inbox()])assert.throws(operation,/expired/);
  assert.deepEqual(w.snapshot(),before);
});

test('C07: clock rejects sub-microsecond ambiguity and never gifts time',()=>{
  assert.throws(()=>createWorld({tickMs:1.5}),/safe integer/);
  const w=createWorld(),d=50-7.5e-11;unchangedFailure(w,()=>w.advance(d),/microseconds/);unchangedFailure(w,()=>w.advance(2*d),/microseconds/);
  const a=createWorld({tickMs:1}),b=createWorld({tickMs:1});
  a.advance(1);for(let i=0;i<1000;i++)b.advance(.001);
  assert.deepEqual(a.snapshot(),b.snapshot());assert.equal(b.timeMs,1);assert.equal(b.remainderUs,0);
  const c=createWorld({tickMs:1});c.advance(.001);c.advance(.002);assert.equal(c.remainderUs,3);
  unchangedFailure(c,()=>c.advance(.0005),/microseconds/);c.advance(.997);assert.equal(c.timeMs,1);
  const exact=createWorld();exact.advance(8001/1000);assert.equal(exact.remainderUs,8001);
  unchangedFailure(exact,()=>exact.advance(.1+.2),/microseconds/);
  c.gap(.003);assert.equal(c.undocumentedGapUs,3);assert.equal(c.timeMs,1);assert(c.audit().passed);
});

function resumable(){
  const w=routeWorld({tickMs:50,instanceId:'run:fixture'});w.addChannel({id:'pulse',from:'a',to:'b',signal:'PULSE',delayTicks:2});
  const parameters={routeId:'ab',target:'b',goal:5};
  w.addProcess({id:'demand',entityId:'a',everyTicks:2,behaviorId:'fixture:demand',parameters,sourceRef:'LOCAL_FIXTURE',
    run:ctx=>{const deficit=Math.max(0,5-(ctx.read('b').resources.x??0));if(deficit)ctx.request({routeId:'ab',amount:deficit});}});
  w.emit({channelId:'pulse',payload:{hello:'world'}});w.request({routeId:'ab',amount:1});w.advance(13);return w;
}

test('v2 checkpoint records config, whole-us clock, namespace and full process manifest',()=>{
  const w=resumable(),s=w.snapshot();
  assert.equal(ENGINE_VERSION,'0.2.0');assert.equal(s.schema,'halveth.open-organism.v2');assert.equal(s.config.tickMs,50);
  assert.equal(s.remainderUs,13000);assert.equal(s.requestSeq,1);assert.equal(s.messageSeq,1);
  assert.equal(s.processDescriptors[0].behaviorId,'fixture:demand');assert.equal(s.processDescriptors[0].parameters.goal,5);
  assert.equal(s.processDescriptors[0].runSha256,sha256(w.processes.get('demand').run.toString()));
  assert.equal(s.contracts.restore.closureState,'NOT_SERIALIZED_OR_PROVEN');assert(verifyEventChain(s.events,s.head));
  const fresh=createWorld();assert.equal(fresh.snapshot().contracts.instance.claim,'DETERMINISTIC_NAMESPACE_NOT_HISTORICAL_INCARNATION');
  assert.equal(fresh.snapshot().contracts.clock.advance,'EXACT_WHOLE_MICROSECONDS_NO_ROUNDING');
});

test('restoreWorld resumes pending signals, requests, cadence and partial time deterministically',()=>{
  const a=resumable(),s=JSON.parse(JSON.stringify(a.snapshot())),b=restoreWorld(s,{processes:a.processes});
  assert.deepEqual(b.snapshot(),s);a.advance(287);b.advance(100);b.advance(187);assert.deepEqual(b.snapshot(),a.snapshot());assert(b.audit().passed);
  const c=restoreWorld(JSON.parse(JSON.stringify(a.snapshot())),{processes:[...a.processes.values()]});
  assert.deepEqual(c.inbox('b'),a.inbox('b'));assert(c.inbox('b').length>0);
  a.advance(200);c.advance(200);assert.deepEqual(c.snapshot(),a.snapshot());
});

test('restore failures preserve original checkpoint and require exactly matching trusted bindings',()=>{
  const w=resumable(),snapshot=w.snapshot(),original=structuredClone(snapshot),p=w.processes.get('demand');
  const cases=[
    [],[{...p,run:()=>{}}],[{...p,entityId:'b'}],[{...p,everyTicks:3}],[{...p,parameters:{...p.parameters,goal:6}}],
    [{...p,behaviorId:'other'}],[{...p,sourceRef:'OTHER'}],[p,{...p,id:'extra'}]
  ];
  for(const processes of cases){assert.throws(()=>restoreWorld(snapshot,{processes}),/binding|manifest/);assert.deepEqual(snapshot,original);}
  assert.throws(()=>restoreWorld(w.snapshot({includeEvents:false}),{processes:w.processes}),/complete event journal/);
});

test('restore rejects missing data, changed identity, queues and counters even after resealing',()=>{
  const w=resumable(),s=w.snapshot();
  const changes=[
    x=>{x.entities[0].volume=2;},x=>{x.entities.pop();},x=>{x.resources=[];},x=>{x.pending=[];},
    x=>{x.signalTransit[0].payload={forged:true};},x=>{x.counters.flows++;},x=>{x.remainderUs=50000;x.remainderMs=50;},
    x=>{x.processDescriptors[0].parameters.goal=6;},
    x=>{x.config.maxEvents++;},x=>{x.instanceId='other';}
  ];
  for(const change of changes){const changed=structuredClone(s);change(changed);assert.throws(()=>restoreWorld(reseal(changed),{processes:w.processes}));}
  const damaged=structuredClone(s);damaged.entities[0].volume=2;assert.throws(()=>restoreWorld(damaged,{processes:w.processes}),/digest/);
  assert.deepEqual(w.snapshot(),s);
});

test('restore supports an empty-process world and keeps namespaces separated',()=>{
  const w=createWorld();w.advance(17);const restored=restoreWorld(w.snapshot());
  assert.deepEqual(restored.snapshot(),w.snapshot());assert(restored.audit().passed);
  const other=createWorld({instanceId:'instance:other'});assert.notEqual(w.events[0].hash,other.events[0].hash);
  const mixed=structuredClone(w.events);mixed[0].instanceId='other';assert.equal(verifyEventChain(mixed,w.head),false);
});
