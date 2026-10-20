import {createHash} from 'node:crypto';
import {plainJson} from './plain-json.mjs';
const MAX_BYTES=8*1024*1024;
const sha=b=>createHash('sha256').update(b).digest('hex');
const utf8=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true});
export function makePacket(type,source,payload,dataClass='PUBLIC'){
 plainJson(source);plainJson(payload);
 const bytes=Buffer.from(JSON.stringify(payload),'utf8');if(bytes.length>MAX_BYTES)throw new Error('Packet exceeds byte limit');
 return {schema:'halveth.source-entry-packet.v1',version:'1.0.0',type,source,dataClass,mediaType:'application/json',encoding:'UTF-8',payloadByteLength:bytes.length,payloadSha256:sha(bytes),payloadBase64:bytes.toString('base64'),programsFromSourceExecuted:0,networkRequests:0,claimCeiling:'BOUND_SOURCE_DATA_ONLY'};
}
export function decodePacket(p){
 if(!p||Object.keys(p).sort().join('|')!=='claimCeiling|dataClass|encoding|mediaType|networkRequests|payloadBase64|payloadByteLength|payloadSha256|programsFromSourceExecuted|schema|source|type|version'||!p.source||Object.keys(p.source).sort().join('|')!=='commit|coverage|tree'||!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(p.source.commit)||!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(p.source.tree)||typeof p.source.coverage!=='string'||!p.source.coverage||!/^[A-Z][A-Z0-9_]{0,63}$/.test(p.type))throw new Error('Closed source packet fields required');
 if(!p||p.schema!=='halveth.source-entry-packet.v1'||p.version!=='1.0.0'||p.mediaType!=='application/json'||p.encoding!=='UTF-8'||p.programsFromSourceExecuted!==0||p.networkRequests!==0||p.claimCeiling!=='BOUND_SOURCE_DATA_ONLY'||!['PUBLIC','RESTRICTED_RAW'].includes(p.dataClass)||!Number.isSafeInteger(p.payloadByteLength)||p.payloadByteLength<0||p.payloadByteLength>MAX_BYTES||typeof p.payloadBase64!=='string'||p.payloadBase64.length>Math.ceil(MAX_BYTES/3)*4)throw new Error('Unsupported or unbound packet');
 const bytes=Buffer.from(p.payloadBase64,'base64');if(bytes.length!==p.payloadByteLength||bytes.toString('base64')!==p.payloadBase64||sha(bytes)!==p.payloadSha256)throw new Error('Packet byte binding changed');const text=utf8.decode(bytes),value=JSON.parse(text);plainJson(value);if(JSON.stringify(value)!==text)throw new Error('Canonical payload JSON required');return value;
}
export function formatPacket(p,format='json'){
 const payload=decodePacket(p),raw=JSON.stringify(p,null,2),text=JSON.stringify(payload,null,2);
 if(format==='json')return raw+'\n';
 if(format==='text')return `HALVETH source entry v1\nTYPE ${p.type}\nCOMMIT ${p.source.commit}\nPAYLOAD_SHA256 ${p.payloadSha256}\nDATA_CLASS ${p.dataClass}\n\n${text}\n`;
 if(format==='base64')return Buffer.from(JSON.stringify(p),'utf8').toString('base64')+'\n';
 if(format==='html'){
  const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; base-uri \'none\'; form-action \'none\'; object-src \'none\'"><title>HALVETH source entry</title><h1>HALVETH source entry</h1><p>'+esc(p.type+' · '+p.source.commit+' · '+p.dataClass)+'</p><p>Payload SHA-256: '+p.payloadSha256+'</p><pre>'+esc(text)+'</pre><details><summary>Exact transport packet</summary><pre>'+esc(raw)+'</pre></details></html>\n';
 }
 throw new Error('Unknown output format');
}
