// SPDX-License-Identifier: MIT
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { LESSONS } from "../branches/endeck-observer/learning.mjs";

const root=path.resolve(import.meta.dirname,"..");
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
const escape=text=>String(text).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const github="https://github.com/Juri-Halveth/halveth-forschungslabor/";
export function safeSourcePath(value){
  if(value==="README.md")return value;
  if(typeof value!=="string"||!value||value.startsWith("/")||value.includes("\\")||value.split("/").some(p=>!p||p===".."||p==="."||p.startsWith("."))||! /^(branches|research|scripts)\//.test(value))throw Error("Invalid public source path");
  return value;
}
export async function learningArtifacts(repoRoot=root){
  const registry=JSON.parse(await fs.readFile(path.join(repoRoot,"catalog/learning-paths.json"),"utf8"));
  if(registry.schema!=="halveth.learning-paths.v1"||!Array.isArray(registry.entries)||!registry.entries.length||new Set(registry.entries.map(e=>e.id)).size!==registry.entries.length)throw Error("Invalid learning registry");
  const bindings=[];
  for(const entry of registry.entries){
    if(!/^[a-z0-9-]+$/.test(entry.id)||typeof entry.title!=="string"||typeof entry.description!=="string"||!Array.isArray(entry.tests)||!entry.tests.length)throw Error("Invalid learning entry");
    if(entry.demo!==null&&!/^(?:endeck\/|lifecycle\/|sicherheitslabor\/|security\/|code\/|index.html#experiment|signals.html#signal-experiment)$/.test(entry.demo))throw Error("Unapproved demonstration route");
    const files=[];
    for(const sourcePath of [...new Set([entry.source,entry.docs,...entry.tests])]){
      safeSourcePath(sourcePath);
      const target=path.join(repoRoot,sourcePath), stat=await fs.lstat(target);
      if(!stat.isFile()||stat.isSymbolicLink())throw Error("Expected regular source: "+sourcePath);
      const bytes=await fs.readFile(target);files.push({path:sourcePath,bytes:bytes.length,sha256:hash(bytes)});
    }
    bindings.push({...entry,files});
  }
  const branchDirs=(await fs.readdir(path.join(repoRoot,"branches"),{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>"branches/"+e.name);
  const researchDirs=(await fs.readdir(path.join(repoRoot,"research"),{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>"research/"+e.name);
  for(const dir of [...branchDirs,...researchDirs])if(!bindings.some(e=>e.source.startsWith(dir+"/")))throw Error("Unregistered module directory: "+dir);
  const routes={schema:"halveth.bound-learning-routes.v1",scope:"Current repository branches and research directories; no claim of other GitHub repositories being audited",learningMode:"REVIEWED_CASES_AND_REGRESSION_TESTS",modelWeightTraining:false,entries:bindings};
  const cards=bindings.map(entry=>`<article class="route"><p class="eyebrow">${entry.demo?"AUSPROBIEREN & WEITERBAUEN":"QUELLCODE & PRÜFUNG"}</p><h2>${escape(entry.title)}</h2><p>${escape(entry.description)}</p><nav aria-label="${escape(entry.title)}">${entry.demo?`<a class="demo-link" href="../${entry.demo}">Ansicht öffnen ↗</a>`:""}<a href="${github}blob/main/${entry.source}">Code</a><a href="${github}blob/main/${entry.tests[0]}">Tests</a><a href="${github}blob/main/${entry.docs}">Erklärung</a></nav></article>`).join("\n");
  const html=`<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Die HALVETH-Arbeitsbereiche mit konkretem Quellcode, Gegenbeispielen und Tests. Vom Experiment bis zum überprüfbaren GitHub-Stand."><title>Wissen & Code · HALVETH</title><link rel="stylesheet" href="../endeck/style.css"><link rel="stylesheet" href="style.css"></head>
<body><a class="skip" href="#arbeitsbereiche">Zu den Arbeitsbereichen</a><header class="site-header"><a class="brand" href="../#experiment">HALVETH <span>/ WISSEN & CODE</span></a><nav aria-label="Seitennavigation"><a href="../endeck/">ENDECK</a><a href="../lifecycle/">Nachhall</a><a href="${github}">GitHub ↗</a></nav></header><main>
<section class="intro"><p class="eyebrow">DER GITHUB-TUNNEL</p><h1>Vom Aha zum getesteten Code.</h1><p class="lead">Eine Beobachtung wird zum Beispiel. Eine Gegenprobe prüft die Regel. Ein Test hält das Gelernte für die nächste Änderung fest.</p><p class="scope">${bindings.length} Einstiegspunkte · ${branchDirs.length} Modulordner · ${researchDirs.length} Forschungsbereiche in diesem Repository</p></section>
<ol class="pipeline"><li><strong>Entdecken</strong><span>Eine Frage im Modell untersuchen.</span></li><li><strong>Unterscheiden</strong><span>Ein Gegenbeispiel dazunehmen.</span></li><li><strong>Prüfen</strong><span>Erwartung als Test festhalten.</span></li><li><strong>Weiterbauen</strong><span>Änderung per Pull Request prüfen.</span></li></ol>
<section id="arbeitsbereiche" class="routes" aria-label="Alle registrierten Arbeitsbereiche">${cards}</section>
<section class="knowledge-section"><div><p class="eyebrow">WAS HIER LERNFÄHIG WIRD</p><h2>Neue Fälle bleiben prüfbar.</h2><p>Das Wissensregister wächst durch bearbeitete Beispiele und Gegenproben. GitHub führt die Tests bei Änderungen erneut aus. Der persönliche Lernstand in ENDECK bleibt lokal im Browser; Modellgewichte werden dabei nicht trainiert.</p></div><div class="knowledge-links"><a href="routes.json">Maschinenlesbare Wege mit Dateihashes</a><a href="LEARNING_PIPELINE.md">Einstieg für Programme und Mitwirkende</a><a href="${github}actions">Aktuelle Prüfläufe ↗</a><a href="${github}issues/new?template=experiment-regression.yml">Beobachtung als neuen Fall vorschlagen</a><a href="../release.json">Veröffentlichter Quellstand</a></div></section>
</main><footer><p>Juri · Projekt HALVETH · Entwicklung mit KI-Unterstützung</p><p>Code: MIT · Texte: CC BY 4.0 · Metadaten: CC0</p></footer></body></html>\n`;
  const modelBytes=await fs.readFile(path.join(repoRoot,"branches/endeck-observer/model.mjs"));
  const knowledge={schema:"halveth.endeck-knowledge.v1",version:"1.1.0",learningMode:"EXPLICIT_LESSONS_AND_TESTED_COUNTEREXAMPLES",modelWeightTraining:false,source:{path:"branches/endeck-observer/model.mjs",sha256:hash(modelBytes)},records:Object.entries(LESSONS).map(([id,lesson])=>({id,question:lesson.question,answer:lesson.explanation,scope:"DECLARED_GEOMETRIC_MODEL",evidence:["branches/endeck-observer/model.test.mjs","branches/endeck-observer/learning.test.mjs"],reopenTrigger:"A changed model rule or a counterexample that violates the stated property"}))};
  return new Map([["catalog/wissen/index.html",html],["catalog/wissen/routes.json",JSON.stringify(routes,null,2)+"\n"],["branches/endeck-observer/KNOWLEDGE.json",JSON.stringify(knowledge,null,2)+"\n"]]);
}
export async function checkLearningArtifacts(repoRoot=root){
  const artifacts=await learningArtifacts(repoRoot);
  for(const [name,text]of artifacts)if(await fs.readFile(path.join(repoRoot,name),"utf8")!==text)throw Error("Stale source-bound learning artifact: "+name);
  return artifacts.size;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  if(process.argv.length!==3||!["--check","--write"].includes(process.argv[2]))throw Error("Use --check or --write");
  if(process.argv[2]==="--check")console.log("Checked "+await checkLearningArtifacts()+" source-bound learning artifacts");
  else{for(const [name,text]of await learningArtifacts()){await fs.mkdir(path.dirname(path.join(root,name)),{recursive:true});await fs.writeFile(path.join(root,name),text);}console.log("Wrote three source-bound learning artifacts");}
}
