/** HALVETH Open Organism Engine: deterministic, extensible local model.
 * Model units only; no biomedical prediction, independent-agent or sentience claim.
 * v0.2: atomic calls, an integer-microsecond clock and source-bound local restore.
 */
import {sha256} from './sha256.mjs';

export const ENGINE_VERSION='0.2.0';
const SCHEMA='halveth.open-organism.v2', EVENT_SCHEMA='halveth.open-organism.event.v2';
const ID=/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/, ZERO='0'.repeat(64);
const clone=x=>structuredClone(x);
const own=(o,k)=>Object.hasOwn(o,k);
const amountOf=(store,key)=>own(store,key)?store[key]:0;
const finite=(x,name,min=0)=>{
  if(typeof x!=='number'||!Number.isFinite(x)||x<min)throw new TypeError(name+': finite number >= '+min+' required');
  return x;
};
const integer=(x,name,min=0)=>{
  if(!Number.isSafeInteger(x)||x<min)throw new TypeError(name+': safe integer >= '+min+' required');
  return x;
};
const validId=(x,name='id')=>{
  if(typeof x!=='string'||x.length>120||!ID.test(x))throw new TypeError('invalid '+name);
  return x;
};
const text=(x,name)=>{
  if(typeof x!=='string'||!x.isWellFormed())throw new TypeError(name+': well-formed string required');
  return x;
};
const signalName=x=>{
  if(typeof x!=='string'||!/^[A-Za-z][A-Za-z0-9_]{0,99}$/.test(x))throw new TypeError('invalid signal');
  return x;
};
/** Closed JSON data: no accessors, sparse arrays, symbols, exotic prototypes or cycles.
 * Validation precedes mutation. JSON serialization is the declared data equality.
 */
function json(value,name='data',seen=new Set()){
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='string'){text(value,name);return value;}
  if(typeof value==='number'){if(!Number.isFinite(value))throw new TypeError(name+': nonfinite JSON number');return value;}
  if(typeof value!=='object'||seen.has(value))throw new TypeError(name+': closed plain JSON required');
  const array=Array.isArray(value),proto=Object.getPrototypeOf(value);
  if(!array&&proto!==Object.prototype&&proto!==null)throw new TypeError(name+': plain JSON object required');
  const keys=Reflect.ownKeys(value);
  if(keys.some(k=>typeof k!=='string'))throw new TypeError(name+': symbol key');
  if(array&&keys.length!==value.length+1)throw new TypeError(name+': dense JSON array required');
  seen.add(value);
  for(const key of keys){
    if(array&&key==='length')continue;
    const descriptor=Object.getOwnPropertyDescriptor(value,key);
    if(!descriptor.enumerable||!own(descriptor,'value'))throw new TypeError(name+': JSON data property required');
    if(array&&(!/^(0|[1-9][0-9]*)$/.test(key)||Number(key)>=value.length))throw new TypeError(name+': array property');
    text(key,name+' key');json(descriptor.value,name+'.'+key,seen);
  }
  seen.delete(value);
  return value;
}
const copyJSON=(value,name)=>JSON.parse(JSON.stringify(json(value,name)));
const objectJSON=(value,name)=>{
  json(value,name);if(value===null||typeof value!=='object'||Array.isArray(value))throw new TypeError(name+': object required');
  return copyJSON(value,name);
};
function canonical(value){
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
}
const equal=(a,b)=>canonical(a)===canonical(b);
const finiteAdd=(a,b,name)=>finite(a+b,name);
const safeAdd=(a,b,name)=>integer(a+b,name);
function freezeJSON(value){
  if(value&&typeof value==='object'){for(const child of Object.values(value))freezeJSON(child);Object.freeze(value);}
  return value;
}
function micros(ms,name){
  finite(ms,name);const product=ms*1000,candidates=[...new Set([Math.floor(product),Math.ceil(product)])];
  const matches=candidates.filter(us=>Number.isSafeInteger(us)&&us/1000===ms);
  if(matches.length!==1)throw new TypeError(name+': exact whole microseconds required; no rounding');
  const us=matches[0];
  if((us>0&&(us-1)/1000===ms)||(Number.isSafeInteger(us+1)&&(us+1)/1000===ms))throw new TypeError(name+': ambiguous microsecond representation');
  return us;
}
function processRecord({id,entityId,everyTicks=1,run,description='',sourceRef=null,behaviorId=null,parameters={}}={}){
  validId(id);validId(entityId,'process entity');integer(everyTicks,'everyTicks',1);
  if(typeof run!=='function'||Object.prototype.toString.call(run)!=='[object Function]')throw new TypeError('synchronous process function required');
  text(description,'process description');
  if(behaviorId!==null)validId(behaviorId,'behaviorId');
  return {id,entityId,everyTicks,run,description,sourceRef:copyJSON(sourceRef,'sourceRef'),
    behaviorId,parameters:objectJSON(parameters,'process parameters'),runSha256:sha256(Function.prototype.toString.call(run))};
}
function descriptor(p){
  const {id,entityId,everyTicks,description,sourceRef,behaviorId,parameters}=p;
  return {id,entityId,everyTicks,description,sourceRef:copyJSON(sourceRef),behaviorId,
    parameters:copyJSON(parameters),runSha256:sha256(Function.prototype.toString.call(p.run))};
}
/** Capacity is bounded by source stock before multiplication can overflow.
 * The logarithmic fallback is only used when the direct product is nonfinite.
 */
function capacity(route,stock,volume,dt){
  if(stock===0||route.vmax===0)return 0;
  let saturation=1,logSaturation=0;
  if(route.km>0){
    const concentration=stock/volume,d=Math.log(route.km)+Math.log(volume)-Math.log(stock);
    logSaturation=d>0?-d-Math.log1p(Math.exp(-d)):-Math.log1p(Math.exp(d));
    if(concentration>0&&Number.isFinite(concentration)&&Number.isFinite(route.km+concentration)){
      saturation=concentration/(route.km+concentration);
    }else {
      saturation=Math.exp(logSaturation);
    }
  }
  let result=route.vmax*(dt/1000)*saturation;
  if(!Number.isFinite(result)||result===0){
    const log=Math.log(route.vmax)+Math.log(dt/1000)+logSaturation;
    result=log>=Math.log(stock)?stock:Math.exp(log);
  }
  return Math.min(stock,finite(result,'route capacity'));
}
/** Demand-weighted progressive filling with simultaneous source and route caps.
 * Common weight scaling cancels before multiplication. A saturated route leaves
 * the active set and its unused source share is redistributed in the next round.
 */
