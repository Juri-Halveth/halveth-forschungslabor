import {buildScenario} from '../src/scenarios.mjs';
if(process.argv.length!==3||!/^[1-9][0-9]*$/.test(process.argv[2]))throw new TypeError('Use profile-index.mjs COUNT with COUNT 1..1000');
const {world}=buildScenario('profiles',{profileCount:Number(process.argv[2])});world.advance(1000);
console.log(JSON.stringify({fixture:'SELF_CREATED_SYNTHETIC_PROFILES',profiles:world.entities.size-1,channels:world.channels.size,modelMs:world.timeMs,audit:world.audit()},null,2));
