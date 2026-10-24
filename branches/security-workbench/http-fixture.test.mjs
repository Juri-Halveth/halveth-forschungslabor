// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {runHttpSelfTest,startHttpLab} from './http-fixture.mjs';
test('real bounded loopback HTTP rejects missing token and host, distinguishes the seeded defect, and enforces the request budget',{timeout:10000},async()=>{
  const r=await runHttpSelfTest();
  assert.equal(r.result,'PASS');assert.equal(r.networkRequests,14);
  assert.deepEqual(r.corrected.trace.map(t=>t.status),[403,401,200,403,200,200,429]);
  assert.equal(r.defective.trace[3].body.subject,'bob');
  assert.equal(r.corrected.trace[3].body.subject,undefined);
  assert.ok(!JSON.stringify(r).includes('X-Lab-Token'));
});
test('the manual lab accepts only its exact route and origin, rejects bodies, and can be fully closed',{timeout:10000},async()=>{
  await assert.rejects(startHttpLab({requestBudget:65}));
  const lab=await startHttpLab({requestBudget:1});
  const send=options=>new Promise((resolve,reject)=>{
    const req=http.request({hostname:'127.0.0.1',port:lab.port,method:options.method??'GET',path:options.path??'/lab/document',agent:false,
      headers:{'X-Lab-Token':lab.token,'X-Demo-Owner':'alice',...options.headers}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));res.on('error',reject);});
    req.setTimeout(2000,()=>req.destroy(Error('timeout')));req.on('error',reject);req.end();
  });
  try{
    assert.equal(lab.isListening(),true);
    assert.equal(await send({headers:{Origin:'https://outside.test'}}),403);
    assert.equal(await send({path:'/another-path'}),404);
    assert.equal(await send({method:'POST'}),404);
    assert.equal(await send({headers:{'Content-Length':'100'}}),400);
    assert.equal(await send({}),200);
    assert.equal(await send({}),429);
  }finally{await Promise.all([lab.close(),lab.close()]);}
  assert.equal(lab.isListening(),false);
});
