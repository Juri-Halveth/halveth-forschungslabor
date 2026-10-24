// SPDX-License-Identifier: MIT
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {runtimeObservation,identityObservation,validBrotliRoundtrip} from './runtime.mjs';
import {runHttpSelfTest,startHttpLab} from './http-fixture.mjs';
import {localSuite} from './core.mjs';

export async function runCli(args){
  const [command,...rest]=args;
  if(command==='runtime'&&(rest.length===0||rest.length===1&&rest[0]==='--require-patch')){
    const result=runtimeObservation();
    return {result,exit:rest.length&&result.assessment.status!=='MEETS_PATCH_FLOOR'?2:0};
  }
  if(command==='identity'&&rest.length===1)return {result:identityObservation(rest[0]),exit:0};
  if(command==='selftest'&&!rest.length){const result=await runHttpSelfTest();return {result,exit:result.result==='PASS'?0:1};}
  if(command==='report'&&!rest.length){const result={runtime:runtimeObservation(),identity:['127.0.0.1','１２７.0.0.1','0127.0.0.1'].map(identityObservation),brotli:validBrotliRoundtrip(),models:localSuite(),http:await runHttpSelfTest()};return {result,exit:result.http.result==='PASS'?0:1};}
  if(['lab','lab-defect'].includes(command)&&!rest.length){
    if(runtimeObservation().assessment.status!=='MEETS_PATCH_FLOOR')throw Error('Für den Labordienst wird eine Node-Laufzeit ab dem datierten Patchstand benötigt. Zuerst runtime --require-patch prüfen.');
    const lab=await startHttpLab({guard:command==='lab'});
    process.once('SIGINT',()=>void lab.close());process.once('SIGTERM',()=>void lab.close());
    return {result:{mode:command,url:`http://127.0.0.1:${lab.port}/lab/document`,labToken:lab.token,headers:{'X-Lab-Token':lab.token,'X-Demo-Owner':'alice'},requestBudget:lab.requestBudget,expiresAfterMinutes:lab.expiresAfterMinutes,
      note:'Nur eigene synthetische Metadaten. Diese kurzlebige Ausgabe bleibt privat; den Schlüssel nicht veröffentlichen. X-Demo-Owner:bob prüft die Subjektgrenze. Beenden: Strg+C.'},exit:0};
  }
  throw Error('Aufruf: node branches/security-workbench/cli.mjs runtime [--require-patch] | identity HOST | selftest | report | lab | lab-defect. Es gibt keinen Ziel-URL-Parameter.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{const {result,exit}=await runCli(process.argv.slice(2));console.log(JSON.stringify(result,null,2));process.exitCode=exit;}
  catch(e){console.error(e.message);process.exitCode=1;}
}
