// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan, validateInput, updateTask, planMarkdown, runFixture } from './model.mjs';
import { METHODS, SOURCES, TOOLS, TRACKS, CASE_STUDIES, FAMILIES } from './catalog.mjs';
const input=()=>({family:'identity',environment:'OWN_LOCAL',observation:'IDEA',question:'Welche Identität kommt an?',scope:{target:'own-fixture',owner:'local-owner',policyUrl:'',allowedAction:'synthetic comparison'}});

test('every family retains a usable source, countermodel and instrument',()=>{
  const sourceIds=new Set(SOURCES.map(s=>s.id)),toolIds=new Set(TOOLS.map(t=>t.id)),methodIds=new Set(METHODS.map(m=>m.id));
  for(const rows of [SOURCES,TOOLS,METHODS,TRACKS,CASE_STUDIES]) assert.equal(new Set(rows.map(row=>row.id)).size,rows.length);
  for(const family of Object.keys(FAMILIES)) assert.ok(METHODS.some(m=>m.family===family));
  for(const m of METHODS){assert.ok(m.question&&m.invariant&&m.counter&&m.test);assert.ok(m.sources.length&&m.sources.every(id=>sourceIds.has(id)));assert.ok(m.tools.length&&m.tools.every(id=>toolIds.has(id)));if(m.demo)assert.ok(runFixture(m.demo));}
  for(const row of [...TRACKS,...CASE_STUDIES]){assert.ok(row.methods.every(id=>methodIds.has(id)));assert.ok(row.sources.every(id=>sourceIds.has(id)));}
  for(const tool of TOOLS)assert.ok(sourceIds.has(tool.source));
  for(const source of SOURCES){const url=new URL(source.url);assert.equal(url.protocol,'https:');assert.equal(url.username,'');assert.equal(url.password,'');}
});

test('filled policy and claimed impact never manufacture authority or observed impact',()=>{
  const v=input();v.environment='PROGRAM';v.observation='IMPACT';v.scope.policyUrl='https://example.org/policy';
  const p=buildPlan(v);assert.equal(p.route,'BIND_CURRENT_PROGRAM_POLICY');assert.equal(p.authority.state,'DECLARED_NOT_VERIFIED');assert.equal(p.authority.externalExecution,'NONE');assert.equal(p.authority.targetContact,'NONE');assert.equal(p.authority.policyFetch,'NONE');assert.equal(p.observation.state,'USER_DECLARED');assert.equal(p.claimCeiling,'DETERMINISTIC_RESEARCH_PLAN_ONLY');assert.match(p.tasks[0].detail,/tatsächliche Policy/);
});

test('missing program basis changes the next action; source and own fixtures have separate routes',()=>{
  const v=input();v.environment='PROGRAM';v.scope={target:'',owner:'',policyUrl:'',allowedAction:''};
  assert.match(buildPlan(v).tasks[0].detail,/target, owner, policyUrl, allowedAction/);
  v.environment='PUBLIC_SOURCES';assert.equal(buildPlan(v).route,'TRACE_PUBLIC_SOURCE');
  v.environment='OWN_LOCAL';assert.equal(buildPlan(v).route,'COMPARE_OWNED_SYNTHETIC_FIXTURE');
});

test('all mandatory axes remain visible; plan construction preserves the input',()=>{
  const v=input(),before=JSON.stringify(v),p=buildPlan(v);assert.equal(JSON.stringify(v),before);assert.equal(p.axes.length,9);assert.equal(new Set(p.axes.map(a=>a.id)).size,9);assert.ok(p.axes.every(a=>a.state==='UNKNOWN'));
  p.input.scope.target='changed';assert.equal(v.scope.target,'own-fixture');assert.equal(p.tasks.length,6);
});

test('task completion records user progress and keeps proof and authority unchanged',()=>{
  const p=buildPlan(input()),next=updateTask(p,'trace','DONE');assert.equal(p.tasks[1].state,'NEW');assert.equal(next.tasks[1].state,'DONE');assert.equal(next.tasks[1].evidenceState,'USER_DECLARED_PROGRESS');assert.deepEqual(next.authority,p.authority);assert.equal(next.claimCeiling,p.claimCeiling);assert.throws(()=>updateTask(p,'missing','DONE'));assert.throws(()=>updateTask(p,'trace','PROVEN'));
});

test('every family creates a self-contained local handoff with a counterquestion',()=>{
  for(const family of Object.keys(FAMILIES)){const v={...input(),family},p=buildPlan(v);assert.ok(p.methods.length&&p.tools.length&&p.openQuestions.length);const md=planMarkdown(p);assert.match(md,/Wiederaufnahme/);assert.match(md,/DETERMINISTIC_RESEARCH_PLAN_ONLY/);assert.ok(md.includes(v.question));assert.doesNotThrow(()=>JSON.parse(JSON.stringify(p)));}
});

test('unknown, oversized, executable-shaped and malformed inputs are rejected',()=>{
  const cases=[null,[],Object.assign(input(),{extra:1}),{...input(),family:'constructor'},{...input(),family:'__proto__'},{...input(),environment:'INTERNET_SCAN'},{...input(),observation:'CONFIRMED'}, {...input(),question:'x'.repeat(2401)},{...input(),question:'\ud800'},{...input(),question:'a\u0000b'}, {...input(),scope:{...input().scope,policyUrl:'javascript:alert(1)'}},{...input(),scope:{...input().scope,policyUrl:'https://name:secret@example.org'}},{...input(),scope:{...input().scope,policyUrl:'file:///C:/private'}},{...input(),scope:{...input().scope,token:'secret'}}];
  for(const v of cases) assert.throws(()=>validateInput(v));
  const dynamic=input();Object.defineProperty(dynamic,'question',{get(){throw Error('getter executed');},enumerable:true});assert.throws(()=>validateInput(dynamic),/dynamisches Feld/);
  assert.doesNotThrow(()=>validateInput({...input(),question:'🔬 Äquivalenz?'}));
});

test('different tuples collide under concatenation while typed representation separates them',()=>{
  const r=runFixture('serialization');assert.equal(r.original.equal,true);assert.equal(r.bound.equal,false);const normal=runFixture('serialization',true);assert.equal(normal.original.equal,true);assert.equal(normal.bound.equal,true);assert.match(r.ceiling,/keine kryptografische Hashkollision/);
});
test('object binding rejects only the cross-subject fixture and preserves ordinary use',()=>{
  assert.equal(runFixture('identity').original.decision,'ALLOW');assert.equal(runFixture('identity').bound.decision,'DENY');assert.equal(runFixture('identity',true).bound.decision,'ALLOW');
});
test('aborted-request model retains old state only on the defective path',()=>{
  assert.equal(runFixture('lifecycle').original.visibleOwner,'alice');assert.equal(runFixture('lifecycle').bound.visibleOwner,'UNSET');assert.equal(runFixture('lifecycle',true).original.visibleOwner,'UNSET');assert.match(runFixture('lifecycle').ceiling,/ohne PHP-Engine/);
});
test('different intended chain views are not automatically labeled a vulnerability',()=>{
  const r=runFixture('finality');assert.equal(r.original.available,true);assert.equal(r.bound.available,false);assert.equal(runFixture('finality',true).bound.available,true);assert.match(r.conclusion,/Consumer-Vertrag/);assert.match(r.ceiling,/kein TRON-Runtime/);assert.throws(()=>runFixture('remote'));assert.throws(()=>runFixture('identity',1));
});