function allocate(items,stock,caps){
  const candidates=items.map(({request,route})=>({request,route,
    remaining:Math.min(request.amount,caps.get(route.id)),allocation:0}));
  const remainingCaps=new Map(caps);let budget=stock;
  const active=()=>candidates.filter(c=>c.remaining>0&&remainingCaps.get(c.route.id)>0);
  const limit=candidates.length+caps.size+4;
  for(let round=0;budget>0&&round<limit;round++){
    const list=active();if(!list.length)break;
    const products=list.map(c=>c.request.weight*c.remaining);
    const maxProduct=products.reduce((a,b)=>Math.max(a,b),0);
    let weights;
    if(Number.isFinite(maxProduct)&&maxProduct>0)weights=products.map(x=>x/maxProduct);
    else {
      const logs=list.map(c=>Math.log(c.request.weight)+Math.log(c.remaining)),max=logs.reduce((a,b)=>Math.max(a,b),-Infinity);
      weights=logs.map(x=>Math.exp(x-max));
    }
    const total=weights.reduce((a,b)=>a+b,0);
    const proposals=list.map((c,i)=>budget*(weights[i]/total));
    let scale=1;const routeProposals=new Map();
    list.forEach((c,i)=>{
      const proposed=proposals[i];
      if(proposed>c.remaining)scale=Math.min(scale,c.remaining/proposed);
      routeProposals.set(c.route.id,Math.min(budget,(routeProposals.get(c.route.id)??0)+proposed));
    });
    for(const [routeId,proposed] of routeProposals)if(proposed>remainingCaps.get(routeId))scale=Math.min(scale,remainingCaps.get(routeId)/proposed);
    let changed=false;
    list.forEach((c,i)=>{
      const amount=Math.min(c.remaining,remainingCaps.get(c.route.id),budget,proposals[i]*scale);
      if(amount<=0)return;
      c.allocation=finiteAdd(c.allocation,amount,'allocation');c.remaining=Math.max(0,c.remaining-amount);
      remainingCaps.set(c.route.id,Math.max(0,remainingCaps.get(c.route.id)-amount));
      budget=Math.max(0,budget-amount);changed=true;
    });
    if(!changed)break;
  }
  // Only floating-point residuals reach this deterministic, bounded final pass.
  // No epsilon erases valid small stocks or weights.
  for(const c of active()){
    if(budget<=0)break;
    const amount=Math.min(c.remaining,remainingCaps.get(c.route.id),budget);
    c.allocation=finiteAdd(c.allocation,amount,'residual allocation');c.remaining-=amount;
    remainingCaps.set(c.route.id,remainingCaps.get(c.route.id)-amount);budget-=amount;
  }
  // Roundoff must never exceed a declared demand or a shared cap. This pass
  // only reduces an already feasible allocation by representational residues.
  let finalStock=stock;const finalCaps=new Map(caps);
  for(const c of candidates){
    c.allocation=Math.min(c.allocation,c.request.amount,finalStock,finalCaps.get(c.route.id));
    finalStock-=c.allocation;finalCaps.set(c.route.id,finalCaps.get(c.route.id)-c.allocation);
  }
  return candidates;
}

