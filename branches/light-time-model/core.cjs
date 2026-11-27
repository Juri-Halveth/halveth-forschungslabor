// SPDX-License-Identifier: MIT
// Explicit classical model. No instrument I/O or physical backend.
(function bind(root) {
  'use strict';
  function finite(value, name) {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${name} must be a finite number`);
    return value;
  }
  function fields(value, names) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('parameters must be an object');
    if (Object.keys(value).sort().join('|') !== [...names].sort().join('|')) throw new TypeError(`parameters must contain exactly ${names.join(', ')}`);
    for (const name of names) finite(value[name], name);
    return value;
  }
  function balancedPorts(time, parameters) {
    finite(time, 'time');
    const {phase, delay, visibility}=fields(parameters, ['phase','delay','visibility']);
    if (visibility<0 || visibility>1) throw new RangeError('visibility must be between zero and one');
    const ta=time+delay/2, tb=time-delay/2;
    if (!Number.isFinite(ta) || !Number.isFinite(tb)) throw new RangeError('time arithmetic overflow');
    const a=Math.exp(-(ta*ta)/2), b=Math.exp(-(tb*tb)/2);
    const input=a*a+b*b, cross=2*visibility*a*b*Math.cos(phase);
    return Object.freeze({a,b,input,plus:(input+cross)/2,minus:(input-cross)/2});
  }
  function lorentzEvent(parameters) {
    const {x,t,beta}=fields(parameters,['x','t','beta']);
    if (Math.abs(beta)>=1) throw new RangeError('absolute beta must be less than one');
    const gamma=1/Math.sqrt((1-beta)*(1+beta));
    const transformedX=gamma*(x-beta*t), transformedT=gamma*(t-beta*x);
    if (!Number.isFinite(transformedX) || !Number.isFinite(transformedT)) throw new RangeError('coordinate arithmetic overflow');
    return Object.freeze({x:transformedX,t:transformedT,gamma});
  }
  function vacuumTransit(lengthMeters) {
    finite(lengthMeters,'lengthMeters');
    if (lengthMeters<0) throw new RangeError('length must be nonnegative');
    return lengthMeters/299792458;
  }
  const api=Object.freeze({balancedPorts,lorentzEvent,vacuumTransit});
  if (typeof module==='object' && module.exports) module.exports=api;
  else root.LightTimeCore=api;
})(globalThis);
