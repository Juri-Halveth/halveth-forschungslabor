import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../src/open-world.mjs';
import {attachReceptor,attachDemand} from '../src/operators.mjs';
import {expressCodingDNA,attachGeneReadout,STANDARD_CODON_TABLE} from '../src/genetic-code.mjs';

test('reference codon table includes all 64 RNA codons and three canonical stops',()=>{
  assert.equal(Object.keys(STANDARD_CODON_TABLE).length,64);
  assert.equal(Object.values(STANDARD_CODON_TABLE).filter(x=>x==='*').length,3);
  const r=expressCodingDNA('ATGGCTTAA');assert.equal(r.rna,'AUGGCUUAA');
  assert.equal(r.translation.protein,'MA');assert.equal(r.translation.status,'STOP_FOUND');
});
test('unknown DNA symbols cannot silently become valid coding sequences',()=>{
  assert.throws(()=>expressCodingDNA('ATG?TAA'));
  assert.equal(expressCodingDNA('CCCAAATAG').translation.status,'NO_START_FOUND');
  assert.equal(expressCodingDNA('ATGAAA').translation.status,'INCOMPLETE_NO_STOP');
});
test('receptor receives a message and updates local model state',()=>{
  const w=createWorld();w.defineResource({id:'r'});w.addEntity({id:'a',resources:{r:1}});w.addEntity({id:'b'});
  w.addChannel({id:'a:b:signal',from:'a',to:'b',signal:'PULSE',delayTicks:1});
  attachReceptor(w,{entityId:'b',id:'receiver',signal:'PULSE',dimension:'activation',gain:.3});
  w.emit({channelId:'a:b:signal'});w.advance(50);
  assert.equal(w.observe('b').dimensions.activation,.3);
  assert.equal(w.inbox('b').length,0);assert(w.audit().passed);
});
test('feedback demand consumes only available source stock',()=>{
  const w=createWorld();w.defineResource({id:'x'});
  w.addEntity({id:'a',resources:{x:3}});w.addEntity({id:'b',resources:{x:0}});
  w.addRoute({id:'r',from:'a',to:'b',resource:'x',vmax:100});
  attachDemand(w,{entityId:'a',id:'d',routeId:'r',targetId:'b',resource:'x',goal:5});
  w.advance(2000);
  assert.equal(w.observe('a').resources.x,0);assert.equal(w.observe('b').resources.x,3);assert(w.audit().passed);
});
test('gene readout updates state but makes no claim of biological reproduction',()=>{
  const w=createWorld();w.addEntity({id:'cell',kind:'software_cell'});
  attachGeneReadout(w,{entityId:'cell',codingDNA:'ATGGCTTAA'});w.advance(5000);
  assert.equal(w.observe('cell').dimensions.last_translation.protein,'MA');assert(w.audit().passed);
});
