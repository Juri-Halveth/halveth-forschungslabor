// SPDX-License-Identifier: MIT
import {ADVISORIES,CATALOG_VERSION,NODE_FLOORS} from './catalog.mjs';

export function parseVersion(value){
  if(typeof value!=='string'||value.length>32||!/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value))throw Error('Eine exakte stabile Version wie 24.22.1 ist erforderlich.');
  const numbers=value.replace(/^v/,'').split('.').map(Number);
  if(numbers.some(n=>!Number.isSafeInteger(n)||n>9999))throw Error('Version außerhalb des Zahlenbereichs.');
  return numbers;
}
function cmp(a,b){for(let i=0;i<3;i++)if(a[i]!==b[i])return a[i]<b[i]?-1:1;return 0;}
export function assessRuntime(version,product='node'){
  const v=parseVersion(version);let status,fixed,issues=[];
  if(product==='node'){
    fixed=NODE_FLOORS[v[0]]??null;
    status=fixed?(cmp(v,parseVersion(fixed))<0?'BELOW_PATCH_FLOOR':'MEETS_PATCH_FLOOR'):'UNREVIEWED_LINE';
    if(status==='BELOW_PATCH_FLOOR')issues=ADVISORIES.filter(a=>a.lines.includes(v[0])).map(a=>a.id);
  }else if(product==='bun'){
    fixed='1.4.4';status=v[0]!==1?'UNREVIEWED_LINE':cmp(v,[1,0,21])<0?'OUTSIDE_RECORDED_RANGE':cmp(v,[1,4,4])<0?'BELOW_PATCH_FLOOR':'MEETS_PATCH_FLOOR';
    if(status==='BELOW_PATCH_FLOOR')issues=['CVE-2026-111497'];
  }else if(product==='brotli'){
    fixed=v[1]===0?'1.0.10':v[1]===1?'1.1.1':'1.2.1';
    status=v[0]!==1||v[1]>2?'UNREVIEWED_LINE':cmp(v,[1,0,3])<0?'OUTSIDE_RECORDED_RANGE':cmp(v,parseVersion(fixed))<0?'BELOW_PATCH_FLOOR':'MEETS_PATCH_FLOOR';
    if(status==='BELOW_PATCH_FLOOR')issues=['CVE-2026-111497'];
  }else throw Error('Unbekannte Laufzeitfamilie.');
  return {product,version:v.join('.'),status,fixed,issues,catalog:CATALOG_VERSION,evidence:'DECLARED_VERSION_ONLY',
    limit:'Versionsvergleich; Backports, Buildherkunft und erreichbare Verarbeitungspfade separat prüfen. Node-eigene Brotli-Backports über den Node-Stand bewerten.'};
}

