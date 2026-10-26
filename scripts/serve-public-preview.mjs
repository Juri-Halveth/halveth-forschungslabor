// SPDX-License-Identifier: MIT
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { publicFiles } from './build-encounter-site.mjs';

const TYPES={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.py':'text/plain; charset=utf-8','.png':'image/png'};
export async function createPreview(repoRoot) {
  const root=await fs.realpath(repoRoot),files=new Map();
  for(const entry of publicFiles){
    const target=path.join(root,entry.sourcePath),stat=await fs.lstat(target),real=await fs.realpath(target);
    if(!stat.isFile()||stat.isSymbolicLink()||!real.startsWith(root+path.sep))throw Error('Public regular file required: '+entry.path);
    files.set('/'+entry.path,{bytes:await fs.readFile(real),type:TYPES[path.extname(entry.path)]||'application/octet-stream'});
  }
  return http.createServer((request,response)=>{
    const port=response.socket.localPort;
    response.setHeader('Cache-Control','no-store');response.setHeader('X-Content-Type-Options','nosniff');response.setHeader('Referrer-Policy','no-referrer');
    response.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; frame-ancestors 'self'");
    if(request.headers.host!==`127.0.0.1:${port}`){response.writeHead(403);response.end('Host rejected');return;}
    if(!['GET','HEAD'].includes(request.method)){response.writeHead(405,{'Allow':'GET, HEAD'});response.end('Read-only preview');return;}
    const route=request.url.split('?',1)[0];
    if(!route.startsWith('/')||/[\\%]/.test(route)||route.split('/').includes('..')){response.writeHead(404);response.end('Not in public preview');return;}
    const key=route.endsWith('/')?route+'index.html':route;
    const file=files.get(key);
    if(!file){response.writeHead(404);response.end('Not in public preview');return;}
    response.writeHead(200,{'Content-Type':file.type,'Content-Length':file.bytes.length});response.end(request.method==='HEAD'?undefined:file.bytes);
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  if(process.argv.length!==2)throw Error('Use node scripts/serve-public-preview.mjs; no target or directory argument');
  const server=await createPreview(path.resolve(import.meta.dirname,'..'));
  server.listen(8867,'127.0.0.1',()=>console.log('Local source preview: http://127.0.0.1:8867/security/ — explicit public files only; not a deployed release.'));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close());
}
