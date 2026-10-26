import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../src/open-world.mjs';
test('300 seeded competing-demand fixtures preserve source, route, demand and work-conservation bounds',()=>{
  let seed=0x26a10b;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let trial=0;trial<300;trial++){
    const world=createWorld({tickMs:1000,instanceId:`fixture:${trial}`}),stock=1+Math.floor(random()*1000),routes=1+Math.floor(random()*7),requests=[];
    world.defineResource({id:'reserve'});world.addEntity({id:'source',resources:{reserve:stock}});const routeCaps=new Map(),routeDemand=new Map();
    for(let i=0;i<routes;i++){
      const id=`route:${i}`,to=`target:${i}`,cap=1+Math.floor(random()*1000);world.addEntity({id:to});world.addRoute({id,from:'source',to,resource:'reserve',vmax:cap,km:0});routeCaps.set(id,cap);routeDemand.set(id,0);
      for(let j=0;j<1+Math.floor(random()*3);j++){
        const amount=1+Math.floor(random()*1000),weight=10**(-8+16*random());const requestId=world.request({routeId:id,amount,weight});requests.push({requestId,routeId:id,amount});routeDemand.set(id,routeDemand.get(id)+amount);
      }
    }
    world.advance(1000);const flows=world.events.filter(e=>e.type==='RESOURCE_TRANSFER'),perRoute=new Map(),byIntent=new Map();let served=0;
    for(const event of flows){const {routeId,intentId,amount}=event.details;assert(Number.isFinite(amount)&&amount>0);served+=amount;perRoute.set(routeId,(perRoute.get(routeId)??0)+amount);byIntent.set(intentId,(byIntent.get(intentId)??0)+amount);}
    for(const {requestId,amount}of requests)assert((byIntent.get(requestId)??0)<=amount+1e-9);
    for(const [id,cap]of routeCaps)assert((perRoute.get(id)??0)<=cap+1e-9);
    const feasible=Math.min(stock,[...routeCaps].reduce((sum,[id,cap])=>sum+Math.min(cap,routeDemand.get(id)),0));
    assert(Math.abs(served-feasible)<=Math.max(1e-9,stock*1e-12),`fixture ${trial}: unused feasible inventory`);
    assert(Math.abs([...world.entities.values()].reduce((sum,e)=>sum+(e.resources.reserve??0),0)-stock)<1e-8);
    assert(world.observe('source').resources.reserve>=0);assert(world.audit().passed,`fixture ${trial}: audit`);
  }
});
