// Explicit local CLI. No autostart, installation, network or hardware control.
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {ModelController} from '../src/controller.mjs';
import {exportScenarioCheckpoint,restoreScenarioCheckpoint} from '../src/checkpoint.mjs';
import {readCheckpointFile,writeCheckpointFile,explicitLocalFilePath} from '../src/node-checkpoint-store.mjs';
const args=process.argv.slice(2),options={};
if(args.length===1&&args[0]==='--help'){
  console.log('Local model runner: --output ABSOLUTE_EXISTING_DIRECTORY [--duration-ms 1000..7200000] [--checkpoint-ms 1000..600000] [--scenario profiles|competition|compartments] [--profiles 1..1000] [--tick-ms 1..1000] [--resume ABSOLUTE_CHECKPOINT_FILE]. Existing output files are never replaced. No autostart or external network.');
  process.exit(0);
}
const allowed=new Set(['output','duration-ms','checkpoint-ms','tick-ms','profiles','scenario','resume']);
for(let i=0;i<args.length;i+=2){
  const key=args[i]?.slice(2),value=args[i+1];
  if(!args[i]?.startsWith('--')||!allowed.has(key)||Object.hasOwn(options,key)||typeof value!=='string'||value.startsWith('--'))throw Error('Use explicit --output ABSOLUTE_DIRECTORY [--duration-ms N] [--checkpoint-ms N] [--tick-ms N] [--profiles N] [--scenario profiles|competition|compartments] [--resume ABSOLUTE_FILE]');
  options[key]=value;
}
const integer=(key,fallback,min,max)=>{
  if(!Object.hasOwn(options,key))return fallback;
  if(!/^[1-9][0-9]*$/.test(options[key]))throw new TypeError(key+' must be a decimal whole number');
  const result=Number(options[key]);if(!Number.isSafeInteger(result)||result<min||result>max)throw new RangeError(key+' outside '+min+'..'+max);return result;
};
const durationMs=integer('duration-ms',60000,1000,7200000),checkpointMs=integer('checkpoint-ms',60000,1000,600000);
if(!options.output||!path.isAbsolute(options.output))throw new TypeError('--output must name an existing absolute local directory');
const output=explicitLocalFilePath(path.resolve(options.output)),stat=await fs.lstat(output);if(!stat.isDirectory()||stat.isSymbolicLink())throw new TypeError('Existing regular output directory required');
const instanceId='run:'+randomUUID();
let controller;
if(options.resume){
  if(['tick-ms','profiles','scenario'].some(key=>Object.hasOwn(options,key)))throw new TypeError('Resume uses the saved scenario; omit recipe overrides');
  const loaded=await readCheckpointFile(options.resume),restored=restoreScenarioCheckpoint(loaded.text);
  controller=new ModelController({scenario:restored.descriptor.name,parameters:restored.descriptor.parameters});controller.current=restored;controller.resetBalance();
}else{
  const scenario=options.scenario??'profiles';
  const parameters={tickMs:integer('tick-ms',1000,1,1000),instanceId};
  if(scenario==='profiles')parameters.profileCount=integer('profiles',8,1,1000);
  else if(Object.hasOwn(options,'profiles'))throw new TypeError('--profiles belongs to profiles scenario');
  controller=new ModelController({scenario,parameters});
}
const sourceFiles=['./persisted-runner.mjs','../src/open-world.mjs','../src/sha256.mjs','../src/json-data.mjs','../src/operators.mjs','../src/genetic-code.mjs',
  '../src/biology-world.mjs','../src/registry-data.mjs','../src/scenarios.mjs','../src/controller.mjs','../src/checkpoint.mjs','../src/node-checkpoint-store.mjs'];
const moduleRoot=fileURLToPath(new URL('../',import.meta.url));
const sourceDigests=await Promise.all(sourceFiles.map(async relative=>{const file=fileURLToPath(new URL(relative,import.meta.url));return {file:path.relative(moduleRoot,file).split(path.sep).join('/'),sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex')};}));
const start={schema:'halveth.persisted-model-run.v1',startedAt:new Date().toISOString(),requestedDurationMs:durationMs,checkpointMs,
  descriptor:controller.current.descriptor,resumed:Boolean(options.resume),startTick:controller.world.tick,startHead:controller.world.head,
  runtime:process.version,sourceDigests,sourceBinding:'DECLARED_LOCAL_DEPENDENCY_FILES_READ_AFTER_IMPORT; NOT_AN_ATOMIC_LOADER_ATTESTATION',scope:'LOCAL_MODEL_ONLY',powerFailureSurvival:'NOT_TESTED'};
await writeCheckpointFile(path.join(output,'run-start.json'),JSON.stringify(start));
console.log(JSON.stringify({type:'RUN_STARTED',...start}));
let stopReason=null,checkpointNumber=0,lastCheckpoint=0,accountedWall=0;const began=performance.now();
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{stopReason=signal;});
controller.running=true;
async function checkpoint(name){
  const text=exportScenarioCheckpoint(controller.current),target=path.join(output,name);
  const write=await writeCheckpointFile(target,text),read=await readCheckpointFile(target);
  if(read.text!==text||read.receipt.sha256!==write.sha256)throw new Error('Persisted checkpoint readback differs');
  const reopened=restoreScenarioCheckpoint(read.text);
  if(reopened.world.head!==controller.world.head||reopened.world.tick!==controller.world.tick)throw new Error('Reopened model differs');
  const result={type:'CHECKPOINT_VERIFIED',recordedAt:new Date().toISOString(),wallElapsedMs:performance.now()-began,tick:controller.world.tick,head:controller.world.head,
    eventCount:controller.world.events.length,bytes:write.bytes,sha256:write.sha256,file:name,fileSyncCompleted:write.fileSyncCompleted,directorySyncCompleted:write.directorySyncCompleted};
  console.log(JSON.stringify(result));return result;
}
let error=null,lastVerified=null;
try{
  while(!stopReason){
    const now=performance.now(),elapsed=Math.min(now-began,durationMs);
    controller.advanceRuntime(elapsed-accountedWall);accountedWall=elapsed;
    if(elapsed>=durationMs){stopReason='DURATION_REACHED';break;}
    if(now-began-lastCheckpoint>=checkpointMs){lastVerified=await checkpoint(`checkpoint-${String(++checkpointNumber).padStart(6,'0')}.json`);lastCheckpoint=performance.now()-began;}
    await new Promise(resolve=>setTimeout(resolve,Math.min(controller.world.tickMs,1000)));
  }
}catch(caught){error=caught;stopReason='CONTROLLED_ERROR';}
controller.running=false;
try{lastVerified=await checkpoint('final.json');}catch(caught){error??=caught;}
const end={schema:'halveth.persisted-model-result.v1',endedAt:new Date().toISOString(),startedAt:start.startedAt,stopReason,wallElapsedMs:performance.now()-began,
  startTick:start.startTick,endTick:controller.world.tick,modelDeltaMs:(controller.world.tick-start.startTick)*controller.world.tickMs,
  endHead:controller.world.head,eventCount:controller.world.events.length,audit:controller.world.audit(),runtime:controller.runtime,
  checkpoints:checkpointNumber,lastVerified,error:error?.message??null,sourceDigests,coverage:'SAMPLED_CALLBACKS_AND_VERIFIED_CHECKPOINTS; NO_ZERO_GAP_OR_POWER_LOSS_CLAIM'};
await writeCheckpointFile(path.join(output,'run-result.json'),JSON.stringify(end));
console.log(JSON.stringify({type:'RUN_FINISHED',...end}));if(error||!end.audit.passed)process.exitCode=1;