export class OpenWorld{
  constructor({worldId='halveth:open-world',instanceId,tickMs=50,maxEvents=100000,maxPending=10000,maxInbox=1024,maxEntities=20000}={}){
    validId(worldId,'worldId');const defaultInstance=instanceId===undefined;instanceId??='instance:default';validId(instanceId,'instanceId');
    integer(tickMs,'tickMs',1);integer(tickMs*1000,'tick microseconds',1);
    for(const [key,value]of Object.entries({maxEvents,maxPending,maxInbox,maxEntities}))integer(value,key,1);
    Object.assign(this,{worldId,instanceId,tickMs,maxEvents,maxPending,maxInbox,maxEntities});
    this._config={worldId,instanceId,tickMs,maxEvents,maxPending,maxInbox,maxEntities};
    this._contracts={
      clock:{unit:'MICROSECOND',tickMs:'SAFE_INTEGER_MILLISECONDS',advance:'EXACT_WHOLE_MICROSECONDS_NO_ROUNDING',representation:'UNIQUE_SAFE_INTEGER_US_WITH_US_DIV_1000_EQUAL_INPUT_MS'},
      instance:{defaultUsed:defaultInstance,claim:defaultInstance?'DETERMINISTIC_NAMESPACE_NOT_HISTORICAL_INCARNATION':'CALLER_DECLARED_NAMESPACE_NOT_EXTERNALLY_VERIFIED'},
      restore:{callbacks:'TRUSTED_EXISTING_DESCRIPTORS_ONLY',closureState:'NOT_SERIALIZED_OR_PROVEN'},
      transactions:{journal:'COMMITTED_MODEL_EVENTS_ONLY',rollback:'MODEL_STATE_AND_JOURNAL_ONLY',ambientCallbackEffects:'NOT_ROLLED_BACK'}
    };
    this.timeMs=0;this.tick=0;this.remainderUs=0;this.undocumentedGapUs=0;
    this.sequence=0;this.head=ZERO;this.requestSeq=0;this.messageSeq=0;
    this.entities=new Map();this.resources=new Map();this.routes=new Map();this.channels=new Map();
    this.processes=new Map();this.pending=[];this.signalTransit=[];this.inboxes=new Map();this.events=[];this.links=[];this.initialSupply=new Map();
    this.counters={requested:0,flows:0,signalsEmitted:0,signalsArrived:0,signalsDropped:0,unserved:0};
    this._busy=false;this._transaction=false;this._readState=null;
    this._record('WORLD_CREATED',worldId,{config:this._config,contracts:this._contracts,version:ENGINE_VERSION});
  }
  get remainderMs(){return this.remainderUs/1000;}
  get undocumentedGapMs(){return this.undocumentedGapUs/1000;}
  _liveConfig(){return Object.fromEntries(Object.keys(this._config).map(k=>[k,this[k]]));}
  _capture(shallow=false){
    const payload={config:this._liveConfig(),contracts:this._contracts,timeMs:this.timeMs,tick:this.tick,remainderUs:this.remainderUs,
      undocumentedGapUs:this.undocumentedGapUs,sequence:this.sequence,head:this.head,requestSeq:this.requestSeq,messageSeq:this.messageSeq,
      entities:this.entities,resources:this.resources,routes:this.routes,channels:this.channels,pending:this.pending,signalTransit:this.signalTransit,
      inboxes:this.inboxes,links:this.links,initialSupply:this.initialSupply,counters:this.counters};
    const data=shallow?{...payload,config:{...payload.config},contracts:clone(payload.contracts),entities:new Map(this.entities),
      resources:new Map(this.resources),routes:new Map(this.routes),channels:new Map(this.channels),inboxes:new Map(this.inboxes),
      pending:this.pending.slice(),signalTransit:this.signalTransit.slice(),links:this.links.slice(),initialSupply:new Map(this.initialSupply),counters:{...this.counters}}:clone(payload);
    const processes=shallow?new Map(this.processes):new Map([...this.processes].map(([id,p])=>{const {run,...data}=p;return [id,{...clone(data),run}];}));
    return {data,events:this.events.slice(),processes};
  }
  _restore(capture){
    const {config,contracts,...data}=capture.data;Object.assign(this,config,data);
    this._contracts=contracts;this.events=capture.events;this.processes=capture.processes;
  }
  _mutate(operation,shallow=false){
    if(this._transaction)return operation();
    const before=this._capture(shallow);this._transaction=true;
    try{return operation();}catch(error){this._restore(before);throw error;}
    finally{this._transaction=false;}
  }
  _append(operation){return this._mutate(operation,true);}
  _definition(){if(this._busy)throw new Error('world definitions cannot change during advance');}
  _room(){if(this.events.length>=this.maxEvents)throw new RangeError('event log full; export a checkpoint/archive before continuing');}
  _record(type,actor,details={}){
    this._room();text(type,'event type');text(actor,'event actor');details=copyJSON(details,'event details');
    const sequence=safeAdd(this.sequence,1,'event sequence');
    const base={schema:EVENT_SCHEMA,worldId:this.worldId,instanceId:this.instanceId,
      eventId:'event:'+sha256(JSON.stringify([this.worldId,this.instanceId,sequence])),
      sequence,tick:this.tick,modelMs:this.timeMs,type,actor,details,previousHash:this.head};
    const event=freezeJSON({...base,hash:sha256(JSON.stringify(base))});
    this.sequence=sequence;this.head=event.hash;this.events.push(event);return clone(event);
  }
  record(type,actor,details={}){return this._append(()=>this._record(type,actor,details));}
  defineResource({id,unit='MODEL_AMOUNT',description='',kind='model'}={}){
    return this._append(()=>{
      this._definition();validId(id);if(this.resources.has(id))throw new TypeError('duplicate resource');
      const resource={id,unit:text(unit,'unit'),description:text(description,'description'),kind:text(kind,'kind')};this._room();
      this.resources.set(id,resource);this.initialSupply.set(id,0);this._record('RESOURCE_DEFINED',id,resource);return id;
    });
  }
  addEntity({id,kind='entity',parentId=null,label=id,role='',resources={},volume=1,dimensions={},sourceRef=null,origin=null}={}){
    return this._append(()=>{
      this._definition();validId(id);if(this.entities.has(id))throw new TypeError('duplicate entity '+id);
      if(this.entities.size>=this.maxEntities)throw new RangeError('entity budget exhausted');
      if(parentId!==null&&!this.entities.has(parentId))throw new TypeError('missing parent');
      finite(volume,'volume');if(volume===0)throw new TypeError('positive volume required');
      const store=objectJSON(resources,'resources'),totals=new Map(this.initialSupply);
      for(const [resource,amount]of Object.entries(store)){
        if(!this.resources.has(resource))throw new TypeError('unknown resource '+resource);
        finite(amount,'resources.'+resource);totals.set(resource,finiteAdd(totals.get(resource),amount,'initial supply '+resource));
      }
      const entity={id,kind:text(kind,'kind'),label:text(label,'label'),role:text(role,'role'),parentId,
        origin:copyJSON(origin??id,'origin'),volume,dimensions:objectJSON(dimensions,'dimensions'),resources:store,
        sourceRef:copyJSON(sourceRef,'sourceRef'),revision:0,bornMs:this.timeMs};
      this._room();this.entities.set(id,entity);this.inboxes.set(id,[]);this.initialSupply=totals;
      this._record('ENTITY_BORN',id,entity);return id;
    });
  }
  relate({from,to,kind,sourceRef=null,description=''}={}){
    return this._append(()=>{
      this._definition();if(!this.entities.has(from)||!this.entities.has(to))throw new TypeError('unknown relation endpoint');
      validId(kind,'relation kind');const link={from,to,kind,sourceRef:copyJSON(sourceRef,'sourceRef'),description:text(description,'description')};
      this._room();this.links.push(link);this._record('RELATION',from,link);return clone(link);
    });
  }
  addRoute({id,from,to,resource,vmax,km=0,sourceRef=null,note=''}={}){
    return this._append(()=>{
      this._definition();validId(id);if(this.routes.has(id))throw new TypeError('duplicate route');
      if(!this.entities.has(from)||!this.entities.has(to)||from===to)throw new TypeError('invalid route endpoint');
      if(!this.resources.has(resource))throw new TypeError('undefined resource');finite(vmax,'vmax');finite(km,'km');
      const route={id,from,to,resource,vmax,km,sourceRef:copyJSON(sourceRef,'sourceRef'),note:text(note,'note')};
      this._room();this.routes.set(id,route);this._record('ROUTE_DEFINED',id,route);return id;
    });
  }
  addChannel({id,from,to,signal,delayTicks=1,sourceRef=null}={}){
    return this._append(()=>{
      this._definition();validId(id);signalName(signal);if(this.channels.has(id))throw new TypeError('duplicate channel');
      if(!this.entities.has(from)||!this.entities.has(to))throw new TypeError('invalid channel endpoint');integer(delayTicks,'delayTicks',1);
      const channel={id,from,to,signal,delayTicks,sourceRef:copyJSON(sourceRef,'sourceRef')};
      this._room();this.channels.set(id,channel);this._record('CHANNEL_DEFINED',id,channel);return id;
    });
  }
  addProcess(input={}){
    return this._append(()=>{
      this._definition();const p=processRecord(input);
      if(this.processes.has(p.id))throw new TypeError('duplicate process');if(!this.entities.has(p.entityId))throw new TypeError('missing process entity');
      this._room();this.processes.set(p.id,p);this._record('PROCESS_ATTACHED',p.id,descriptor(p));return p.id;
    });
  }
  request({routeId,amount,weight=1,reason='',evidence=null}={}){
    return this._append(()=>{
      const route=this.routes.get(routeId);if(!route)throw new TypeError('unknown route');
      finite(amount,'request.amount');finite(weight,'request.weight');if(weight===0)throw new TypeError('positive request weight required');
      if(this.pending.length>=this.maxPending)throw new RangeError('request queue full');
      const id=safeAdd(this.requestSeq,1,'request ID'),request={id,routeId,amount,weight,reason:text(reason,'reason'),evidence:copyJSON(evidence,'evidence')};
      this._room();this.pending.push(request);this.requestSeq=id;this.counters.requested++;
      this._record('RESOURCE_REQUEST',route.from,{...request,intentId:id});return id;
    });
  }
  emit({channelId,payload=null,evidence=null}={}){
    return this._append(()=>{
      const channel=this.channels.get(channelId);if(!channel)throw new TypeError('unknown channel');
      payload=copyJSON(payload,'signal payload');evidence=copyJSON(evidence,'evidence');
      if(JSON.stringify(payload).length>4096)throw new RangeError('signal payload too large');
      this._room();
      if(this.signalTransit.length>=this.maxPending){this.counters.signalsDropped++;this._record('SIGNAL_CAPACITY',channel.from,{channelId});return null;}
      const id=safeAdd(this.messageSeq,1,'message ID'),arriveTick=safeAdd(this.tick,channel.delayTicks,'arrival tick');
      const message={id,channelId,signal:channel.signal,from:channel.from,to:channel.to,emittedAt:this.timeMs,arriveTick,payload,evidence};
      this.signalTransit.push(message);this.messageSeq=id;this.counters.signalsEmitted++;this._record('SIGNAL_EMIT',channel.from,message);return id;
    });
  }
  observe(id){const e=this.entities.get(id);if(!e)throw new TypeError('unknown entity');return clone(e);}
  inbox(id){if(!this.inboxes.has(id))throw new TypeError('unknown inbox');return clone(this.inboxes.get(id));}
  clearInbox(id,{signal}={}){
    return this._append(()=>{
      if(!this.inboxes.has(id))throw new TypeError('unknown inbox');if(signal!==undefined)signalName(signal);
      const current=this.inboxes.get(id),items=signal===undefined?current:current.filter(m=>m.signal===signal);
      if(items.length){
        this._room();this.inboxes.set(id,signal===undefined?[]:current.filter(m=>m.signal!==signal));
        this._record('INBOX_READ',id,{count:items.length,ids:items.map(m=>m.id),signal:signal??null});
      }
      return clone(items);
    });
  }
  setDimension(id,key,value,sourceRef=null){
    return this._mutate(()=>{
      const e=this.entities.get(id);if(!e)throw new TypeError('missing entity');validId(key,'dimension key');
      value=copyJSON(value,'dimension');sourceRef=copyJSON(sourceRef,'sourceRef');
      const old=own(e.dimensions,key)?e.dimensions[key]:null,revision=safeAdd(e.revision,1,'revision');
      this._room();e.dimensions[key]=value;e.revision=revision;
      this._record('DIMENSION_CHANGED',id,{key,old,next:value,revision,sourceRef});
    });
  }
  _context(entityId,token){
    const self=this,check=()=>{if(!token.active||!self._busy)throw new Error('process context expired');};
    return Object.freeze({
      modelMs:this.timeMs,tick:this.tick,entityId,
      read:id=>{check();if(!self._readState.has(id))throw new TypeError('unknown entity');return clone(self._readState.get(id));},
      inbox:()=>{check();return self.inbox(entityId);},
      request:data=>{check();const route=self.routes.get(data.routeId);if(!route||route.from!==entityId)throw new TypeError('process cannot request a route originating elsewhere');return self.request(data);},
      emit:data=>{check();const channel=self.channels.get(data.channelId);if(!channel||channel.from!==entityId)throw new TypeError('process cannot emit for another source');return self.emit(data);},
      update:(key,value,sourceRef)=>{check();return self.setDimension(entityId,key,value,sourceRef);},
      receive:options=>{check();return self.clearInbox(entityId,options);}
    });
  }
  _deliver(){
    const arrived=this.signalTransit.filter(m=>m.arriveTick<=this.tick);
    for(const message of arrived){
      const inbox=this.inboxes.get(message.to);this._room();
      this.signalTransit=this.signalTransit.filter(m=>m.id!==message.id);
      if(inbox.length>=this.maxInbox){this.counters.signalsDropped++;this._record('INBOX_CAPACITY',message.to,{id:message.id,channelId:message.channelId});}
      else {inbox.push(message);this.counters.signalsArrived++;this._record('SIGNAL_ARRIVED',message.to,{id:message.id,from:message.from,channelId:message.channelId});}
    }
  }
  _settleFlows(dt){
    const before=new Map([...this.entities].map(([id,e])=>[id,clone(e.resources)])),bySource=new Map(),caps=new Map(),commits=[];
    for(const request of this.pending){
      const route=this.routes.get(request.routeId),source=this.entities.get(route.from),stock=amountOf(before.get(route.from),route.resource);
      if(!caps.has(route.id))caps.set(route.id,capacity(route,stock,source.volume,dt));
      const key=route.from+'\u0000'+route.resource;
      if(!bySource.has(key))bySource.set(key,[]);bySource.get(key).push({request,route});
    }
    for(const [key,items]of bySource){
      const [sourceId,resource]=key.split('\u0000'),stock=amountOf(before.get(sourceId),resource);
      const sourceCaps=new Map(items.map(({route})=>[route.id,caps.get(route.id)]));
      for(const c of allocate(items,stock,sourceCaps))commits.push({sourceId,resource,...c});
    }
    for(const c of commits){
      this._room();const {request,route}=c,amount=c.allocation;
      this.pending=this.pending.filter(r=>r.id!==request.id);
      if(amount===0){this.counters.unserved++;this._record('REQUEST_UNSERVED',c.sourceId,{intentId:request.id,routeId:route.id});continue;}
      const source=this.entities.get(c.sourceId),target=this.entities.get(route.to),available=amountOf(source.resources,c.resource);
      if(amount>available)throw new RangeError('allocation exceeds remaining source stock');
      const nextTarget=finiteAdd(amountOf(target.resources,c.resource),amount,'target inventory');
      source.resources[c.resource]=available-amount;target.resources[c.resource]=nextTarget;source.revision++;target.revision++;
      this.counters.flows++;this._record('RESOURCE_TRANSFER',c.sourceId,{to:route.to,resource:c.resource,amount,
        routeId:route.id,intentId:request.id,evidence:request.evidence,reason:request.reason});
    }
  }
  _step(){
    this.tick=safeAdd(this.tick,1,'tick');integer(this.tick*this.tickMs*1000,'model microseconds');
    this.timeMs=this.tick*this.tickMs;this._deliver();this._readState=clone(this.entities);
    try{
      for(const p of this.processes.values())if(this.tick%p.everyTicks===0){
        const token={active:true};let result;
        try{result=p.run(this._context(p.entityId,token));}finally{token.active=false;}
        if(result&&((typeof result==='object'||typeof result==='function')&&(typeof result.then==='function'||typeof result.next==='function'))){
          if(result instanceof Promise)result.catch(()=>{});
          throw new TypeError('process callback must finish synchronously');
        }
      }
      this._settleFlows(this.tickMs);this._record('TICK_COMPLETED',this.worldId,{tick:this.tick});
    }finally{this._readState=null;}
  }
  advance(deltaMs){
    const us=micros(deltaMs,'deltaMs');if(deltaMs>86400000)throw new RangeError('advance horizon too large');
    if(this._busy)throw new Error('reentrant advance');
    return this._mutate(()=>{
      integer(this.tick*this.tickMs*1000+this.remainderUs+us,'total model microseconds');
      this._busy=true;
      try{
        this.remainderUs=safeAdd(this.remainderUs,us,'remainder microseconds');const tickUs=this.tickMs*1000;
        while(this.remainderUs>=tickUs){this.remainderUs-=tickUs;this._step();}
        return {tick:this.tick,modelMs:this.timeMs,remainderMs:this.remainderMs,remainderUs:this.remainderUs};
      }finally{this._busy=false;this._readState=null;}
    });
  }
  /** One atomic model transition for executed time plus an observed gap.
   * Both clock inputs are validated before any callback runs. Ambient callback
   * effects remain outside the existing model-state/journal rollback contract.
   */
  advanceWithGap(deltaMs,gapMs){
    const deltaUs=micros(deltaMs,'deltaMs'),gapUs=micros(gapMs,'gapMs');
    if(deltaMs>86400000)throw new RangeError('advance horizon too large');
    if(this._busy)throw new Error('reentrant advance');
    integer(this.tick*this.tickMs*1000+this.remainderUs+deltaUs,'total model microseconds');
    safeAdd(this.undocumentedGapUs,gapUs,'gap microseconds');
    return this._mutate(()=>{
      const advanced=this.advance(deltaMs);this.gap(gapMs);
      return {...advanced,undocumentedGapUs:this.undocumentedGapUs,undocumentedGapMs:this.undocumentedGapMs};
    });
  }
  gap(deltaMs){
    const deltaUs=micros(deltaMs,'gap');
    return this._append(()=>{
      const next=safeAdd(this.undocumentedGapUs,deltaUs,'gap microseconds');this._room();
      this.undocumentedGapUs=next;this._record('OBSERVATION_GAP',this.worldId,{deltaMs,deltaUs});
    });
  }
  snapshot({includeEvents=true}={}){
    if(typeof includeEvents!=='boolean')throw new TypeError('includeEvents must be boolean');
    const processDescriptors=[...this.processes.values()].map(descriptor);
    const state={schema:SCHEMA,version:ENGINE_VERSION,worldId:this.worldId,instanceId:this.instanceId,config:this._liveConfig(),contracts:this._contracts,
      tick:this.tick,tickMs:this.tickMs,modelMs:this.timeMs,remainderUs:this.remainderUs,remainderMs:this.remainderMs,
      undocumentedGapUs:this.undocumentedGapUs,undocumentedGapMs:this.undocumentedGapMs,
      head:this.head,sequence:this.sequence,requestSeq:this.requestSeq,messageSeq:this.messageSeq,
      resources:[...this.resources.values()],entities:[...this.entities.values()],routes:[...this.routes.values()],channels:[...this.channels.values()],
      relations:this.links,counters:this.counters,pending:this.pending,signalTransit:this.signalTransit,inboxes:Object.fromEntries(this.inboxes),
      processIds:processDescriptors.map(p=>p.id),processDescriptors,processManifestSha256:sha256(canonical(processDescriptors)),
      initialSupply:Object.fromEntries(this.initialSupply),coverage:{events:includeEvents?'COMPLETE_IN_SESSION':'OMITTED_FROM_PROJECTION',eventCount:this.events.length},
      events:includeEvents?this.events:[]};
    const data=copyJSON(state,'snapshot');return {...data,checkpointSha256:sha256(JSON.stringify(data))};
  }
  audit(){
    const violations=[],totals={};let replay;
    try{
      if(!equal(this._liveConfig(),this._config))violations.push('unlogged world configuration change');
      integer(this.tick,'tick');integer(this.remainderUs,'remainder microseconds');integer(this.undocumentedGapUs,'gap microseconds');
      if(this.remainderUs>=this.tickMs*1000||this.timeMs!==this.tick*this.tickMs)violations.push('invalid model clock');
      integer(this.tick*this.tickMs*1000+this.remainderUs,'total model microseconds');
      if(this.events.length>this.maxEvents)violations.push('event budget exceeded');
      if(!verifyEventChain(this.events,this.head))violations.push('broken event chain or namespace');
      replay=replayEvents(this.events,this._config,this._contracts);
      if(this.sequence!==this.events.length)violations.push('ledger sequence vs stored events mismatch');
      if(replay.tick!==this.tick)violations.push('unlogged model tick');
      if(replay.undocumentedGapUs!==this.undocumentedGapUs)violations.push('unlogged observation gap');
      const compareMaps=(name,a,b)=>{
        if(a.size!==b.size)violations.push('unlogged '+name+' disappearance or addition');
        for(const [id,value]of a)if(!b.has(id)||!equal(value,b.get(id)))violations.push('unlogged '+name+' mutation '+id);
      };
      compareMaps('resource definition',replay.resources,this.resources);compareMaps('route',replay.routes,this.routes);
      compareMaps('channel',replay.channels,this.channels);
      compareMaps('process',replay.processes,new Map([...this.processes].map(([id,p])=>[id,descriptor(p)])));
      if(replay.entities.size!==this.entities.size)violations.push('unlogged entity disappearance or addition');
      for(const [id,entity]of this.entities){
        json(entity,'entity');if(id!==entity.id)violations.push('entity map identity mismatch '+id);
        const expected=replay.entities.get(id);if(!expected){violations.push('no logged origin for '+id);continue;}
        for(const [resource,amount]of Object.entries(entity.resources)){
          if(!this.resources.has(resource))violations.push('unknown resource '+id+'/'+resource);
          if(!Number.isFinite(amount)||amount<0)violations.push('invalid amount '+id+'/'+resource);
        }
        if(!equal(expected.dimensions,entity.dimensions))violations.push('unlogged dimension change '+id);
        for(const resource of new Set([...Object.keys(expected.resources),...Object.keys(entity.resources)]))
          if(amountOf(expected.resources,resource)!==amountOf(entity.resources,resource))violations.push('unlogged inventory change '+id+'/'+resource);
        const {resources:a,dimensions:b,...expectedIdentity}=expected,{resources:c,dimensions:d,...currentIdentity}=entity;
        if(!equal(expectedIdentity,currentIdentity))violations.push('unlogged entity identity change '+id);
      }
      if(!equal([...replay.initialSupply],[...this.initialSupply]))violations.push('unlogged initial supply change');
      for(const resource of this.resources.keys())totals[resource]=0;
      for(const entity of this.entities.values())for(const [resource,amount]of Object.entries(entity.resources)){
        if(!own(totals,resource))continue;totals[resource]+=amount;
        if(!Number.isFinite(totals[resource]))violations.push('nonfinite resource total '+resource);
      }
      for(const [resource,initial]of this.initialSupply){
        if(!Number.isFinite(initial)||!Number.isFinite(totals[resource]))violations.push('nonfinite conservation operand '+resource);
        else if(Math.abs(totals[resource]-initial)>Math.max(Number.MIN_VALUE,Math.abs(initial)*1e-9))violations.push('conservation failure '+resource);
      }
      compareMaps('inbox',replay.inboxes,this.inboxes);
      if(!equal([...replay.pending.values()],this.pending))violations.push('unlogged pending request change');
      if(!equal([...replay.transit.values()],this.signalTransit))violations.push('unlogged signal transit change');
      if(!equal(replay.links,this.links))violations.push('unlogged relation change');
      if(!equal(replay.counters,this.counters))violations.push('unlogged counter change');
      if(replay.requestSeq!==this.requestSeq||replay.messageSeq!==this.messageSeq)violations.push('unlogged request or message sequence');
    }catch(error){violations.push('invalid audited state: '+error.message);}
    return {passed:violations.length===0,violations,head:this.head,eventCount:this.events.length,tick:this.tick,
      resourceTotals:totals,initialSupply:Object.fromEntries(this.initialSupply),model:'ABSTRACT_RESOURCE_UNITS_NOT_MEDICAL',
      version:ENGINE_VERSION,contracts:clone(this._contracts)};
  }
}

