/* A hypothetical multi-compartment model, NOT a physiological digital twin. */
import {createWorld} from './open-world.mjs';
import {attachDemand,attachReceptor} from './operators.mjs';
import {attachGeneReadout} from './genetic-code.mjs';

export function buildCompartmentWorld({tickMs=50,instanceId='instance:default',maxEvents=100000}={}) {
  const w=createWorld({worldId:'halveth:multiscale-biological-model',tickMs,instanceId,maxEvents});
  const units=['nutrient','oxygen','gaba','trace'];
  for(const r of units)w.defineResource({id:r,unit:'ABSTRACT_MODEL_AMOUNT',kind:'ABSTRACT_EXCHANGE'});
  const participants=[
    ['organism',null,'organism',{},100],
    ['environment','organism','environment',{},400],
    ['gut','organism','organ',{},20],
    ['gut_lumen','gut','lumen',{nutrient:200,gaba:30},12],
    ['gut_epithelium','gut','tissue',{nutrient:1},2],
    ['circulation','organism','organ',{},20],
    ['blood_plasma','circulation','fluid',{nutrient:35,oxygen:40,gaba:3},10],
    ['heart','circulation','organ',{nutrient:2,oxygen:2},3],
    ['liver','organism','organ',{nutrient:20,oxygen:3},6],
    ['lung','organism','organ',{oxygen:40},4],
    ['kidney','organism','organ',{nutrient:2,oxygen:3},4],
    ['skin','organism','organ',{nutrient:3,oxygen:2},8],
    ['brain','organism','organ',{nutrient:12,oxygen:8,gaba:6},6],
    ['brain_barrier','brain','interface',{nutrient:0.5,oxygen:0.5,gaba:0.2},1],
    ['neural_tissue','brain','tissue',{nutrient:3,oxygen:3,gaba:4},4],
    ['muscle','organism','organ',{nutrient:5,oxygen:8},12],
    ['cell_population','muscle','cell_population',{nutrient:1,oxygen:1},2],
    ['enzyme_machine','cell_population','molecular_machine',{},1],
    ['microbiome','gut_lumen','microbial_ecology',{nutrient:4},3],
  ];
  for(const [id,parentId,kind,resources,volume] of participants)w.addEntity({id,parentId,kind,resources,volume,
    role:'Source-bound candidate for coupled resource and signal dynamics.',sourceRef:'DESIGN_HYPOTHESIS_NOT_MEASURED'});
  const routes=[
    // from, to, resource, max units / second, saturation Km model concentration
    ['gut_lumen','gut_epithelium','nutrient',2,.25],
    ['gut_epithelium','blood_plasma','nutrient',1,.20],
    ['blood_plasma','liver','nutrient',.7,.7],
    ['liver','blood_plasma','nutrient',.5,.3],
    ['blood_plasma','heart','nutrient',.4,.3],
    ['blood_plasma','brain_barrier','nutrient',.8,.25],
    ['brain_barrier','neural_tissue','nutrient',.8,.1],
    ['blood_plasma','muscle','nutrient',.55,.3],
    ['muscle','cell_population','nutrient',.25,.3],
    ['blood_plasma','skin','nutrient',.25,.4],
    ['blood_plasma','kidney','nutrient',.25,.4],
    ['gut_lumen','microbiome','nutrient',.5,.25],
    ['lung','blood_plasma','oxygen',1.8,.1],
    ['blood_plasma','heart','oxygen',.55,.3],
    ['blood_plasma','brain_barrier','oxygen',.8,.2],
    ['brain_barrier','neural_tissue','oxygen',.7,.1],
    ['blood_plasma','muscle','oxygen',.9,.2],
    ['blood_plasma','liver','oxygen',.35,.2],
    ['blood_plasma','kidney','oxygen',.3,.2],
    ['gut_lumen','blood_plasma','gaba',.35,.8],
    // The asymmetry is a model parameter, NOT a measured human BBB permeability.
    ['blood_plasma','brain_barrier','gaba',.025,.5],
    ['brain_barrier','neural_tissue','gaba',.012,.5],
    ['neural_tissue','brain_barrier','gaba',.18,.5],
    ['brain_barrier','blood_plasma','gaba',.15,.3],
  ];
  for(const [from,to,resource,vmax,km] of routes)w.addRoute({id:`${from}:${to}:${resource}`,from,to,resource,vmax,km,
    note:'Directed saturable abstract flux; not a measured or validated human parameter.',sourceRef:'MODEL_PARAMETER'});
  // Multiple resource demands originate at different entities, with state-dependent
  // amounts computed from the other compartment's inventory (not a central organ king).
  for(const route of w.routes.values()) {
    const goal=route.to==='gut_epithelium'?15:route.resource==='gaba'?3:route.resource==='oxygen'?12:10;
    attachDemand(w,{id:`proc:${route.id}`,entityId:route.from,routeId:route.id,targetId:route.to,resource:route.resource,goal});
  }
  w.addChannel({id:'gut:brain:signal',from:'gut_epithelium',to:'brain',signal:'GUT_STATE',delayTicks:3});
  w.addChannel({id:'brain:heart:signal',from:'brain',to:'heart',signal:'NERVOUS_INPUT',delayTicks:2});
  w.addChannel({id:'heart:brain:signal',from:'heart',to:'brain',signal:'CIRCULATION_STATE',delayTicks:2});
  for(const c of ['gut:brain:signal','brain:heart:signal','heart:brain:signal']) {
    const ch=w.channels.get(c);
    w.addProcess({id:`signal:${c}`,entityId:ch.from,everyTicks:20,
      description:'Discrete model signal, not direct organ language',
      behaviorId:'halveth:compartment-pulse:1',parameters:{channelId:c,from:ch.from},
      run:ctx=>ctx.emit({channelId:c,payload:{atMs:ctx.modelMs,revision:ctx.read(ch.from).revision},evidence:'ABSTRACT_SIGNAL'})});
  }
  attachReceptor(w,{id:'receptor:gut-state',entityId:'brain',signal:'GUT_STATE',dimension:'gut_activation',gain:.1,decay:.995});
  attachReceptor(w,{id:'receptor:circulation',entityId:'brain',signal:'CIRCULATION_STATE',dimension:'circulation_activation',gain:.08,decay:.99});
  attachReceptor(w,{id:'receptor:nervous',entityId:'heart',signal:'NERVOUS_INPUT',dimension:'nervous_activation',gain:.1,decay:.99});
  attachGeneReadout(w,{entityId:'enzyme_machine',processId:'reference:gene',codingDNA:'ATGGCTTAA',everyTicks:100});
  w.relate({from:'enzyme_machine',to:'cell_population',kind:'part_of',sourceRef:'DECLARED_MODEL_LINK'});
  return w;
}
