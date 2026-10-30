import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {balancedPorts,lorentzEvent,vacuumTransit}=require('../core.cjs');
const near=(a,b,tolerance=1e-11)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);

test('phase redirects a coincident pulse between two outputs',()=>{
  const a=balancedPorts(0,{phase:0,delay:0,visibility:1});
  const b=balancedPorts(0,{phase:Math.PI,delay:0,visibility:1});
  near(a.plus,2);near(a.minus,0);near(b.plus,0);near(b.minus,2);near(a.input,b.input);
});
test('quarter-cycle phase gives equal outputs',()=>{
  const s=balancedPorts(0,{phase:Math.PI/2,delay:0,visibility:1});near(s.plus,1);near(s.minus,1);
});
test('zero overlap removes phase sensitivity',()=>{
  const a=balancedPorts(.3,{phase:0,delay:1,visibility:0});
  const b=balancedPorts(.3,{phase:Math.PI,delay:1,visibility:0});
  assert.deepEqual(a,b);near(a.plus,a.minus);
});
test('both ports retain the input across phase, delay and overlap',()=>{
  for (let i=0;i<101;i++) {
    const s=balancedPorts((i-50)/11,{phase:i*.73,delay:(i%17-8)/2,visibility:(i%11)/10});
    near(s.plus+s.minus,s.input);assert.ok(s.plus>=-1e-14&&s.minus>=-1e-14);
  }
});
test('integrated output remains constant when pulses separate',()=>{
  for (const delay of [0,1,4]) {
    let total=0;
    for (let i=0;i<20000;i++){const t=-12+(i+.5)*.0012;const s=balancedPorts(t,{phase:1.27,delay,visibility:.8});total+=(s.plus+s.minus)*.0012;}
    near(total,2*Math.sqrt(Math.PI),1e-9);
  }
});
test('a single input in the separated-pulse limit splits equally',()=>{
  const s=balancedPorts(-10,{phase:0,delay:20,visibility:1});near(s.plus,.5);near(s.minus,.5);near(s.input,1);
});
test('wave parameters reject missing, extra, nonnumeric and nonfinite values',()=>{
  for (const p of [null,{},[],{phase:0,delay:0},{phase:0,delay:0,visibility:1,extra:1},{phase:'0',delay:0,visibility:1},{phase:Infinity,delay:0,visibility:1},{phase:0,delay:0,visibility:-.01},{phase:0,delay:0,visibility:1.01}]) assert.throws(()=>balancedPorts(0,p));
  assert.throws(()=>balancedPorts(NaN,{phase:0,delay:0,visibility:1}));
});
test('the local meeting event remains the origin',()=>{
  for (const beta of [-.8,0,.8]) {const p=lorentzEvent({x:0,t:0,beta});near(p.x,0);near(p.t,0);}
});
test('a remote spacelike event changes coordinate time but retains interval',()=>{
  const left=lorentzEvent({x:1.2,t:0,beta:-.8}),right=lorentzEvent({x:1.2,t:0,beta:.8});
  assert.ok(left.t>0&&right.t<0);
  near(left.x**2-left.t**2,1.44);near(right.x**2-right.t**2,1.44);
});
test('future timelike events stay future-directed',()=>{
  for(const beta of [-.95,-.4,.4,.95]){
    const p=lorentzEvent({x:.4,t:1,beta});assert.ok(p.t>0);near(p.x*p.x-p.t*p.t,-.84);
  }
});
test('a lightlike event stays lightlike',()=>{
  for(const beta of [-.8,.3,.8]){const p=lorentzEvent({x:1,t:1,beta});near(p.x,p.t);}
});
test('inverse transformation recovers several bound events',()=>{
  for(const event of [{x:1.2,t:0,beta:.6},{x:.4,t:1,beta:-.7},{x:-1,t:1,beta:.8}]){
    const p=lorentzEvent(event),q=lorentzEvent({x:p.x,t:p.t,beta:-event.beta});near(q.x,event.x);near(q.t,event.t);
  }
});
test('coordinate conversion rejects luminal, invalid and overflowing inputs',()=>{
  for(const beta of [-1,1,2,Infinity])assert.throws(()=>lorentzEvent({x:1,t:0,beta}));
  assert.throws(()=>lorentzEvent({x:1,t:'0',beta:0}));assert.throws(()=>lorentzEvent({x:Number.MAX_VALUE,t:-Number.MAX_VALUE,beta:.8}));
});
test('vacuum transit uses SI length and the exact speed of light',()=>{
  near(vacuumTransit(299792458),1);near(vacuumTransit(0),0);assert.equal(vacuumTransit(1e-10),3.335640951981521e-19);
  for(const bad of [-1,NaN,Infinity,'1',null])assert.throws(()=>vacuumTransit(bad));
});
