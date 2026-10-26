// Bounded plain-JSON data contract shared by imports, checkpoints and commands.
export const JSON_CONTRACT = 'halveth.plain-json.v1';
const encoder = new TextEncoder();
function scalar(text) {
  for (let i=0;i<text.length;i++) {
    const a=text.charCodeAt(i);
    if(a>=0xD800&&a<=0xDBFF){const b=text.charCodeAt(++i);if(!(b>=0xDC00&&b<=0xDFFF))throw new TypeError('Unpaired Unicode surrogate');}
    else if(a>=0xDC00&&a<=0xDFFF)throw new TypeError('Unpaired Unicode surrogate');
  }
}
export function assertJsonData(value,{maxDepth=64,maxNodes=2000000}={}) {
  if(!Number.isSafeInteger(maxDepth)||maxDepth<0||!Number.isSafeInteger(maxNodes)||maxNodes<1)throw new TypeError('JSON structural limits must be whole nonnegative depth and positive node count');
  let nodes=0;const ancestors=new Set();
  function visit(item,depth) {
    if(++nodes>maxNodes||depth>maxDepth)throw new RangeError('JSON structural budget exceeded');
    if(item===null||typeof item==='boolean')return;
    if(typeof item==='number'){if(!Number.isFinite(item))throw new TypeError('JSON numbers must be finite');return;}
    if(typeof item==='string'){scalar(item);return;}
    if(typeof item!=='object'||ancestors.has(item))throw new TypeError('Acyclic plain JSON required');
    if(!Array.isArray(item)&&![Object.prototype,null].includes(Object.getPrototypeOf(item)))throw new TypeError('Plain JSON object required');
    if(Object.getOwnPropertySymbols(item).length)throw new TypeError('JSON symbol keys are unsupported');
    ancestors.add(item);
    const descriptors=Object.getOwnPropertyDescriptors(item);
    if(Array.isArray(item)) {
      for(let i=0;i<item.length;i++)if(!Object.hasOwn(descriptors,String(i)))throw new TypeError('Sparse JSON array');
      if(Object.keys(descriptors).some(k=>k!=='length'&&(!/^(?:0|[1-9][0-9]*)$/.test(k)||!Number.isSafeInteger(Number(k))||Number(k)>=item.length)))throw new TypeError('Extra JSON array properties');
    }
    for(const [key,descriptor]of Object.entries(descriptors)) {
      if(Array.isArray(item)&&key==='length')continue;
      scalar(key);
      if(key==='__proto__'||!Object.hasOwn(descriptor,'value')||!descriptor.enumerable)throw new TypeError('Unsupported JSON property');
      visit(descriptor.value,depth+1);
    }
    ancestors.delete(item);
  }
  visit(value,0);return value;
}
export function cloneJsonData(value,limits) {assertJsonData(value,limits);return structuredClone(value);}
export function parseJsonData(text,{maxBytes=16*1024*1024,maxDepth=64,maxNodes=2000000}={}) {
  if(!Number.isSafeInteger(maxBytes)||maxBytes<1||!Number.isSafeInteger(maxDepth)||maxDepth<0||!Number.isSafeInteger(maxNodes)||maxNodes<1)throw new TypeError('JSON limits must be valid whole numbers');
  if(typeof text!=='string')throw new TypeError('JSON text required');
  if(text.length>maxBytes||encoder.encode(text).length>maxBytes)throw new RangeError('JSON byte budget exceeded');
  const parsed=JSON.parse(text); // The native syntax parser never executes source text.
  let cursor=0,nodes=0;
  const whitespace=()=>{while(cursor<text.length&&/[ \t\r\n]/.test(text[cursor]))cursor++;};
  function stringToken() {
    const start=cursor++;
    while(cursor<text.length){const c=text[cursor++];if(c==='\\')cursor++;else if(c==='"')return JSON.parse(text.slice(start,cursor));}
    throw new SyntaxError('Unclosed JSON string');
  }
  function scan(depth=0) {
    whitespace();if(++nodes>maxNodes||depth>maxDepth)throw new RangeError('JSON structural budget exceeded');
    const first=text[cursor];
    if(first==='{') {
      cursor++;whitespace();const keys=new Set();if(text[cursor]==='}'){cursor++;return;}
      while(cursor<text.length) {
        whitespace();const key=stringToken();if(keys.has(key))throw new SyntaxError('Duplicate JSON key: '+key);keys.add(key);
        whitespace();if(text[cursor++]!==':')throw new SyntaxError('JSON colon required');scan(depth+1);whitespace();
        const next=text[cursor++];if(next==='}')return;if(next!==',')throw new SyntaxError('JSON object separator required');
      }
    } else if(first==='[') {
      cursor++;whitespace();if(text[cursor]===']'){cursor++;return;}
      while(cursor<text.length){scan(depth+1);whitespace();const next=text[cursor++];if(next===']')return;if(next!==',')throw new SyntaxError('JSON array separator required');}
    } else if(first==='"')stringToken();
    else {while(cursor<text.length&&!/[\s,}\]]/.test(text[cursor]))cursor++;}
  }
  scan();whitespace();if(cursor!==text.length)throw new SyntaxError('Unexpected JSON tail');
  return assertJsonData(parsed,{maxDepth,maxNodes});
}
