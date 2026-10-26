import {ENGINE_VERSION} from './open-world.mjs';
import {buildScenario} from './scenarios.mjs';
import {exportScenarioCheckpoint,restoreScenarioCheckpoint} from './checkpoint.mjs';
import {cloneJsonData} from './json-data.mjs';
const own=(o,k)=>Object.hasOwn(o,k);
const amountView=world=>Object.fromEntries([...world.entities].map(([id,entity])=>[id,{...entity.resources}]));
const transfersFrom=events=>events.filter(event=>event.type==='RESOURCE_TRANSFER').map(event=>({
  sequence:event.sequence,modelMs:event.modelMs,from:event.actor,...event.details
}));
function fields(value,allowed,label) {
  cloneJsonData(value);
  if(value===null||Array.isArray(value)||typeof value!=='object')throw new TypeError(label+' must be an object');
  for(const key of Object.keys(value))if(!allowed.includes(key))throw new TypeError(label+': unknown field '+key);
}
function uniqueInstance() {return 'session:'+globalThis.crypto.randomUUID();}
const freshRuntime=()=>({observedWallMs:0,gapMs:0,maxIntervalMs:0,pendingTickMs:0,lastRejectedIntervalMs:null,mode:'FIXED_TICKS_WITH_BOUNDED_CATCHUP',catchupLimitTicks:5});
export class ModelController {
  constructor({scenario='compartments',parameters={},instanceFactory=uniqueInstance}={}) {
    fields(parameters,['tickMs','instanceId','maxEvents','profileCount'],'Scenario parameters');
    this.instanceFactory=instanceFactory;
    this.current=buildScenario(scenario,{...parameters,instanceId:own(parameters,'instanceId')?parameters.instanceId:instanceFactory()});
    this.generation=1;this.revision=0;this.running=false;this.lastAudit=null;
    this.runtime=freshRuntime();
    this.wallRemainderMs=0;this.resetBalance();
  }
  get world(){return this.current.world;}
  resetBalance(){const state=amountView(this.world);this.balance={fromTick:this.world.tick,toTick:this.world.tick,before:state,after:structuredClone(state),transfers:[]};}
  step(ticks,{gapMs=0}={}) {
    if(!Number.isSafeInteger(ticks)||ticks<1||ticks>100)throw new RangeError('ticks must be 1..100');
    const before=amountView(this.world),fromTick=this.world.tick,fromEvent=this.world.events.length;
    if(gapMs===0)this.world.advance(ticks*this.world.tickMs);
    else this.world.advanceWithGap(ticks*this.world.tickMs,gapMs);
    this.balance={fromTick,toTick:this.world.tick,before,after:amountView(this.world),transfers:transfersFrom(this.world.events.slice(fromEvent))};
    this.revision++;
  }
  advanceRuntime(elapsedMs) {
    if(typeof elapsedMs!=='number'||!Number.isFinite(elapsedMs)||elapsedMs<0||elapsedMs>86400000)throw new RangeError('Invalid scheduler interval');
    if(!this.running)return false;
    this.runtime.observedWallMs+=elapsedMs;this.runtime.maxIntervalMs=Math.max(this.runtime.maxIntervalMs,elapsedMs);
    const tickMs=this.world.tickMs,total=this.wallRemainderMs+elapsedMs;
    const wanted=Math.floor(total/tickMs),ticks=Math.min(wanted,this.runtime.catchupLimitTicks);
    // Model time is only the ticks actually executed. Delays beyond the bounded
    // catch-up window are retained explicitly, never invented as completed work.
    const skipped=Math.max(0,wanted-ticks)*tickMs;
    try{
      if(ticks)this.step(ticks,{gapMs:skipped});
      else if(skipped)this.world.gap(skipped);
    }catch(error){this.runtime.lastRejectedIntervalMs=elapsedMs;throw error;}
    this.wallRemainderMs=total-wanted*tickMs;
    this.runtime.pendingTickMs=this.wallRemainderMs;
    this.runtime.gapMs+=skipped;
    return ticks>0||skipped>0;
  }
  projection() {
    const world=this.world,items=world.events.slice(-180),totals=Object.fromEntries([...world.resources.keys()].map(id=>[id,0]));
    for(const entity of world.entities.values())for(const [id,amount]of Object.entries(entity.resources))totals[id]+=amount;
    const auditStale=this.lastAudit!==null&&this.lastAudit.head!==world.head;
    return structuredClone({generation:this.generation,revision:this.revision,running:this.running,scenario:this.current.descriptor.name,engineVersion:ENGINE_VERSION,
      world:{worldId:world.worldId,instanceId:world.instanceId,tick:world.tick,modelMs:world.timeMs,remainderMs:world.remainderMs,gapMs:world.undocumentedGapMs,
        sequence:world.sequence,head:world.head,entityCount:world.entities.size,routeCount:world.routes.size,processCount:world.processes.size,
        eventCount:world.events.length,maxEvents:world.maxEvents,pendingSignals:world.signalTransit.length,counters:{...world.counters}},
      entities:[...world.entities.values()],routes:[...world.routes.values()],channels:[...world.channels.values()],
      resources:[...world.resources.values()].map(resource=>({...resource,total:totals[resource.id],initial:world.initialSupply.get(resource.id),error:totals[resource.id]-world.initialSupply.get(resource.id)})),
      events:{totalCount:world.events.length,fromSequence:items[0]?.sequence??0,toSequence:items.at(-1)?.sequence??0,omittedBefore:world.events.length-items.length,items},
      transfers:transfersFrom(items),balance:this.balance,audit:this.lastAudit,auditStale,runtime:this.runtime});
  }
  dispatch(message) {
    const id=Number.isSafeInteger(message?.id)&&message.id>0?message.id:null;
    try{
      fields(message,['id','type','payload'],'Command');
      if(id===null||typeof message.type!=='string')throw new TypeError('Positive safe command id and type required');
      const payload=own(message,'payload')?message.payload:{};let text;
      switch(message.type){
        case 'RESET': {
          fields(payload,['scenario','parameters'],'RESET');
          const parameters=own(payload,'parameters')?payload.parameters:{};fields(parameters,['tickMs','instanceId','maxEvents','profileCount'],'Scenario parameters');
          const candidate=buildScenario(own(payload,'scenario')?payload.scenario:'compartments',{...parameters,instanceId:own(parameters,'instanceId')?parameters.instanceId:this.instanceFactory()});
          this.current=candidate;this.generation++;this.running=false;this.lastAudit=null;this.wallRemainderMs=0;
          this.runtime=freshRuntime();this.resetBalance();break;
        }
        case 'STEP':fields(payload,['ticks'],'STEP');if(this.running)throw new Error('Pause the worker before stepping');this.step(own(payload,'ticks')?payload.ticks:1);break;
        case 'START':fields(payload,[],'START');this.running=true;break;
        case 'PAUSE':fields(payload,[],'PAUSE');this.running=false;break;
        case 'AUDIT':fields(payload,[],'AUDIT');this.lastAudit={...this.world.audit(),checkedAtModelMs:this.world.timeMs};break;
        case 'EXPORT':fields(payload,[],'EXPORT');text=exportScenarioCheckpoint(this.current);this.lastAudit={...this.world.audit(),checkedAtModelMs:this.world.timeMs};break;
        case 'RESTORE':{
          fields(payload,['text'],'RESTORE');const candidate=restoreScenarioCheckpoint(payload.text);
          this.current=candidate;this.generation++;this.running=false;this.lastAudit=null;this.wallRemainderMs=0;
          this.runtime=freshRuntime();this.resetBalance();break;
        }
        case 'GAP':fields(payload,['deltaMs'],'GAP');this.world.gap(payload.deltaMs);break;
        case 'ADD_ENTITY':{
          fields(payload,['id','label','parentId','kind'],'ADD_ENTITY');
          if(payload.kind!==undefined&&payload.kind!=='custom')throw new TypeError('Only custom nodes can be added in the browser');
          if(typeof payload.label!=='string'||payload.label.length>160)throw new TypeError('Node label must be at most 160 characters');
          this.world.addEntity({id:payload.id,label:payload.label,parentId:payload.parentId??null,kind:'custom',sourceRef:'USER_DECLARED_LOCAL_NODE'});break;
        }
        default:throw new TypeError('Unknown command');
      }
      this.revision++;
      return {id,type:'RESULT',action:message.type,projection:this.projection(),...(text===undefined?{}:{text}),...(message.type==='AUDIT'?{audit:this.lastAudit}:{})};
    }catch(error){return {id,type:'ERROR',message:error.message,projection:this.projection()};}
  }
}
