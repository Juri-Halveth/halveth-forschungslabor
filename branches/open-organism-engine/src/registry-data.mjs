// Registry text is parsed as bounded data. JavaScript source is never evaluated.
import {createWorld} from './open-world.mjs';
import {parseJsonData,cloneJsonData} from './json-data.mjs';
import {sha256} from './sha256.mjs';
export const REGISTRY_MAX_BYTES=4*1024*1024;
const PROFILE_ID=/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/;
export function validateRegistry(registry) {
  cloneJsonData(registry);
  if(registry?.schema!=='halveth.universe.v1'||!Array.isArray(registry.entities)||registry.entities.length<1||registry.entities.length>20000)throw new TypeError('Registry schema or declared profile budget');
  const seen=new Set(['origin']);
  for(const entry of registry.entities) {
    if(!entry||typeof entry!=='object'||Array.isArray(entry)||typeof entry.id!=='string'||entry.id.length>120||!PROFILE_ID.test(entry.id)||seen.has(entry.id)||typeof entry.role!=='string')throw new TypeError('Invalid or duplicate profile');
    if(entry.label!==undefined&&typeof entry.label!=='string')throw new TypeError('Profile label must be text');
    seen.add(entry.id);
  }
  return registry;
}
export function parseRegistryText(text) {
  if(typeof text!=='string'||text.length>REGISTRY_MAX_BYTES||new TextEncoder().encode(text).length>REGISTRY_MAX_BYTES)throw new RangeError('Registry text exceeds 4 MiB');
  const framingTrim=value=>value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
  let body=framingTrim(text);const prefix='window.HalvethUniverse =';
  const sourceKind=body.startsWith(prefix)?'STATIC_ASSIGNMENT_WRAPPER':'PLAIN_JSON';
  if(sourceKind==='STATIC_ASSIGNMENT_WRAPPER'){body=framingTrim(body.slice(prefix.length));if(body.endsWith(';'))body=framingTrim(body.slice(0,-1));}
  const registry=validateRegistry(parseJsonData(body,{maxBytes:REGISTRY_MAX_BYTES}));
  return {registry,receipt:{schema:'halveth.registry-data-receipt.v1',sourceKind,framing:'ASCII_JSON_WHITESPACE_AND_OPTIONAL_ONE_WRAPPER_SEMICOLON',utf8Bytes:new TextEncoder().encode(text).length,sha256:sha256(text),profiles:registry.entities.length,execution:'DATA_ONLY_NO_EVAL',rights:'SOURCE_RIGHTS_REMAIN_ATTACHED'}};
}
export function profileWorld(registry,{tickMs=50,instanceId='instance:default',maxEvents=300000,sourceReceipt=null}={}) {
  validateRegistry(registry);
  const world=createWorld({worldId:'halveth:public-perspectives',tickMs,instanceId,maxEntities:50000,maxEvents});
  world.defineResource({id:'attention',unit:'ABSTRACT_MODEL_AMOUNT',description:'Simulated processing budget, not cognition'});
  const metadata=Object.fromEntries(Object.entries(registry).filter(([key])=>key!=='entities'));
  world.addEntity({id:'origin',kind:'project_source',label:'Registerquelle',resources:{attention:0},sourceRef:sourceReceipt,
    dimensions:{registryMetadata:metadata,sourceReceipt,rights:'INPUT_DATA_RETAINS_ITS_OWN_RIGHTS'}});
  for(const profile of registry.entities)world.addEntity({id:profile.id,kind:'project_perspective',label:profile.label??profile.id,role:profile.role,parentId:'origin',
    sourceRef:profile.profilePath??sourceReceipt,resources:{attention:1},dimensions:{profileRecord:profile,registrySchema:registry.schema}});
  const ids=registry.entities.map(p=>p.id);
  for(let i=0;i<ids.length;i++) {
    const from=ids[i],to=ids[(i+1)%ids.length],channelId=`relation:${i}`;
    world.addChannel({id:channelId,from,to,signal:'PROFILE_TRACE',delayTicks:1+i%5,sourceRef:'DESIGNED_ROUTING'});
    world.addProcess({id:`process:${i}`,entityId:from,everyTicks:100+(i%11)*5,description:'Deterministic model trace; no external AI agent',
      behaviorId:'halveth:profile-trace:1',parameters:{channelId,from},
      run:ctx=>ctx.emit({channelId,payload:{profile:from,revision:ctx.read(from).revision},evidence:'DESIGN_SIGNAL'})});
  }
  return world;
}
