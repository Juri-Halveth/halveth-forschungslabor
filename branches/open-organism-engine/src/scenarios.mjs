// Versioned, local process recipes. No callback is loaded from an imported file.
import {createWorld,ENGINE_VERSION} from './open-world.mjs';
import {buildCompartmentWorld} from './biology-world.mjs';
import {profileWorld} from './registry-data.mjs';
import {attachDemand,attachReceptor} from './operators.mjs';
import {cloneJsonData} from './json-data.mjs';
export const SCENARIO_VERSION='halveth.organism-scenarios.v1';
const names=new Set(['compartments','competition','profiles']);
const allowed=new Set(['tickMs','instanceId','maxEvents','profileCount']);
function parametersFor(name,input={}) {
  cloneJsonData(input);
  if(!input||Array.isArray(input)||typeof input!=='object')throw new TypeError('Scenario parameters must be an object');
  for(const key of Object.keys(input))if(!allowed.has(key))throw new TypeError('Unknown scenario parameter: '+key);
  if(name!=='profiles'&&Object.hasOwn(input,'profileCount'))throw new TypeError('profileCount belongs to the profiles scenario');
  const present=(key,fallback)=>Object.hasOwn(input,key)?input[key]:fallback;
  const result={tickMs:present('tickMs',50),instanceId:present('instanceId','instance:default'),maxEvents:present('maxEvents',100000)};
  if(!Number.isSafeInteger(result.tickMs)||result.tickMs<1||result.tickMs>1000)throw new RangeError('tickMs must be 1..1000 whole milliseconds');
  if(!Number.isSafeInteger(result.maxEvents)||result.maxEvents<100||result.maxEvents>300000)throw new RangeError('maxEvents must be 100..300000');
  if(typeof result.instanceId!=='string'||result.instanceId.length>120||!/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/.test(result.instanceId))throw new TypeError('Invalid instanceId');
  if(name==='profiles'){
    result.profileCount=present('profileCount',69);
    if(!Number.isSafeInteger(result.profileCount)||result.profileCount<1||result.profileCount>1000)throw new RangeError('Browser profileCount must be 1..1000');
  }
  return result;
}
export function syntheticRegistry(count) {
  if(!Number.isSafeInteger(count)||count<1||count>1000)throw new RangeError('Synthetic fixture budget is 1..1000');
  return {schema:'halveth.universe.v1',source:'SELF_CREATED_SYNTHETIC_FIXTURE',entities:Array.from({length:count},(_,i)=>({
    id:`profile-${String(i+1).padStart(4,'0')}`,label:`Perspektive ${i+1}`,role:'Synthetisches Datenprofil; kein externer Agent.'
  }))};
}
function competitionWorld(parameters) {
  const world=createWorld({worldId:'halveth:resource-competition',...parameters});
  world.defineResource({id:'reserve',unit:'MODEL_AMOUNT',description:'Conserved abstract inventory'});
  world.addEntity({id:'source',kind:'reservoir',label:'Gemeinsame Quelle',resources:{reserve:120},volume:12});
  for(const [id,label,weight,vmax] of [['a','Bedarf A',4,9],['b','Bedarf B',2,6],['c','Bedarf C',1,3]]) {
    world.addEntity({id,parentId:'source',kind:'claimant',label,resources:{reserve:0},dimensions:{weight},volume:2});
    world.addRoute({id:`source:${id}`,from:'source',to:id,resource:'reserve',vmax,km:0,sourceRef:'EXPLICIT_MODEL_PARAMETER'});
    world.addRoute({id:`${id}:source`,from:id,to:'source',resource:'reserve',vmax:1,km:.1,sourceRef:'EXPLICIT_RETURN_ROUTE'});
    attachDemand(world,{id:`demand:${id}`,entityId:'source',routeId:`source:${id}`,targetId:id,resource:'reserve',goal:40,weight});
    attachDemand(world,{id:`return:${id}`,entityId:id,routeId:`${id}:source`,targetId:'source',resource:'reserve',goal:120,weight:1});
    world.addChannel({id:`pulse:${id}`,from:id,to:'source',signal:'DEMAND_STATE',delayTicks:id==='a'?1:3});
    world.addProcess({id:`pulse-process:${id}`,entityId:id,everyTicks:20,description:'Declared periodic feedback, not learned behaviour',
      behaviorId:'halveth:competition-pulse:1',parameters:{channelId:`pulse:${id}`,id},
      run:ctx=>ctx.emit({channelId:`pulse:${id}`,payload:{reserve:ctx.read(id).resources.reserve},evidence:'ABSTRACT_SIGNAL'})});
  }
  attachReceptor(world,{id:'source:receptor',entityId:'source',signal:'DEMAND_STATE',dimension:'feedback',gain:.05,decay:.99});
  return world;
}
export function buildScenario(name='compartments',input={}) {
  if(!names.has(name))throw new TypeError('Unknown scenario');
  const parameters=parametersFor(name,input);
  const world=name==='compartments'?buildCompartmentWorld(parameters):name==='competition'?competitionWorld(parameters):profileWorld(syntheticRegistry(parameters.profileCount),parameters);
  const descriptor={schema:SCENARIO_VERSION,engineVersion:ENGINE_VERSION,name,parameters};
  return {world,descriptor};
}
