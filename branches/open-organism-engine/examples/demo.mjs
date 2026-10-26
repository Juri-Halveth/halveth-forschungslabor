import {buildScenario} from '../src/scenarios.mjs';
const {world}=buildScenario('compartments');
if(process.argv.length!==2)throw new TypeError('Use demo.mjs without arguments; the persisted runner has an explicit output path');
world.advance(30_000);
const audit=world.audit();
console.log(JSON.stringify({status:audit.passed?'PASS':'FAIL',worldId:world.worldId,modelMs:world.timeMs,
  entities:world.entities.size,transportRoutes:world.routes.size,processes:world.processes.size,channels:world.channels.size,
  counters:world.counters,head:audit.head,resourceTotals:audit.resourceTotals,violations:audit.violations},null,2));
if(!audit.passed)process.exitCode=1;
