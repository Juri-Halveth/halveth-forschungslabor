/** Local model templates. Parameters describe software behavior, not measured physiology. */
const ID=/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/;

/** A declarative stimulus/receptor interface with retained causal provenance.
 * process consumes messages from its own inbox and updates only its own state.
 */
export function attachReceptor(world,{entityId,id,signal,dimension='activation',decay=.985,gain=.05,everyTicks=1}={}){
  if(!world.entities.has(entityId))throw new TypeError('Unknown receptor entity');
  if(typeof signal!=='string'||!/^[A-Za-z][A-Za-z0-9_]{0,99}$/.test(signal)||typeof dimension!=='string'||!ID.test(dimension))throw new TypeError('Invalid receptor signal or dimension');
  if(!Number.isFinite(decay)||decay<0||decay>1||!Number.isFinite(gain)||gain<0)throw new TypeError('invalid receptor parameters');
  const initial=world.observe(entityId).dimensions[dimension];
  if(initial!==undefined&&(typeof initial!=='number'||!Number.isFinite(initial)||initial<0||initial>1))throw new TypeError('Receptor state must be a finite value in [0,1]');
  return world.addProcess({id,entityId,everyTicks,description:`Model receptor reacts to signal ${signal}`,
    sourceRef:'RECEPTOR_ANALOGY_NOT_BIOLOGICAL_CALIBRATION',behaviorId:'halveth:receptor:1',parameters:{signal,dimension,decay,gain},run:ctx=>{
      const messages=ctx.receive({signal});
      const matched=messages.length;
      const old=ctx.read(entityId).dimensions[dimension]??0;
      if(typeof old!=='number'||!Number.isFinite(old)||old<0||old>1)throw new TypeError('Invalid receptor state');
      const next=Math.min(1,Math.max(0,old*decay+matched*gain));
      if(next!==old)ctx.update(dimension,next,{cause:'MODEL_RECEPTOR',matched,signal,modelMs:ctx.modelMs});
    }});
}

/** Same class of resource may flow on different edges with different Km/Vmax.
 * Constructs a process only; caller must first define a directed route.
 */
export function attachDemand(world,{entityId,id,routeId,targetId,resource,goal,weight=1,everyTicks=1}={}){
  const route=world.routes.get(routeId);
  if(!world.entities.has(entityId)||!world.entities.has(targetId)||!route||route.from!==entityId||route.to!==targetId||route.resource!==resource)throw new TypeError('Demand must bind the exact directed route and resource');
  if(!Number.isFinite(goal)||goal<0||!Number.isFinite(weight)||weight<=0)throw new TypeError('invalid demand');
  return world.addProcess({id,entityId,everyTicks,description:`Feedback demand for ${resource} to ${targetId}`,
    sourceRef:'OPEN_RESOURCE_FEEDBACK',behaviorId:'halveth:demand:1',parameters:{routeId,targetId,resource,goal,weight},run:ctx=>{
      const stock=ctx.read(targetId).resources[resource]??0;
      const deficit=Math.max(0,goal-stock);
      if(deficit>0){
        const priority=weight*(1+deficit/Math.max(1,goal));
        if(!Number.isFinite(priority))throw new RangeError('Demand priority outside finite model range');
        ctx.request({routeId,amount:deficit,weight:priority,reason:'LOCAL_MODEL_DEMAND',evidence:{goal,observedStock:stock}});
      }
    }});
}