function replayEvents(events,config,contracts){
  const require=(condition,message)=>{if(!condition)throw new TypeError(message);};
  const state={resources:new Map(),entities:new Map(),routes:new Map(),channels:new Map(),processes:new Map(),inboxes:new Map(),
    initialSupply:new Map(),pending:new Map(),transit:new Map(),links:[],tick:0,undocumentedGapUs:0,requestSeq:0,messageSeq:0,
    counters:{requested:0,flows:0,signalsEmitted:0,signalsArrived:0,signalsDropped:0,unserved:0}};
  require(events.length>0&&events[0].type==='WORLD_CREATED','missing world origin');
  let eventTick=0,before=new Map(),routeSpent=new Map(),sourceSpent=new Map();
  const put=(map,id,value)=>{require(!map.has(id),'duplicate logged definition '+id);map.set(id,clone(value));};
  for(const event of events){
    json(event,'event');const d=event.details;
    integer(event.tick,'event tick');require(event.worldId===config.worldId&&event.instanceId===config.instanceId,'world event namespace');
    require(event.tick>=eventTick&&event.tick<=state.tick+1&&event.modelMs===event.tick*config.tickMs,'event time contract');
    if(event.tick!==eventTick){eventTick=event.tick;before=clone(state.entities);routeSpent=new Map();sourceSpent=new Map();}
    switch(event.type){
      case 'WORLD_CREATED':
        require(event.sequence===1&&equal(d,{config,contracts,version:ENGINE_VERSION}),'world origin mismatch');break;
      case 'RESOURCE_DEFINED':
        require(event.actor===d.id,'resource identity');validId(d.id);text(d.unit,'unit');text(d.kind,'kind');text(d.description,'description');
        put(state.resources,d.id,d);state.initialSupply.set(d.id,0);break;
      case 'ENTITY_BORN':
        require(event.actor===d.id&&d.bornMs===event.modelMs&&d.revision===0,'entity birth contract');
        validId(d.id);require(d.parentId===null||state.entities.has(d.parentId),'missing logged parent');
        finite(d.volume,'volume');require(d.volume>0,'zero volume');objectJSON(d.dimensions,'dimensions');objectJSON(d.resources,'resources');
        for(const [resource,amount]of Object.entries(d.resources)){
          require(state.resources.has(resource),'unknown birth resource');finite(amount,'birth amount');
          state.initialSupply.set(resource,finiteAdd(state.initialSupply.get(resource),amount,'birth supply'));
        }
        put(state.entities,d.id,d);state.inboxes.set(d.id,[]);break;
      case 'RELATION':
        require(state.entities.has(d.from)&&state.entities.has(d.to)&&event.actor===d.from,'relation endpoints');
        state.links.push(clone(d));break;
      case 'ROUTE_DEFINED':
        require(event.actor===d.id&&state.entities.has(d.from)&&state.entities.has(d.to)&&d.from!==d.to&&state.resources.has(d.resource),'route definition');
        validId(d.id);finite(d.vmax,'vmax');finite(d.km,'km');put(state.routes,d.id,d);break;
      case 'CHANNEL_DEFINED':
        require(event.actor===d.id&&state.entities.has(d.from)&&state.entities.has(d.to),'channel definition');
        validId(d.id);signalName(d.signal);integer(d.delayTicks,'delayTicks',1);put(state.channels,d.id,d);break;
      case 'PROCESS_ATTACHED':
        require(event.actor===d.id&&state.entities.has(d.entityId),'process attachment');
        validId(d.id);integer(d.everyTicks,'process cadence',1);require(/^[a-f0-9]{64}$/.test(d.runSha256),'process source digest');
        put(state.processes,d.id,d);break;
      case 'RESOURCE_REQUEST':{
        const route=state.routes.get(d.routeId);require(route&&route.from===event.actor,'request route');
        require(d.id===++state.requestSeq&&d.intentId===d.id,'request sequence');finite(d.amount,'requested amount');finite(d.weight,'request weight');require(d.weight>0,'zero weight');
        const {intentId,...request}=d;state.pending.set(d.id,clone(request));state.counters.requested++;break;
      }
      case 'REQUEST_UNSERVED':{
        const request=state.pending.get(d.intentId),route=state.routes.get(d.routeId);
        require(request&&route&&request.routeId===route.id&&route.from===event.actor,'unserved request binding');
        state.pending.delete(d.intentId);state.counters.unserved++;break;
      }
      case 'RESOURCE_TRANSFER':{
        const request=state.pending.get(d.intentId),route=state.routes.get(d.routeId);
        require(request&&route&&request.routeId===route.id&&route.from===event.actor&&route.to===d.to&&route.resource===d.resource,'transfer route binding');
        finite(d.amount,'transfer amount');require(d.amount>0&&d.amount<=request.amount,'transfer demand cap');
        require(equal(d.evidence,request.evidence)&&d.reason===request.reason,'transfer evidence binding');
        const source=state.entities.get(event.actor),target=state.entities.get(d.to),pre=before.get(event.actor);
        require(pre,'transfer outside a model tick');
        const stock=amountOf(pre.resources,d.resource),key=event.actor+'\u0000'+d.resource;
        const outgoing=(sourceSpent.get(key)??0)+d.amount,routeTotal=(routeSpent.get(route.id)??0)+d.amount,cap=capacity(route,stock,pre.volume,config.tickMs);
        const bound=(actual,limit)=>actual<=limit||actual-limit<=Math.max(Number.MIN_VALUE,Math.abs(limit)*1e-12);
        require(Number.isFinite(outgoing)&&bound(outgoing,stock)&&bound(routeTotal,cap),'transfer source or route cap exceeded');
        sourceSpent.set(key,outgoing);routeSpent.set(route.id,routeTotal);
        const available=amountOf(source.resources,d.resource);require(d.amount<=available,'negative replay inventory');
        source.resources[d.resource]=available-d.amount;target.resources[d.resource]=finiteAdd(amountOf(target.resources,d.resource),d.amount,'replay target');
        source.revision++;target.revision++;state.pending.delete(d.intentId);state.counters.flows++;break;
      }
      case 'SIGNAL_CAPACITY':
        require(state.channels.has(d.channelId)&&state.transit.size>=config.maxPending,'signal capacity receipt');state.counters.signalsDropped++;break;
      case 'SIGNAL_EMIT':{
        const channel=state.channels.get(d.channelId);
        require(channel&&event.actor===channel.from&&d.from===channel.from&&d.to===channel.to&&d.signal===channel.signal,'message channel binding');
        require(d.id===++state.messageSeq&&d.emittedAt===event.modelMs&&d.arriveTick===event.tick+channel.delayTicks,'message time or ID');
        integer(d.arriveTick,'arrival tick');require(state.transit.size<config.maxPending,'transit budget exceeded');
        state.transit.set(d.id,clone(d));state.counters.signalsEmitted++;break;
      }
      case 'SIGNAL_ARRIVED':
      case 'INBOX_CAPACITY':{
        const message=state.transit.get(d.id),inbox=state.inboxes.get(event.actor);
        require(message&&message.to===event.actor&&message.channelId===d.channelId&&message.arriveTick<=event.tick,'arrival receipt binding');
        state.transit.delete(d.id);
        if(event.type==='INBOX_CAPACITY'){require(inbox.length>=config.maxInbox,'false inbox capacity receipt');state.counters.signalsDropped++;}
        else {require(inbox.length<config.maxInbox&&d.from===message.from,'invalid inbox arrival');inbox.push(message);state.counters.signalsArrived++;}
        break;
      }
      case 'INBOX_READ':{
        const inbox=state.inboxes.get(event.actor);require(inbox,'missing inbox');
        const selected=d.signal===null?inbox:inbox.filter(m=>m.signal===d.signal);
        require(equal(selected.map(m=>m.id),d.ids)&&d.count===selected.length&&selected.length>0,'inbox read receipt');
        state.inboxes.set(event.actor,d.signal===null?[]:inbox.filter(m=>m.signal!==d.signal));break;
      }
      case 'DIMENSION_CHANGED':{
        const entity=state.entities.get(event.actor);require(entity,'missing dimension entity');validId(d.key,'dimension key');
        require(equal(own(entity.dimensions,d.key)?entity.dimensions[d.key]:null,d.old)&&d.revision===entity.revision+1,'dimension revision binding');
        entity.dimensions[d.key]=clone(d.next);entity.revision++;break;
      }
      case 'OBSERVATION_GAP':
        require(micros(d.deltaMs,'gap')===d.deltaUs,'gap time binding');state.undocumentedGapUs=safeAdd(state.undocumentedGapUs,d.deltaUs,'gap total');break;
      case 'TICK_COMPLETED':
        require(event.tick===state.tick+1&&d.tick===event.tick,'tick completion order');state.tick=event.tick;break;
      default:throw new TypeError('unknown state event type '+event.type);
    }
  }
  return state;
}

