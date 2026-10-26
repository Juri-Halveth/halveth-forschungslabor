import {readHalvethRegistry,profileWorld} from '../src/registry-bridge.mjs';
import pathModule from 'node:path';
if(process.argv.length!==3)throw new TypeError('Use halveth-registry.mjs EXPLICIT_LOCAL_REGISTRY_PATH; input rights remain attached');
const path=pathModule.resolve(process.argv[2]);
const registry=await readHalvethRegistry(path);
const world=profileWorld(registry);
world.advance(120_000);
const audit=world.audit();
console.log(JSON.stringify({source:path,profileCount:registry.entities.length,registered:world.entities.size-1,
  transmitted:world.counters.signalsEmitted,arrived:world.counters.signalsArrived,modelMs:world.timeMs,
  audit: audit.passed?'PASS':'FAIL',violations:audit.violations,head:audit.head},null,2));
if(!audit.passed)process.exitCode=1;
