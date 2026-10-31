// SPDX-License-Identifier: MIT
// Four projections of the same UV-bound material sheet. Canvas pixels are a
// view of the model, never a second source of sheet identity.
import {DEFAULTS, foldState} from "./model.js";
import {sheetLimit, sheetMesh, sheetPoint, sheetStages, SHEET_ID} from "./sheet-motion.js";

const projections = Object.freeze({
  spatial: {name:"Raum", point:p=>({x:(p.x-p.y)*.86, y:(p.x+p.y)*.34-p.z*.82}), depth:p=>p.x+p.y+p.z},
  top: {name:"Oben", point:p=>({x:p.x, y:p.y}), depth:p=>p.z},
  front: {name:"Vorn", point:p=>({x:p.x, y:-p.z}), depth:p=>p.y},
  side: {name:"Seite", point:p=>({x:p.y, y:-p.z}), depth:p=>p.x},
});

const minus = (a,b) => ({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const cross = (a,b) => ({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const magnitude = a => Math.hypot(a.x,a.y,a.z);

function colorFor(normal) {
  const n = magnitude(normal) || 1;
  // Paper pigment is the same on both sides. Weak directional shading helps
  // read the bend without turning painter-order differences into a pattern.
  const light = .9 + (normal.x*.025-normal.y*.03+normal.z*.025)/n;
  return `rgb(${[242,220,184].map(channel=>Math.round(channel*light)).join(",")})`;
}

function drawPath(ctx, points, project, close = false) {
  ctx.beginPath();
  points.forEach((point,index)=>{
    const p=project(point);
    if (index===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);
  });
  if (close) ctx.closePath();
}

function niceLength(value) {
  const base = 10 ** Math.floor(Math.log10(value));
  return [1,2,5,10].map(n=>n*base)
    .reduce((best,n)=>Math.abs(n-value)<Math.abs(best-value)?n:best);
}

function lengthLabel(length) {
  return length >= .001 ? `${Number(length.toPrecision(2))} m`
    : `${Number((length*1000).toPrecision(2))} mm`;
}

function creaseCenter(stage, progress, s) {
  if (progress === 0) return {x:s,z:0,angle:0};
  const theta = Math.PI * progress, a = stage.halfBandM;
  const r = 2*a/theta;
  if (s <= -a) return {x:s,z:0,angle:0};
  const phi = s < a ? (s+a)/r : theta;
  const after = Math.max(0,s-a);
  return {x:-a+r*Math.sin(phi)+after*Math.cos(theta),
    z:r*(1-Math.cos(phi))+after*Math.sin(theta),angle:phi};
}

function drawCreaseProfile(ctx, width, height, stage, progress, thicknessM) {
  const boxW = Math.min(218,width*.38), boxH = Math.min(126,height*.34);
  if (boxW < 145 || boxH < 90) return;
  const left=width-boxW-18, top=18;
  ctx.fillStyle="rgba(7,21,31,.88)"; ctx.strokeStyle="rgba(133,211,213,.42)";
  ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(left,top,boxW,boxH,10);ctx.fill();ctx.stroke();
  ctx.fillStyle="#a9d8d7";ctx.font="600 10px system-ui";
  ctx.fillText("BIEGELINIE · EIGENER MASSSTAB",left+12,top+18);
  const a=stage.halfBandM;
  const samples=[];
  for(let i=0;i<=72;i++) samples.push(creaseCenter(stage,progress,-2*a+4*a*i/72));
  const xs=samples.map(p=>p.x), zs=samples.map(p=>p.z);
  const x0=Math.min(...xs)-thicknessM,x1=Math.max(...xs)+thicknessM;
  const z0=Math.min(...zs)-thicknessM,z1=Math.max(...zs)+thicknessM;
  const scale=Math.min((boxW-26)/Math.max(x1-x0,1e-12),
    (boxH-53)/Math.max(z1-z0,thicknessM*3));
  const px=p=>left+13+(p.x-x0)*scale;
  const pz=p=>top+boxH-12-(p.z-z0)*scale;
  ctx.beginPath();
  samples.forEach((p,i)=>{
    const q={x:p.x-thicknessM/2*Math.sin(p.angle),
      z:p.z+thicknessM/2*Math.cos(p.angle)};
    if(i===0)ctx.moveTo(px(q),pz(q));else ctx.lineTo(px(q),pz(q));
  });
  ctx.strokeStyle="#ffdc9e";ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();
  samples.forEach((p,i)=>{
    const q={x:p.x+thicknessM/2*Math.sin(p.angle),
      z:p.z-thicknessM/2*Math.cos(p.angle)};
    if(i===0)ctx.moveTo(px(q),pz(q));else ctx.lineTo(px(q),pz(q));
  });
  ctx.strokeStyle="#84c8cd";ctx.lineWidth=1.4;ctx.stroke();
  ctx.fillStyle="#9db8c4";ctx.font="10px system-ui";
  ctx.fillText(`R = ${(stage.radiusM*1000).toPrecision(2)} mm bei 180°`,left+12,top+boxH-7);
}

export class SheetRenderer {
  constructor(canvas) {
    this.canvas=canvas;
    this.ctx=canvas.getContext("2d");
    this.view="spatial";
  }

  setView(view) {
    if (!Object.hasOwn(projections,view)) throw new RangeError("unknown projection");
    this.view=view;
  }

  draw(completedFolds,progress=0) {
    const canvas=this.canvas,ctx=this.ctx;
    const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
    const dpr=Math.min(window.devicePixelRatio||1,2);
    if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const limit=sheetLimit();
    if(completedFolds>limit){
      const state=foldState(completedFolds);
      ctx.textAlign="center";ctx.fillStyle="#e9d49c";ctx.font="700 28px system-ui";
      ctx.fillText(`${completedFolds} · FORMEL`,width/2,height/2-25);
      ctx.fillStyle="#adc5ca";ctx.font="15px system-ui";
      ctx.fillText("Kein berechnetes Papierobjekt",width/2,height/2+8);
      ctx.fillText(`2^${completedFolds} ideale Lagen · reine Extrapolation`,width/2,height/2+36);
      return {mode:"FORMAL",footprintSubpixel:false,physicalFootprintPx:0,
        materialAreaM2:DEFAULTS.widthM*DEFAULTS.heightM,
        idealLayers:state.stack.layers};
    }
    const mesh=sheetMesh(completedFolds,progress);
    const view=projections[this.view];
    const projected=mesh.vertices.map(view.point);
    const minX=Math.min(...projected.map(p=>p.x)),maxX=Math.max(...projected.map(p=>p.x));
    const minY=Math.min(...projected.map(p=>p.y)),maxY=Math.max(...projected.map(p=>p.y));
    const spanX=Math.max(maxX-minX,1e-9),spanY=Math.max(maxY-minY,1e-9);
    const scale=Math.min(width*.76/spanX,height*.64/spanY);
    const cx=width/2-(minX+maxX)*scale/2,cy=height/2-(minY+maxY)*scale/2;
    const project=p=>{const q=view.point(p);return{x:cx+q.x*scale,y:cy+q.y*scale};};
    const faces=mesh.faces.map(indices=>{
      const [a,b,c]=indices.map(i=>mesh.vertices[i]);
      const normal=cross(minus(b,a),minus(c,a));
      return {indices,normal,layerZ:(a.z+b.z+c.z)/3,
        depth:(view.depth(a)+view.depth(b)+view.depth(c))/3};
    }).sort((a,b)=>a.layerZ-b.layerZ || a.depth-b.depth);
    for(const face of faces){
      drawPath(ctx,face.indices.map(i=>mesh.vertices[i]),project,true);
      ctx.fillStyle=colorFor(face.normal);ctx.fill();
      // Adjacent Canvas triangles otherwise expose antialiased hairline gaps.
      ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.75;ctx.stroke();
    }
    const row=mesh.u.length,col=mesh.v.length;
    // A complete UV wireframe is not a visible-surface wireframe. At later
    // folds it would paint hidden back edges over the front of the packet.
    if (completedFolds < 3) {
      ctx.strokeStyle="rgba(66,109,116,.36)";ctx.lineWidth=.8;
      for(let i=0;i<row;i+=Math.max(1,Math.floor(row/10))){
        drawPath(ctx,Array.from({length:col},(_,j)=>mesh.vertices[j*row+i]),project);ctx.stroke();
      }
      for(let j=0;j<col;j+=Math.max(1,Math.floor(col/8))){
        drawPath(ctx,mesh.vertices.slice(j*row,(j+1)*row),project);ctx.stroke();
      }
      const edge=[];
      for(let i=0;i<row;i++)edge.push(mesh.vertices[i]);
      for(let j=1;j<col;j++)edge.push(mesh.vertices[j*row+row-1]);
      for(let i=row-2;i>=0;i--)edge.push(mesh.vertices[(col-1)*row+i]);
      for(let j=col-2;j>0;j--)edge.push(mesh.vertices[j*row]);
      drawPath(ctx,edge,project,true);ctx.strokeStyle="#fff0c6";ctx.lineWidth=1.6;ctx.stroke();
    }
    const marker=sheetPoint(DEFAULTS.widthM*.34,DEFAULTS.heightM*.25,completedFolds,progress);
    const mp=project(marker);ctx.beginPath();ctx.arc(mp.x,mp.y,5,0,Math.PI*2);
    ctx.fillStyle="#6de4df";ctx.fill();ctx.strokeStyle="#072331";ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle="#d6ffff";ctx.font="600 11px system-ui";ctx.textAlign="left";
    ctx.fillText("M17",mp.x+9,mp.y-8);
    const desired=110/scale;
    if(Number.isFinite(desired)&&desired>0){
      const length=niceLength(desired),pixelLength=length*scale;
      if(pixelLength>20&&pixelLength<width*.35){
        const bx=width-30-pixelLength,by=height-27;
        ctx.strokeStyle="#a8d5d5";ctx.lineWidth=1.4;ctx.beginPath();
        ctx.moveTo(bx,by);ctx.lineTo(bx+pixelLength,by);
        ctx.moveTo(bx,by-5);ctx.lineTo(bx,by+5);
        ctx.moveTo(bx+pixelLength,by-5);ctx.lineTo(bx+pixelLength,by+5);ctx.stroke();
        ctx.fillStyle="#c4d6d6";ctx.font="12px system-ui";ctx.textAlign="right";
        ctx.fillText(lengthLabel(length),width-30,by-10);
      }
    }
    if(completedFolds<limit)
      drawCreaseProfile(ctx,width,height,sheetStages()[completedFolds],progress,DEFAULTS.thicknessM);
    ctx.textAlign="left";ctx.fillStyle="rgba(223,245,239,.86)";ctx.font="11px system-ui";
    ctx.fillText(`${SHEET_ID} · ${view.name} · UV-Materialfläche`,20,height-22);
    return {mode:"MATERIAL_SHEET_KINEMATIC",footprintSubpixel:Math.max(spanX,spanY)*scale<1,
      physicalFootprintPx:Math.max(spanX,spanY)*scale,
      materialAreaM2:mesh.materialAreaM2,vertices:mesh.vertices.length};
  }
}