export function createWorld(config){return new OpenWorld(config);}
export function verifyEventChain(events,expectedHead){
  try{
    if(!Array.isArray(events)||typeof expectedHead!=='string'||!/^[a-f0-9]{64}$/.test(expectedHead))return false;
    let previous=ZERO,sequence=0,worldId=null,instanceId=null;
    for(const event of events){
      json(event,'event');const {hash,...base}=event;
      if(base.schema!==EVENT_SCHEMA||base.sequence!==++sequence||base.previousHash!==previous||sha256(JSON.stringify(base))!==hash)return false;
      if(worldId===null){worldId=base.worldId;instanceId=base.instanceId;validId(worldId);validId(instanceId);}
      if(base.worldId!==worldId||base.instanceId!==instanceId||base.eventId!=='event:'+sha256(JSON.stringify([worldId,instanceId,sequence])))return false;
      previous=hash;
    }
    return previous===expectedHead;
  }catch{return false;}
}
/** Restore never evaluates callbacks from JSON and never mutates the input checkpoint.
 * Code hashes plus declared parameters bind a local descriptor, not hidden closure state.
 */
export function restoreWorld(snapshot,{processes=[]}={}){
  const input=copyJSON(snapshot,'checkpoint'),{checkpointSha256,...body}=input;
  if(input.schema!==SCHEMA||input.version!==ENGINE_VERSION)throw new TypeError('unsupported checkpoint schema/version');
  if(typeof checkpointSha256!=='string'||sha256(JSON.stringify(body))!==checkpointSha256)throw new TypeError('checkpoint digest mismatch');
  if(input.coverage?.events!=='COMPLETE_IN_SESSION'||input.coverage.eventCount!==input.events?.length)throw new TypeError('complete event journal required for restore');
  const world=new OpenWorld(input.config);
  if(!equal(world._config,input.config)||input.worldId!==input.config.worldId||input.instanceId!==input.config.instanceId||input.tickMs!==input.config.tickMs)throw new TypeError('checkpoint configuration mismatch');
  const expectedContracts=clone(world._contracts);
  if(typeof input.contracts?.instance?.defaultUsed!=='boolean')throw new TypeError('checkpoint instance contract');
  expectedContracts.instance=input.contracts.instance.defaultUsed
    ?{defaultUsed:true,claim:'DETERMINISTIC_NAMESPACE_NOT_HISTORICAL_INCARNATION'}
    :{defaultUsed:false,claim:'CALLER_DECLARED_NAMESPACE_NOT_EXTERNALLY_VERIFIED'};
  if(!equal(expectedContracts,input.contracts))throw new TypeError('checkpoint runtime contracts mismatch');
  world._contracts=clone(input.contracts);
  const bindingList=processes instanceof Map?[...processes].map(([id,p])=>{if(p?.id!==id)throw new TypeError('process map ID mismatch');return p;}):processes;
  if(!Array.isArray(bindingList))throw new TypeError('trusted process descriptors must be an Array or Map');
  const bindings=new Map();
  for(const binding of bindingList){const p=processRecord(binding);if(bindings.has(p.id))throw new TypeError('duplicate trusted process binding');bindings.set(p.id,p);}
  if(!Array.isArray(input.processDescriptors)||!equal(input.processIds,input.processDescriptors.map(p=>p.id))||
      input.processManifestSha256!==sha256(canonical(input.processDescriptors))||bindings.size!==input.processDescriptors.length)throw new TypeError('process manifest mismatch');
  world.processes=new Map();
  for(const wanted of input.processDescriptors){
    const binding=bindings.get(wanted.id);if(!binding||!equal(descriptor(binding),wanted))throw new TypeError('trusted process binding mismatch '+wanted.id);
    world.processes.set(wanted.id,binding);
  }
  const mapRecords=(records,name)=>{
    if(!Array.isArray(records))throw new TypeError(name+' array required');const map=new Map();
    for(const record of records){validId(record.id);if(map.has(record.id))throw new TypeError('duplicate '+name+' ID');map.set(record.id,clone(record));}return map;
  };
  world.resources=mapRecords(input.resources,'resource');world.entities=mapRecords(input.entities,'entity');
  world.routes=mapRecords(input.routes,'route');world.channels=mapRecords(input.channels,'channel');
  world.inboxes=new Map(Object.entries(objectJSON(input.inboxes,'inboxes')));world.initialSupply=new Map(Object.entries(objectJSON(input.initialSupply,'supply')));
  world.timeMs=input.modelMs;
  for(const name of ['tick','remainderUs','undocumentedGapUs','sequence','requestSeq','messageSeq','head','counters','pending','signalTransit'])world[name]=clone(input[name]);
  world.links=clone(input.relations);world.events=input.events.map(e=>freezeJSON(clone(e)));
  if(input.remainderMs!==world.remainderMs||input.undocumentedGapMs!==world.undocumentedGapMs)throw new TypeError('checkpoint clock projection mismatch');
  const audit=world.audit();if(!audit.passed)throw new TypeError('invalid checkpoint: '+audit.violations.join('; '));
  if(!equal(world.snapshot(),input))throw new TypeError('checkpoint fields or projections mismatch');
  return world;
}
