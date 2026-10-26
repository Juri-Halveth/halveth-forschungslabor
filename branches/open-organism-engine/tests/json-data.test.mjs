import test from 'node:test';
import assert from 'node:assert/strict';
import {assertJsonData,parseJsonData,cloneJsonData} from '../src/json-data.mjs';
test('array-like numeric properties and invalid budgets cannot disappear during JSON serialization',()=>{
  for(const key of ['4294967295','9007199254740992','999999999999999999999999999999']){const a=[];a[key]={value:42};assert.throws(()=>assertJsonData(a),/array properties/);}
  for(const limits of [{maxDepth:NaN},{maxDepth:-1},{maxNodes:0},{maxNodes:Infinity}])assert.throws(()=>assertJsonData({},limits));
  for(const limits of [{maxBytes:NaN},{maxBytes:0},{maxDepth:Infinity}])assert.throws(()=>parseJsonData('{}',limits));
});
test('JSON imports bind syntax, finite values, scalar Unicode and decoded duplicate keys',()=>{
  for(const text of ['{"a":1,"a":2}','{"a":1,"\\u0061":2}','{"x":1e309}','{"x":"\\ud800"}','{"__proto__":{}}','[1,]','{"x":false} trailing'])assert.throws(()=>parseJsonData(text),text);
  const input={a:[1,true,null,{text:'Licht 🧬'}],literal:'{"not":"a key"}'};
  assert.deepEqual(parseJsonData(JSON.stringify(input)),input);
  assert.throws(()=>parseJsonData('"🧬"',{maxBytes:5}));
  assert.throws(()=>parseJsonData('[[[[1]]]]',{maxDepth:2}));
});
test('data does not become executable and unsupported state cannot silently serialize away',()=>{
  let invoked=false;const getter={get hidden(){invoked=true;return 42;}};
  const cyclic={};cyclic.self=cyclic;
  for(const value of [new Map([['declared',42]]),new Set(),new Date(),{x:undefined},{x:()=>1},[,,],cyclic,getter])assert.throws(()=>assertJsonData(value));
  assert.equal(invoked,false);
  const literal={text:'<img src=x onerror=alert(1)>',constructor:4};
  const cloned=cloneJsonData(literal);cloned.text='changed';assert.notEqual(cloned.text,literal.text);
  assert.equal(parseJsonData('{"constructor":4}').constructor,4);
});
