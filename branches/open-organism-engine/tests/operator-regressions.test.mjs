import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../src/open-world.mjs';
import {attachReceptor,attachDemand} from '../src/operators.mjs';
import {expressCodingDNA,translateRNA} from '../src/genetic-code.mjs';
test('reference sequence budgets are enforced before expanding or translating long input',()=>{
  assert.throws(()=>expressCodingDNA('A'.repeat(100001)),/DNA reference length/);
  assert.throws(()=>translateRNA('A'.repeat(100001)),/RNA reference length/);
});
test('two receptors consume only their own signal and preserve unmatched messages',()=>{
  const w=createWorld();for(const id of ['sender','receiver'])w.addEntity({id});
  for(const signal of ['ALPHA','BETA','OTHER'])w.addChannel({id:signal.toLowerCase(),from:'sender',to:'receiver',signal});
  attachReceptor(w,{id:'ra',entityId:'receiver',signal:'ALPHA',dimension:'alpha',gain:.3});
  attachReceptor(w,{id:'rb',entityId:'receiver',signal:'BETA',dimension:'beta',gain:.5});
  for(const channelId of ['alpha','beta','other'])w.emit({channelId});
  w.advance(50);assert.equal(w.observe('receiver').dimensions.alpha,.3);assert.equal(w.observe('receiver').dimensions.beta,.5);
  assert.deepEqual(w.inbox('receiver').map(m=>m.signal),['OTHER']);assert.equal(w.audit().passed,true);
});
test('demand cannot borrow a different target or a different resource name',()=>{
  const w=createWorld();for(const id of ['x','y'])w.defineResource({id});for(const id of ['a','b','c'])w.addEntity({id});
  w.addRoute({id:'route',from:'a',to:'c',resource:'x',vmax:1});
  const before=w.snapshot();
  assert.throws(()=>attachDemand(w,{id:'bad',entityId:'a',routeId:'route',targetId:'b',resource:'y',goal:1}));
  assert.deepEqual(w.snapshot(),before);
});
test('reference translation exposes normalization, orientation and incomplete sequence',()=>{
  const result=expressCodingDNA('atggcttaa');
  assert.equal(result.sourceDNA,'atggcttaa');assert.equal(result.normalizedDNA,'ATGGCTTAA');
  assert.equal(result.normalization,'EXPLICIT_ASCII_CASE_FOLD');assert.equal(result.translation.direction,'5_PRIME_TO_3_PRIME');
  assert.equal(result.translation.protein,'MA');
  assert.equal(translateRNA('AUGGCUU').trailingBases,'U');
  assert.throws(()=>translateRNA('AUG',{requireStart:'false'}));
});
