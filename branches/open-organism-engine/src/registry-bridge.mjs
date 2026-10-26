// Node-only adapter; registry data never becomes executable JavaScript.
import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import {parseRegistryText,REGISTRY_MAX_BYTES} from './registry-data.mjs';
import {explicitLocalFilePath} from './node-checkpoint-store.mjs';
export {profileWorld,parseRegistryText,validateRegistry} from './registry-data.mjs';
const same=(a,b)=>a.dev===b.dev&&a.ino===b.ino&&a.size===b.size&&a.mtimeNs===b.mtimeNs&&a.ctimeNs===b.ctimeNs;
export async function readHalvethRegistry(inputPath) {
  const path=explicitLocalFilePath(inputPath);
  const before=await fs.lstat(path,{bigint:true});
  if(!before.isFile()||before.isSymbolicLink()||before.size>BigInt(REGISTRY_MAX_BYTES))throw new TypeError('Regular registry file up to 4 MiB required');
  const handle=await fs.open(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0)|(constants.O_NONBLOCK??0));
  try{
    const bound=await handle.stat({bigint:true});if(!bound.isFile()||!same(before,bound))throw new TypeError('Registry changed before bounded read');
    const chunks=[];let length=0;
    while(length<=REGISTRY_MAX_BYTES){
      const chunk=Buffer.allocUnsafe(Math.min(65536,REGISTRY_MAX_BYTES+1-length));
      const {bytesRead}=await handle.read(chunk,0,chunk.length,null);if(bytesRead===0)break;
      length+=bytesRead;if(length>REGISTRY_MAX_BYTES)throw new RangeError('Registry grew beyond 4 MiB');chunks.push(chunk.subarray(0,bytesRead));
    }
    const after=await handle.stat({bigint:true}),current=await fs.lstat(path,{bigint:true});
    if(BigInt(length)!==bound.size||current.isSymbolicLink()||!same(bound,after)||!same(after,current))throw new TypeError('Registry changed during bounded read');
    const text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(Buffer.concat(chunks,length));
    return parseRegistryText(text).registry;
  }finally{await handle.close();}
}
