import {restoreWorld,ENGINE_VERSION} from './open-world.mjs';
import {buildScenario,SCENARIO_VERSION} from './scenarios.mjs';
import {parseJsonData,cloneJsonData} from './json-data.mjs';
import {sha256} from './sha256.mjs';
export const CHECKPOINT_SCHEMA='halveth.organism-checkpoint.v1';
export const CHECKPOINT_MAX_BYTES=16*1024*1024;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function checkedDescriptor(descriptor) {
  cloneJsonData(descriptor);
  if(!descriptor||descriptor.schema!==SCENARIO_VERSION||descriptor.engineVersion!==ENGINE_VERSION)throw new TypeError('Unsupported scenario recipe');
  const baseline=buildScenario(descriptor.name,descriptor.parameters);
  if(!same(baseline.descriptor,descriptor))throw new TypeError('Scenario descriptor fields or parameters differ');
  return baseline;
}
export function exportScenarioCheckpoint({world,descriptor}) {
  const baseline=checkedDescriptor(descriptor);
  const audit=world.audit();
  if(!audit.passed)throw new TypeError('Export requires a valid current model: '+audit.violations.join('; '));
  const snapshot=world.snapshot();checkRecipe(snapshot,baseline.world);
  const body={schema:CHECKPOINT_SCHEMA,engineVersion:ENGINE_VERSION,descriptor:cloneJsonData(descriptor),snapshot};
  const text=JSON.stringify({...body,envelopeSha256:sha256(JSON.stringify(body))});
  if(new TextEncoder().encode(text).length>CHECKPOINT_MAX_BYTES)throw new RangeError('Checkpoint exceeds the 16 MiB import budget');
  return text;
}
function checkRecipe(snapshot,baselineWorld) {
  const prefix=baselineWorld.events;
  if(!Array.isArray(snapshot?.events)||!same(snapshot.events.slice(0,prefix.length),prefix))throw new TypeError('Checkpoint does not begin with the bound scenario recipe');
  for(const event of snapshot.events.slice(prefix.length))if(['WORLD_CREATED','RESOURCE_DEFINED','ROUTE_DEFINED','CHANNEL_DEFINED','PROCESS_ATTACHED','RELATION'].includes(event.type))throw new TypeError('Checkpoint changes the bound model definition');
  for(const entity of snapshot.entities??[])if(!baselineWorld.entities.has(entity.id)) {
    if(entity.kind!=='custom'||Object.keys(entity.resources??{}).length||entity.sourceRef!=='USER_DECLARED_LOCAL_NODE')throw new TypeError('Unsupported added entity in checkpoint');
  }
}
export function restoreScenarioCheckpoint(text) {
  const input=parseJsonData(text,{maxBytes:CHECKPOINT_MAX_BYTES});
  const {envelopeSha256,...body}=input;
  if(input.schema!==CHECKPOINT_SCHEMA||input.engineVersion!==ENGINE_VERSION||typeof envelopeSha256!=='string'||sha256(JSON.stringify(body))!==envelopeSha256)throw new TypeError('Checkpoint envelope/version/digest mismatch');
  if(Object.keys(input).sort().join(',')!=='descriptor,engineVersion,envelopeSha256,schema,snapshot')throw new TypeError('Unexpected checkpoint envelope field');
  const baseline=checkedDescriptor(input.descriptor);
  // The UI may append empty custom nodes. Imported files cannot redefine routes,
  // callbacks, resources or nonempty inventories under a familiar scenario name.
  checkRecipe(input.snapshot,baseline.world);
  const world=restoreWorld(input.snapshot,{processes:baseline.world.processes});
  return {world,descriptor:baseline.descriptor};
}
