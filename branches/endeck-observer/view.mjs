// SPDX-License-Identifier: MIT
import { IDs, source, observeXY, distinct } from "./model.mjs";
import { chartPoint, groupProjection, placeLabels, axisLabels } from "./geometry.mjs";
import { LESSONS, decodeProgress, encodeProgress, recordAnswer } from "./learning.mjs";

const el = (id) => document.getElementById(id);
const media = matchMedia("(prefers-reduced-motion: reduce)");
const STORAGE_KEY = "halveth.endeck.learning.v1";
const state = { mode: "projection", t: 1, tilt: 64, path: "straight" };
let completed = [], running = false, frame = 0, cameraFrame = 0, startAt = null, startT = 0, lastStatus = "";

function svgNode(name, attributes = {}, text) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key,value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}
const series = (id) => `var(--series-${IDs.indexOf(id)+1})`;

function plot(svg, spatial) {
  const width = svg.getBoundingClientRect().width, height = svg.getBoundingClientRect().height;
  if (width < 180 || height < 180) return;
  const tilt = spatial ? state.tilt : 0;
  const point = (p) => chartPoint(p, width, height, tilt);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.replaceChildren();
  const line = (a,b,attributes = {}) => {
    const p = point(a), q = point(b);
    svg.append(svgNode("line", { x1:p.x, y1:p.y, x2:q.x, y2:q.y, class:"grid", ...attributes }));
  };
  for (let i = -2; i <= 2; i++) {
    line({x:i,y:-2,z:0},{x:i,y:2,z:0});
    line({x:-2,y:i,z:0},{x:2,y:i,z:0});
  }
  if (spatial && tilt > 1) line({x:0,y:0,z:-1.6},{x:0,y:0,z:1.6});
  function polygon(points, opacity = 1) {
    svg.append(svgNode("polygon", { points:points.map((p) => { const q=point(p); return `${q.x},${q.y}`; }).join(" "), class:"shape", opacity }));
  }
  function dots(points, opacity = 1, labels = true) {
    const groups = groupProjection(points, tilt);
    for (const group of groups) {
      const p = point(group[0]);
      group.forEach((item,i) => {
        svg.append(svgNode("circle", { cx:p.x, cy:p.y, r:5+i*3.5, fill:i ? "none" : series(item.id), stroke:series(item.id), "stroke-width":1.8, opacity }));
      });
    }
    if (labels) for (const label of placeLabels(groups,width,height,tilt)) {
      const endX = label.x > label.point.x ? label.x-4 : label.x+label.width+4;
      if (Math.hypot(endX-label.point.x,label.baseline-label.point.y) > 29)
        svg.append(svgNode("line", {x1:label.point.x,y1:label.point.y,x2:endX,y2:label.baseline-4,class:"label-guide"}));
      svg.append(svgNode("text", {x:label.x,y:label.baseline,class:"point-label",opacity},label.text));
    }
  }
  if (state.mode === "history" && !spatial) {
    for (const [t, opacity] of [[0,.55],[1,.95]]) {
      const points = source("history",t);
      polygon(points,opacity); dots(points,opacity,false);
      const p = point({x:-1.25+2.5*t,y:-1.7,z:0});
      svg.append(svgNode("text",{x:p.x,y:p.y+10,"text-anchor":"middle",class:"axis-label"},`t = ${t}`));
    }
  } else {
    if (state.mode === "history") for (const path of ["straight","arc"]) {
      const curve = Array.from({length:61}, (_,i) => {
        const points=source("history",i/60,path), p=point({x:points.reduce((s,p)=>s+p.x,0)/4,y:points.reduce((s,p)=>s+p.y,0)/4,z:0});
        return `${p.x},${p.y}`;
      }).join(" ");
      svg.append(svgNode("polyline",{points:curve,fill:"none",stroke:path===state.path?"var(--accent)":"var(--muted)","stroke-width":path===state.path?2:1,"stroke-dasharray":path===state.path?"none":"3 6",opacity:path===state.path ? 0.9 : 0.35}));
    }
    const points=source(state.mode,state.t,state.path);
    if (spatial && state.mode === "projection" && tilt > 1)
      for (const p of points) line(p,{...p,z:0},{class:"guide"});
    polygon(points); dots(points);
  }
  for (const label of axisLabels(width,height,tilt))
    svg.append(svgNode("text",{x:label.x,y:label.y,class:"axis-label"},label.name));
}
function render() {
  el("endeck-mode").value=state.mode;
  el("endeck-time").value=String(Math.round(state.t*3000));
  el("endeck-clock").textContent=state.t.toLocaleString("de-DE",{minimumFractionDigits:3,maximumFractionDigits:3});
  el("endeck-play").textContent=running?"Anhalten":media.matches?"Endzustand zeigen":"Ablauf zeigen";
  el("endeck-play").setAttribute("aria-pressed",String(running));
  el("endeck-playback").textContent=running?"Läuft · Die Punkte bewegen sich automatisch.":state.t===0?"Bereit · Starte den Ablauf.":state.t===1?"Am Ende · Starte den Ablauf erneut.":"Pausiert · Du kannst hier fortsetzen.";
  el("endeck-reset").disabled=state.t===0&&!running;
  el("endeck-tilt").setAttribute("aria-pressed",String(state.tilt>20));
  el("camera-label").textContent=`${Math.round(state.tilt)}° · x / y / z`;
  el("endeck-path-controls").hidden=state.mode!=="history";
  el("endeck-straight").setAttribute("aria-pressed",String(state.path==="straight"));
  el("endeck-arc").setAttribute("aria-pressed",String(state.path==="arc"));
  const points=source(state.mode,state.t,state.path), n2=distinct(observeXY(points),["x","y"]), n3=distinct(points,["x","y","z"]);
  let status;
  if (state.mode === "history") {
    el("flat-caption").textContent="Gespeichert: Anfang und Ende.";
    el("space-caption").textContent="Gewählter Modellpfad: "+(state.path==="arc"?"Bogen.":"Gerade.");
    el("endeck-flat-count").textContent="2 gespeicherte Zustände";
    el("endeck-space-count").textContent="2 mögliche Wege · 4 IDs";
    status="Der tatsächliche Zwischenweg bleibt aus diesen zwei Aufnahmen offen.";
  } else {
    el("flat-caption").textContent="Die Tiefe wird ausgeblendet.";
    el("space-caption").textContent=state.tilt>20?"Ein anderer Blick auf dieselben Punkte.":"Draufsicht auf dieselben Punkte.";
    el("endeck-flat-count").textContent=`${n2} ${n2===1?"Bildort":"Bildorte"}`;
    el("endeck-space-count").textContent=`${n3} ${n3===1?"Raumort":"Raumorte"} · 4 IDs`;
    status=n2<n3?"Ein gemeinsames Bild, vier verschiedene Raumorte.":n3===1?"Ein gemeinsamer Ort, vier erhaltene Datensätze.":"Die Orte verändern sich. A, B, C und D bleiben erhalten.";
  }
  const root=el("experiment");
  root.dataset.mode=state.mode; root.dataset.sourcePlaces=String(n3); root.dataset.imagePlaces=state.mode==="history"?"UNKNOWN":String(n2); root.dataset.progress=String(state.t);
  if (status!==lastStatus) { el("endeck-status").textContent=status; lastStatus=status; }
  plot(el("endeck-flat"),false); plot(el("endeck-space"),true);
}
function stop() { running=false; cancelAnimationFrame(frame); }
function stopAll() { stop(); cancelAnimationFrame(cameraFrame); }
function animate(now) {
  if (!running) return;
  // Both timestamps belong to the frame clock. The first rAF timestamp can
  // precede performance.now() at the click that requested this frame.
  startAt ??= now;
  state.t=Math.min(1,startT+Math.max(0,now-startAt)/8000);
  if (state.t===1) stop();
  render();
  if (running) frame=requestAnimationFrame(animate);
}
el("endeck-play").addEventListener("click",()=>{
  if (running) { stop(); render(); return; }
  if (media.matches) { state.t=1; render(); return; }
  if (state.t===1) state.t=0;
  startT=state.t; startAt=null; running=true; render(); frame=requestAnimationFrame(animate);
});
el("endeck-reset").addEventListener("click",()=>{stopAll();state.t=0;render();});
el("endeck-time").addEventListener("input",()=>{stop();state.t=Number(el("endeck-time").value)/3000;render();});
el("endeck-mode").addEventListener("change",()=>{stopAll();state.mode=el("endeck-mode").value;state.t=0;state.path="straight";render();renderLesson();});
el("endeck-tilt").addEventListener("click",()=>{
  cancelAnimationFrame(cameraFrame);
  const from=state.tilt, to=state.tilt>20?0:64;
  let start=null;
  if (media.matches) {state.tilt=to;render();return;}
  const tick=(now)=>{start??=now;const t=Math.min(1,Math.max(0,now-start)/600);state.tilt=from+(to-from)*t*t*(3-2*t);render();if(t<1)cameraFrame=requestAnimationFrame(tick);};
  cameraFrame=requestAnimationFrame(tick);
});
for (const path of ["straight","arc"])
  el("endeck-"+path).addEventListener("click",()=>{state.path=path;render();});

