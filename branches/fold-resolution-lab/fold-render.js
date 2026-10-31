// SPDX-License-Identifier: MIT
// Orthographic projection of the dimensioned rigid-panel fold contract.
import {foldPose, stackBox} from "./fold-motion.js";

const faces = [
  {indices:[0,3,2,1], kind:"bottom"},
  {indices:[4,5,6,7], kind:"top"},
  {indices:[0,1,5,4], kind:"edge"},
  {indices:[1,2,6,5], kind:"edge"},
  {indices:[2,3,7,6], kind:"edge"},
  {indices:[3,0,4,7], kind:"edge"},
];

const rawProjection = p => ({x:(p.x-p.y)*0.86, y:(p.x+p.y)*0.34-p.z*0.82});
const subtract = (a,b) => ({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const cross = (a,b) => ({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});

function visibleFaces(vertices, palette) {
  return faces.flatMap(({indices,kind}) => {
    const a=vertices[indices[0]], b=vertices[indices[1]], c=vertices[indices[2]];
    const normal=cross(subtract(b,a),subtract(c,a));
    if (normal.x+normal.y+normal.z <= 0) return [];
    return [{points:indices.map(i=>vertices[i]), kind, palette,
      depth:indices.reduce((sum,i)=>sum+vertices[i].x+vertices[i].y+vertices[i].z,0)/4}];
  });
}

function drawFace(ctx, points, color, stroke, project) {
  ctx.beginPath();
  points.forEach((point,index)=>{
    const p=project(point);
    if (index===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);
  });
  ctx.closePath(); ctx.fillStyle=color; ctx.fill();
  ctx.lineWidth=1.2; ctx.strokeStyle=stroke; ctx.stroke();
}

function niceLength(value) {
  const power=Math.floor(Math.log10(value));
  const base=10**power;
  return [1,2,5,10].map(multiplier=>multiplier*base)
    .reduce((best,item)=>Math.abs(item-value)<Math.abs(best-value)?item:best);
}

function scaleLabel(length) {
  if (length>=0.01 && length<1000) return `${Number(length.toPrecision(2))} m`;
  return `${length.toExponential(1).replace("e+","e")} m`;
}

export class FoldRenderer {
  constructor(canvas) { this.canvas=canvas; this.ctx=canvas.getContext("2d"); }

  draw(completedFolds, progress=0) {
    const canvas=this.canvas, ctx=this.ctx;
    const width=Math.max(1,canvas.clientWidth), height=Math.max(1,canvas.clientHeight);
    const dpr=Math.min(window.devicePixelRatio||1,2);
    if (canvas.width!==Math.round(width*dpr) || canvas.height!==Math.round(height*dpr)) {
      canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
    const moving=progress>0 && progress<=1;
    const pose=moving?foldPose(completedFolds,progress):null;
    const geometry=moving?[...pose.staticPanel,...pose.rotatingPanel]:stackBox(completedFolds);
    const projected=geometry.map(rawProjection);
    const minX=Math.min(...projected.map(p=>p.x)), maxX=Math.max(...projected.map(p=>p.x));
    const minY=Math.min(...projected.map(p=>p.y)), maxY=Math.max(...projected.map(p=>p.y));
    const spanX=Math.max(maxX-minX,Number.EPSILON);
    const spanY=Math.max(maxY-minY,Number.EPSILON);
    const scale=Math.min(width*0.75/spanX,height*0.68/spanY);
    const cx=width/2-(minX+maxX)*scale/2;
    const cy=height/2-(minY+maxY)*scale/2;
    const project=p=>{const q=rawProjection(p);return{x:cx+q.x*scale,y:cy+q.y*scale};};

    // The grid is measured in the same world coordinates as the paper.
    const floor=stackBox(completedFolds).slice(0,4);
    const groundY=Math.max(...floor.map(p=>project(p).y));
    ctx.strokeStyle="rgba(100,186,191,.16)"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(25,groundY+12); ctx.lineTo(width-25,groundY+12); ctx.stroke();

    const geometryFaces=moving
      ? [...visibleFaces(pose.staticPanel,"static"),...visibleFaces(pose.rotatingPanel,"moving")]
      : visibleFaces(geometry,"static");
    geometryFaces.sort((a,b)=>a.depth-b.depth);
    const colors={
      static:{top:"#e9d49c",edge:"#b08b5c",bottom:"#765c49"},
      moving:{top:"#ffd895",edge:"#dc9262",bottom:"#b96e5c"},
    };
    for (const face of geometryFaces) {
      drawFace(ctx,face.points,colors[face.palette][face.kind],
        face.palette==="moving"?"#ffe8be":"#ffe4aa",project);
    }

    if (pose) {
      const a=project(pose.hinge[0]), b=project(pose.hinge[1]);
      ctx.strokeStyle="#6be2e3"; ctx.lineWidth=2.4;
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      ctx.setLineDash([3,5]); ctx.strokeStyle="rgba(255,207,139,.55)"; ctx.lineWidth=1;
      ctx.beginPath();
      for (let i=0;i<=30;i++) {
        const point=project(foldPose(completedFolds,i/30).rotatingPanel[5]);
        if(i===0)ctx.moveTo(point.x,point.y); else ctx.lineTo(point.x,point.y);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }

    const length=niceLength(110/scale), lengthPx=length*scale;
    if (Number.isFinite(lengthPx) && lengthPx>20 && lengthPx<width*0.4) {
      const bx=width-32-lengthPx, by=height-27;
      ctx.strokeStyle="#9fd4d2"; ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+lengthPx,by);
      ctx.moveTo(bx,by-5);ctx.lineTo(bx,by+5);
      ctx.moveTo(bx+lengthPx,by-5);ctx.lineTo(bx+lengthPx,by+5);ctx.stroke();
      ctx.fillStyle="#c4d6d6";ctx.font="12px system-ui";ctx.textAlign="right";
      ctx.fillText(scaleLabel(length),width-32,by-10);
    }
    const physicalFootprintPx=Math.max(Math.abs(project(geometry[0]).x-project(geometry[1]).x),
      Math.abs(project(geometry[0]).x-project(geometry[3]).x));
    return {metersPerPixel:1/scale, footprintSubpixel:physicalFootprintPx<1,
      physicalFootprintPx, moving};
  }
}
