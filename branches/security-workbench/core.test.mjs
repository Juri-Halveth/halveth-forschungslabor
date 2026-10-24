// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {assessRuntime,parseVersion,inspectHost,decoderTrace,accessDecision,simulateBudget,triageText,localSuite} from './core.mjs';
import {ADVISORIES} from './catalog.mjs';
import {runtimeObservation,identityObservation,validBrotliRoundtrip} from './runtime.mjs';
import {runCli} from './cli.mjs';

test('all three Node patch boundaries distinguish the prior patch and preserve the advisory branch scope',()=>{
  for(const [before,fixed,issueCount] of [['22.23.3','22.23.4',7],['24.22.0','24.22.1',8],['26.12.0','26.12.1',10]]){
    assert.equal(assessRuntime(before).status,'BELOW_PATCH_FLOOR');
    assert.equal(assessRuntime(fixed).status,'MEETS_PATCH_FLOOR');
    assert.equal(assessRuntime(before).issues.length,issueCount);
  }
  assert.equal(assessRuntime('28.0.0').status,'UNREVIEWED_LINE');
  assert.equal(assessRuntime('20.0.0').status,'UNREVIEWED_LINE');
  assert.equal(assessRuntime('24.22.1').evidence,'DECLARED_VERSION_ONLY');
  assert.deepEqual(ADVISORIES.reduce((a,r)=>(a[r.severity]=(a[r.severity]??0)+1,a),{}),{High:4,Medium:3,Low:3});
});
test('Brotli backports are evaluated separately from the Node runtime',()=>{
  for(const [before,fixed] of [['1.0.9','1.0.10'],['1.1.0','1.1.1'],['1.2.0','1.2.1']]){
    assert.equal(assessRuntime(before,'brotli').status,'BELOW_PATCH_FLOOR');
    assert.equal(assessRuntime(fixed,'brotli').status,'MEETS_PATCH_FLOOR');
  }
  assert.equal(assessRuntime('1.4.3','bun').status,'BELOW_PATCH_FLOOR');
  assert.equal(assessRuntime('1.4.4','bun').status,'MEETS_PATCH_FLOOR');
  assert.equal(assessRuntime('2.0.0','bun').status,'UNREVIEWED_LINE');
  assert.throws(()=>assessRuntime('1.2.1','other'),/Unbekannte/);
});
test('explicit invalid versions are rejected without trimming, prefix guessing or prerelease promotion',()=>{
  for(const v of ['',null,{},'24','24.22','24.22.1-beta',' 24.22.1','24.22.1 ','24.022.1','v24.22.1.0','240000000000000.1.0'])assert.throws(()=>parseVersion(v));
});
test('real URL normalization is observable while synthetic C strings and the host policy stay separately labelled',()=>{
  const a=inspectHost('0127.0.0.1');assert.equal(a.whatwgHostname,'87.0.0.1');assert.equal(a.decision,'REVIEW_REQUIRED');
  const b=inspectHost('１２７.0.0.1');assert.equal(b.whatwgHostname,'127.0.0.1');assert.equal(b.reason,'NON_ASCII_POLICY');
  const c=inspectHost('other.test\0.allowed.test');assert.equal(c.whatwgHostname,null);assert.equal(c.syntheticCString,'other.test');
  for(const s of ['127.0.0.1','sample.test','EXAMPLE.test'])assert.equal(inspectHost(s).decision,'ASCII_HOST_POLICY_PASS');
  for(const s of ['x@sample.test','127.1','127.0.0.1#x','sample.test/path','bad\\host','a..test',' space.test','https://sample.test'])assert.equal(inspectHost(s).decision,'REVIEW_REQUIRED');
  assert.throws(()=>inspectHost('a'.repeat(254)));
});
test('permanent error is terminal; missing data remains resumable; a defective control accepts more data',()=>{
  const fixed=decoderTrace(),bad=decoderTrace({guard:false});
  assert.equal(fixed.state,'ERROR');assert.equal(fixed.accepted,1);assert.equal(bad.accepted,2);
  assert.equal(decoderTrace({events:['NEED_MORE_INPUT','DATA','FINISH']}).state,'DONE');
  assert.throws(()=>decoderTrace({events:['UNKNOWN']}));assert.throws(()=>decoderTrace({events:Array(13).fill('DATA')}));
});
test('same-owner control succeeds and cross-owner selector loses authority when the binding is checked',()=>{
  assert.equal(accessDecision({loaded:'alice'}).allowed,true);
  assert.equal(accessDecision().allowed,false);
  assert.equal(accessDecision({guard:false}).result,'CROSS_SUBJECT_ALLOWED_IN_DEFECTIVE_FIXTURE');
  assert.throws(()=>accessDecision({loaded:'some-real-user'}));
});
test('bounded token model rejects excessive demand without creating network requests',()=>{
  const b=simulateBudget({requests:20,capacity:8,refillPerSecond:0});assert.equal(b.allowed,8);assert.equal(b.rejected,12);assert.equal(b.networkRequests,0);
  assert.equal(simulateBudget({requests:20,capacity:8,refillPerSecond:10}).allowed,17);
  for(const input of [{requests:501},{requests:0},{requests:1.5},{capacity:0},{refillPerSecond:Infinity}])assert.throws(()=>simulateBudget(input));
});
test('static triage reports references and never promotes them to a malware verdict',()=>{
  const source='// A manual mentions eval(example) and https://sample.test';const a=triageText(source);
  assert.equal(a.verdict,'UNDETERMINED');assert.equal(a.matches.length,2);
  assert.equal(source.slice(a.matches[0].start,a.matches[0].end),'eval(');
  assert.equal(triageText('<script>alert(1)</script>').verdict,'UNDETERMINED');
  assert.throws(()=>triageText('x'.repeat(32769)));
});
test('process metadata and local certificate API retain their actual evidence scope',()=>{
  assert.equal(runtimeObservation().observation.node,process.version);
  assert.equal(identityObservation('127.0.0.1').tlsDnsOnlyFixtureAccepted,false);
  assert.equal(identityObservation('0127.0.0.1').inspection.whatwgHostname,'87.0.0.1');
  assert.equal(validBrotliRoundtrip().equal,true);
  assert.equal(localSuite().networkRequests,0);
});
test('CLI rejects arbitrary network targets and malformed options',async()=>{
  await assert.rejects(runCli(['selftest','https://outside.test']));
  await assert.rejects(runCli(['runtime','--force']));
  await assert.rejects(runCli(['identity']));
  await assert.rejects(runCli(['lab','https://outside.test']));
});