function showProgress() {
  el("learning-count").textContent=`${completed.length} / 4`;
  el("learning-progress").value=completed.length;
  el("learning-progress").textContent=`${completed.length} von 4`;
}
function persistProgress() {
  try {localStorage.setItem(STORAGE_KEY,encodeProgress(completed));el("storage-note").textContent="Nur der Lernstand bleibt in diesem Browser gespeichert.";}
  catch {el("storage-note").textContent="Dein Lernstand bleibt für diese geöffnete Seite erhalten; Browserspeicherung ist hier nicht verfügbar.";}
}
function renderLesson() {
  const mode=state.mode, lesson=LESSONS[mode];
  el("lesson-question").textContent=lesson.question;
  el("lesson-answers").replaceChildren();
  el("lesson-feedback").dataset.outcome="open";
  el("lesson-feedback").textContent=completed.includes(mode)?"Diesen Vergleich hast du bereits gelöst. Du kannst ihn erneut prüfen.":"Wähle eine Antwort und prüfe deine Vermutung am Modell.";
  for (const [id,label] of lesson.options) {
    const button=document.createElement("button");button.type="button";button.textContent=label;button.dataset.answer=id;
    button.addEventListener("click",()=>{
      const result=recordAnswer(completed,mode,id);completed=result.completed;
      for (const item of el("lesson-answers").children) delete item.dataset.answerState;
      button.dataset.answerState=result.correct?"correct":"incorrect";
      el("lesson-feedback").dataset.outcome=result.correct?"correct":"retry";
      el("lesson-feedback").textContent=result.correct?result.explanation:"Probiere den Zeitregler oder kippe den Blick. Danach kannst du eine andere Antwort wählen.";
      showProgress();persistProgress();
    });
    el("lesson-answers").append(button);
  }
  showProgress();
}
let savedProgress;
try {savedProgress=localStorage.getItem(STORAGE_KEY);}
catch {el("storage-note").textContent="Dein Lernstand bleibt für diese geöffnete Seite erhalten; Browserspeicherung ist hier nicht verfügbar.";}
if(savedProgress!==undefined)try {completed=decodeProgress(savedProgress);}
catch {el("storage-note").textContent="Ein gespeicherter Lernstand konnte nicht übernommen werden. Hier beginnt ein neuer Lernstand mit 0 / 4.";}
el("clear-progress").addEventListener("click",()=>{completed=[];persistProgress();renderLesson();});
addEventListener("storage",event=>{
  if (event.key!==STORAGE_KEY) return;
  try {completed=decodeProgress(event.newValue);renderLesson();}
  catch {el("storage-note").textContent="Ein geänderter Lernstand ist ungültig. Der hier angezeigte Stand bleibt erhalten.";}
});
document.addEventListener("visibilitychange",()=>{if(document.hidden){stopAll();render();}});
media.addEventListener("change",()=>{stopAll();render();});
new ResizeObserver(()=>render()).observe(el("experiment"));
render();renderLesson();
document.documentElement.dataset.endeckReady="true";
