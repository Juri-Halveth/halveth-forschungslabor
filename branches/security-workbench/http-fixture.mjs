// SPDX-License-Identifier: MIT
// The target is created here. No caller-supplied hostname, port or URL exists.
import http from 'node:http';
import {once} from 'node:events';
import {randomBytes} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {accessDecision} from './core.mjs';

export async function startHttpLab({guard=true,requestBudget=64}={}){
  if(typeof guard!=='boolean'||!Number.isInteger(requestBudget)||requestBudget<1||requestBudget>64)throw Error('Invalid fixed lab configuration');
  const token=randomBytes(18).toString('hex');let port,used=0,total=0,closingPromise,timer;
  const close=()=>closingPromise??=(async()=>{clearTimeout(timer);server.closeAllConnections();if(server.listening)await new Promise(resolve=>server.close(resolve));})();
  const server=http.createServer({maxHeaderSize:2048},(req,res)=>{
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','Connection':'close','Content-Security-Policy':"default-src 'none'",'X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
    total++;if(total>=256){res.once('finish',()=>void close());return send(429,{reason:'LAB_SESSION_ENDED'});}
    if(req.headers.host!==`127.0.0.1:${port}`||req.headers.origin&&req.headers.origin!==`http://127.0.0.1:${port}`)return send(403,{reason:'ORIGIN_OR_HOST'});
    if(req.method!=='GET'||req.url!=='/lab/document')return send(404,{reason:'FIXTURE_ROUTE_ONLY'});
    if(req.headers['transfer-encoding']||req.headers['content-length']&&req.headers['content-length']!=='0')return send(400,{reason:'NO_REQUEST_BODY'});
    if(req.headers['x-lab-token']!==token)return send(401,{reason:'LAB_TOKEN_REQUIRED'});
    if(used>=requestBudget)return send(429,{reason:'FIXED_REQUEST_BUDGET'});
    used++;
    const loaded=req.headers['x-demo-owner'];
    if(!['alice','bob'].includes(loaded))return send(400,{reason:'SYNTHETIC_SUBJECT_ONLY'});
    const decision=accessDecision({authenticated:'alice',loaded,guard});
    return decision.allowed?send(200,{subject:loaded,document:'SYNTHETIC_METADATA_ONLY'}):send(403,{reason:'SUBJECT_MISMATCH'});
  });
  server.requestTimeout=2000;server.headersTimeout=2000;server.maxHeadersCount=12;server.maxConnections=8;server.setTimeout(2000,socket=>socket.destroy());
  server.listen(0,'127.0.0.1');await once(server,'listening');
  port=server.address().port;
  timer=setTimeout(()=>void close(),15*60*1000);timer.unref();
  return {port,token,close,isListening:()=>server.listening,guard,requestBudget,expiresAfterMinutes:15};
}

async function ownFixture(guard){
  const lab=await startHttpLab({guard,requestBudget:4});const {port,token}=lab;
  function call({owner='alice',authenticate=true,host=`127.0.0.1:${port}`}={}){
    return new Promise((resolve,reject)=>{
      const req=http.request({hostname:'127.0.0.1',port,path:'/lab/document',method:'GET',agent:false,headers:{Host:host,'X-Demo-Owner':owner,...(authenticate?{'X-Lab-Token':token}:{})}},res=>{
        let bytes=0;const chunks=[];
        res.on('data',chunk=>{bytes+=chunk.length;if(bytes>1024)res.destroy(Error('Fixture response limit'));else chunks.push(chunk);});
        res.on('error',reject);
        res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(Buffer.concat(chunks).toString())});}catch(e){reject(e);}});
      });
      req.setTimeout(2000,()=>req.destroy(Error('Fixture request timeout')));req.on('error',reject);req.end();
    });
  }
  try{
    const trace=[];
    for(const [id,options] of [['wrong-host',{host:'other.test'}],['no-token',{authenticate:false}],['own-object',{}],['cross-subject',{owner:'bob'}],['budget-3',{}],['budget-4',{}],['budget-exceeded',{}]]){
      trace.push({id,...await call(options)});
    }
    return {guard,trace};
  }finally{await lab.close();}
}

export async function runHttpSelfTest(){
  const startedAt=new Date().toISOString(),start=performance.now();
  const defective=await ownFixture(false),corrected=await ownFixture(true);
  const cross=fixture=>fixture.trace.find(r=>r.id==='cross-subject');
  const passed=defective.trace.map(r=>r.status).join(',')==='403,401,200,200,200,200,429'
    &&corrected.trace.map(r=>r.status).join(',')==='403,401,200,403,200,200,429'
    &&cross(defective).body.subject==='bob'&&cross(corrected).body.reason==='SUBJECT_MISMATCH';
  return {schema:'halveth.security-workbench.http-selftest.v1',startedAt,completedAt:new Date().toISOString(),elapsedMs:performance.now()-start,
    node:process.version,result:passed?'PASS':'FAIL',networkRequests:14,transport:'OWN_PROCESS_CREATED_LOOPBACK_HTTP',
    defective,corrected,scope:'Two self-created ephemeral loopback listeners, seven sequential requests each, fixed synthetic principals and at most 1024 response bytes.',
    source:'branches/security-workbench/http-fixture.mjs',
    limit:'Observed only on the same host. No external target, TLS handshake, stolen session, service load measurement or program finding.'};
}
