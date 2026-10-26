import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRegistryText,profileWorld} from '../src/registry-data.mjs';
test('profile import keeps original prose and metadata as data without evaluating code',()=>{
  const registry={schema:'halveth.universe.v1',sourceCommit:'example',note:'fixture',entities:[{id:'p1',label:'<b>literal</b>',role:'Source role',en:'English role',section:'example',note:'kept'}]};
  const text='window.HalvethUniverse = '+JSON.stringify(registry)+';';
  const parsed=parseRegistryText(text);assert.deepEqual(parsed.registry,registry);assert.equal(parsed.receipt.execution,'DATA_ONLY_NO_EVAL');
  const w=profileWorld(parsed.registry,{sourceReceipt:parsed.receipt});
  assert.equal(w.observe('p1').dimensions.profileRecord.en,'English role');assert.equal(w.observe('origin').dimensions.registryMetadata.sourceCommit,'example');
  for(const suffix of [';globalThis.executed=true',';(()=>{throw 1})()'])assert.throws(()=>parseRegistryText(text+suffix));
  assert.throws(()=>parseRegistryText('{"schema":"x","schema":"halveth.universe.v1","entities":[]}'));
});
test('69 and 1000 synthetic profiles use declared budgets without a 68-profile ontology cap',()=>{
  for(const count of [69,1000]) {
    const registry={schema:'halveth.universe.v1',fixture:'SYNTHETIC',entities:Array.from({length:count},(_,i)=>({id:`p${i}`,label:`P${i}`,role:'Synthetic fixture'}))};
    const w=profileWorld(registry);assert.equal(w.entities.size,count+1);assert.equal(w.channels.size,count);assert.equal(w.audit().passed,true);
  }
  for(const entries of [[{id:'origin',role:'x'}],[{id:'same',role:'x'},{id:'same',role:'x'}]])assert.throws(()=>profileWorld({schema:'halveth.universe.v1',entities:entries}));
});
