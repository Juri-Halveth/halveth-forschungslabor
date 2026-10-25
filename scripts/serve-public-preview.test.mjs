// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import { publicFiles } from './build-encounter-site.mjs';
import { createPreview } from './serve-public-preview.mjs';

test('Windows-independent module MIME and a closed publication list keep local preview usable',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'halveth-public-preview-'));
  t.after(async()=>{const actual=await fs.realpath(root),parent=await fs.realpath(os.tmpdir());if(path.dirname(actual)!==parent||!path.basename(actual).startsWith('halveth-public-preview-'))throw Error('Cleanup boundary');await fs.rm(actual,{recursive:true,force:true});});
  for(const file of publicFiles){const target=path.join(root,file.sourcePath);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,'synthetic public file');}
  await fs.writeFile(path.join(root,'private-case-index.json'),'synthetic private exclusion');
  const server=await createPreview(root);server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(resolve=>server.close(resolve)));
  const port=server.address().port;
  const request=(route,headers={},method='GET')=>new Promise((resolve,reject)=>{const req=http.request({hostname:'127.0.0.1',port,path:route,headers:{host:`127.0.0.1:${port}`,...headers},method},res=>{let body='';res.setEncoding('utf8');res.on('data',s=>body+=s);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));});req.on('error',reject);req.end();});
  const module=await request('/security/view.mjs');assert.equal(module.status,200);assert.equal(module.headers['content-type'],'text/javascript; charset=utf-8');assert.equal(module.headers['x-content-type-options'],'nosniff');
  assert.equal((await request('/security/')).status,200);
  for(const route of ['/private-case-index.json','/.git/config','/security/../private-case-index.json','/security/%2e%2e/private-case-index.json'])assert.equal((await request(route)).status,404);
  assert.equal((await request('/security/',{host:'other.example'})).status,403);assert.equal((await request('/security/',{},'POST')).status,405);
  assert.equal((await request('/security/view.mjs',{},'HEAD')).body,'');
});
