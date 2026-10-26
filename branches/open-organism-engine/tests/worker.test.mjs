import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
test('a real worker advances without UI requests and pauses on command',async t=>{
  const worker=new Worker(new URL('./fixtures/worker-host.mjs',import.meta.url));t.after(()=>worker.terminate());
  const queue=[],waiters=[];
  worker.on('message',m=>{queue.push(m);for(const wake of waiters.splice(0))wake();});
  const until=async predicate=>{const end=Date.now()+8000;while(Date.now()<end){const i=queue.findIndex(predicate);if(i>=0)return queue.splice(i,1)[0];await Promise.race([new Promise(resolve=>waiters.push(resolve)),new Promise(resolve=>setTimeout(resolve,100))]);}throw Error('Worker response deadline');};
  const initial=await until(m=>m.type==='UPDATE');assert.equal(initial.projection.world.tick,0);
  worker.postMessage({id:1,type:'RESET',payload:{scenario:'competition'}});await until(m=>m.id===1);
  worker.postMessage({id:2,type:'START',payload:{}});const start=await until(m=>m.id===2);
  const advanced=await until(m=>m.type==='UPDATE'&&m.projection.world.tick>=4);assert(advanced.projection.world.tick>start.projection.world.tick);
  worker.postMessage({id:3,type:'PAUSE',payload:{}});const paused=await until(m=>m.id===3);
  worker.postMessage({id:4,type:'AUDIT',payload:{}});const audited=await until(m=>m.id===4);
  assert(audited.audit.passed);assert.equal(audited.projection.world.tick,paused.projection.world.tick);assert.equal(audited.projection.running,false);
});