export function inspectHost(raw){
  if(typeof raw!=='string'||!raw||raw.length>253)throw Error('Ein Hostname mit 1 bis 253 Zeichen ist erforderlich.');
  let hostname=null,urlError=null;
  try{hostname=new URL('https://'+raw+'/').hostname;}catch{urlError='URL_REJECTED';}
  let reason=null;
  if(/[\u0000-\u0020\u007f]/.test(raw))reason='CONTROL_OR_WHITESPACE';
  else if(/[^\x21-\x7e]/.test(raw))reason='NON_ASCII_POLICY';
  else if(/[@/?#%:\\]/.test(raw))reason='AUTHORITY_SYNTAX_POLICY';
  else if(!hostname)reason='URL_REJECTED';
  else if(hostname!==raw.toLowerCase())reason='NORMALIZATION_DIFFERENCE';
  else if(!raw.split('.').every(p=>/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(p)))reason='LABEL_POLICY';
  const nul=raw.indexOf('\0');
  return {raw,codePoints:Array.from(raw).map(c=>'U+'+c.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')),
    whatwgHostname:hostname,urlError,syntheticCString:nul<0?raw:raw.slice(0,nul),
    decision:reason?'REVIEW_REQUIRED':'ASCII_HOST_POLICY_PASS',reason,
    evidence:'WHATWG_URL_API_AND_EXPLICIT_ASCII_POLICY',
    limit:'Keine DNS- oder TLS-Verbindung. C-String-Sicht ist ein Lehrmodell; die ASCII-Policy ist bewusst enger als allgemeines IDN.'};
}

export function decoderTrace({guard=true,events=['DATA','INVALID_BLOCK','DATA']}={}){
  if(typeof guard!=='boolean'||!Array.isArray(events)||events.length>12||events.some(e=>!['DATA','NEED_MORE_INPUT','INVALID_BLOCK','FINISH'].includes(e)))throw Error('Ungültige Decoder-Ereignisse.');
  let state='READING',accepted=0;const trace=[];
  for(const event of events){
    const before=state;
    if(!['ERROR','DONE'].includes(state)){
      if(event==='INVALID_BLOCK')state=guard?'ERROR':'NEEDS_MORE_INPUT';
      else if(event==='NEED_MORE_INPUT')state='NEEDS_MORE_INPUT';
      else if(event==='FINISH')state='DONE';
      else {accepted++;state='READING';}
    }
    trace.push({event,before,after:state,accepted});
  }
  return {guard,state,accepted,trace,evidence:'FINITE_SYNTHETIC_STATE_MODEL',limit:'Kein Brotli-Datenstrom, keine Speicherbeschädigung, kein Nachweis einer nativen Decoderlücke.'};
}

export function accessDecision({authenticated='alice',loaded='bob',guard=true}={}){
  if(!['alice','bob'].includes(authenticated)||!['alice','bob'].includes(loaded)||typeof guard!=='boolean')throw Error('Nur die zwei synthetischen Subjekte sind zulässig.');
  const allowed=!guard||authenticated===loaded;
  return {authenticated,loaded,guard,allowed,identityMatched:authenticated===loaded,
    result:allowed?(authenticated===loaded?'OWN_OBJECT_ALLOWED':'CROSS_SUBJECT_ALLOWED_IN_DEFECTIVE_FIXTURE'):'CROSS_SUBJECT_REJECTED',
    evidence:'SYNTHETIC_AUTHORIZATION_FIXTURE',limit:'Feste In-Memory-Konten; keine fremden Sitzungen oder Daten.'};
}

export function simulateBudget({requests=100,capacity=8,refillPerSecond=2}={}){
  if(!Number.isInteger(requests)||requests<1||requests>500||!Number.isInteger(capacity)||capacity<1||capacity>30||!Number.isFinite(refillPerSecond)||refillPerSecond<0||refillPerSecond>10)throw Error('Budget außerhalb des endlichen Modellbereichs.');
  let units=capacity*1000,allowed=0;const trace=[];
  for(let i=0;i<requests;i++){
    if(i)units=Math.min(capacity*1000,units+refillPerSecond*50);
    const accepted=units>=1000;if(accepted){units-=1000;allowed++;}
    trace.push({atMs:i*50,accepted,remaining:units/1000});
  }
  return {requests,allowed,rejected:requests-allowed,capacity,refillPerSecond,trace,
    evidence:'DETERMINISTIC_TOKEN_BUDGET_MODEL',networkRequests:0,limit:'Simulierte Ereignisse im Abstand von 50 Modell-Millisekunden; keine Leistungs- oder DDoS-Messung.'};
}

export function triageText(text){
  if(typeof text!=='string'||text.length>32768)throw Error('Textanalyse akzeptiert höchstens 32768 Zeichen.');
  const rules=[['DYNAMIC_CODE_REFERENCE',/\b(?:eval|exec|Invoke-Expression)\s*\(/gi],['NETWORK_REFERENCE',/\b(?:https?:\/\/|fetch\s*\(|Invoke-WebRequest\b)/gi],['STARTUP_REFERENCE',/\b(?:schtasks|crontab|RunOnce)\b/gi]];
  const matches=[];
  for(const [rule,pattern] of rules)for(const match of text.matchAll(pattern))matches.push({rule,start:match.index,end:match.index+match[0].length,excerpt:match[0]});
  matches.sort((a,b)=>a.start-b.start||a.rule.localeCompare(b.rule));
  return {characters:text.length,matches,evidence:'STATIC_TEXT_PATTERN_OBSERVATION',
    verdict:'UNDETERMINED',limit:'Treffer können Dokumentation oder harmlose Beispiele sein. Keine Ausführung, kein Malware- oder Unbedenklichkeitsurteil.'};
}

export function localSuite(){
  return {schema:'halveth.security-workbench.browser.v1',catalog:CATALOG_VERSION,
    runtime:assessRuntime('24.18.0'),identity:inspectHost('0127.0.0.1'),
    decoder:{defective:decoderTrace({guard:false}),corrected:decoderTrace({guard:true})},
    authorization:{defective:accessDecision({guard:false}),corrected:accessDecision({guard:true})},
    budget:simulateBudget(),text:triageText('// Dokumentation: eval(example), keine Ausführung.'),
    networkRequests:0,claim:'LOCAL_MODELS_AND_BROWSER_PARSER_ONLY'};
}
