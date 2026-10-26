import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {ModelController} from '../src/controller.mjs';
// A synthetic scheduler oracle for the exact local worker source. The real
// worker and real browser are exercised separately; this is not a live clock.
const source=await fs.readFile(new URL('../world-worker.mjs',import.meta.url),'utf8');
const importLine="import {ModelController} from './src/controller.mjs';";
assert.equal(source.split(importLine).length,2);
function harness(){
  let now=0,onMessage,onInterval;const messages=[];
  vm.runInNewContext(source.replace(importLine,''),{ModelController,performance:{now:()=>now},self:{addEventListener:(type,callback)=>{assert.equal(type,'message');onMessage=callback;},postMessage:m=>messages.push(m)},setInterval:callback=>{onInterval=callback;}},{timeout:1000});
  return {send(at,id,type,payload={}){now=at;onMessage({data:{id,type,payload}});return messages.findLast(m=>m.id===id);},interval(at){now=at;onInterval();},last(){return messages.at(-1);}};
}
test('repeated START never resets an already running worker clock',()=>{
  const h=harness();h.send(0,1,'START');h.send(49,2,'START');h.interval(50);
  const result=h.send(50,3,'PAUSE');assert.equal(result.projection.world.tick,1);assert.equal(result.projection.runtime.observedWallMs,50);
});
test('PAUSE closes the tail interval and retains its sub-tick observation',()=>{
  const h=harness();h.send(200,1,'START');const paused=h.send(249,2,'PAUSE');
  assert.equal(paused.projection.runtime.observedWallMs,49);assert.equal(paused.projection.runtime.pendingTickMs,49);assert.equal(paused.projection.world.tick,0);
  h.send(1000,3,'START');h.interval(1001);const result=h.send(1001,4,'PAUSE');assert.equal(result.projection.world.tick,1);assert.equal(result.projection.runtime.observedWallMs,50);
});
