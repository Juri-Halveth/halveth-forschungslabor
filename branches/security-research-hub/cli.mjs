// SPDX-License-Identifier: MIT
import fs from 'node:fs';
import { buildPlan, planMarkdown, runFixture } from './model.mjs';

const args=process.argv.slice(2);
try {
  if (args.length===2&&args[0]==='fixture') console.log(JSON.stringify(runFixture(args[1]),null,2));
  else if (args.length>=2&&args.length<=3&&args[0]==='plan'&&(!args[2]||args[2]==='--markdown')) {
    const stat=fs.statSync(args[1]);if(!stat.isFile()||stat.size>16384)throw Error('Eingabedatei: höchstens 16384 Bytes');
    const plan=buildPlan(JSON.parse(fs.readFileSync(args[1],'utf8')));
    console.log(args[2]==='--markdown'?planMarkdown(plan):JSON.stringify(plan,null,2));
  } else throw Error('Nutzung: node cli.mjs fixture serialization|identity|lifecycle|finality ODER node cli.mjs plan datei.json [--markdown]');
} catch(error) {console.error(error.message);process.exitCode=2;}
