// SPDX-License-Identifier: MIT
import { project } from "./model.mjs";

export function chartPoint(point, width, height, tilt = 0) {
  if (![width, height].every((n) => Number.isFinite(n) && n >= 180)) throw new RangeError("Invalid chart size");
  const q = project(point, tilt);
  const scale = Math.min((width - 46) / 5.5, (height - 48) / 4.8);
  return { x: width / 2 + q.x * scale, y: height / 2 - q.y * scale };
}
export function groupProjection(points, tilt = 0) {
  const groups = new Map();
  for (const point of points) {
    const p = project(point, tilt), key = [p.x, p.y].join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(point);
  }
  return [...groups.values()];
}
function* labelPositions(point, labelWidth, width, height) {
  for (const [dx,dy] of [[16,-10],[16,18],[-labelWidth-16,-10],[-labelWidth-16,18],[16,-30],[16,38],[-labelWidth/2,-43],[-labelWidth/2,51]])
    yield [Math.max(12, Math.min(width-12-labelWidth, point.x+dx)),
      Math.max(24, Math.min(height-14, point.y+dy))];

  // Crowded projections can exhaust the nearby offsets. Search a fixed-size
  // chart grid, nearest first, retaining font size, identity and leader lines.
  const slots = [];
  for (let row = 0; row <= 8; row++) for (let column = 0; column <= 8; column++)
    slots.push([12+(width-24-labelWidth)*column/8, 24+(height-38)*row/8]);
  const distance = ([x,y]) => Math.hypot(x+labelWidth/2-point.x, y-5-point.y);
  yield* slots.sort((a,b) => distance(a)-distance(b));
}
export function placeLabels(groups, width, height, tilt = 0) {
  const occupied = axisLabels(width,height,tilt).map(label=>({x:label.x,y:label.y-12,width:8,height:15}));
  return groups.map((group) => {
    const p = chartPoint(group[0], width, height, tilt), text = group.map((q) => q.id).join(" · ");
    const labelWidth = text.length * 8;
    let chosen;
    for (const [x,y] of labelPositions(p, labelWidth, width, height)) {
      const rect = { x, y: y - 13, width: labelWidth, height: 17 };
      const collision = occupied.some((b) => rect.x < b.x+b.width+5 && rect.x+rect.width+5>b.x && rect.y<b.y+b.height+5 && rect.y+rect.height+5>b.y);
      if (!collision) { chosen = { ...rect, baseline: y, text, point: p }; break; }
    }
    if (!chosen) throw Error("Label layout exhausted");
    occupied.push(chosen);
    return chosen;
  });
}
export function axisLabels(width,height,tilt=0){
  const axes=[["x",{x:2.3,y:0,z:0}],["y",{x:0,y:2.3,z:0}]];
  if(tilt>1)axes.push(["z",{x:0,y:0,z:1.8}]);
  return axes.map(([name,p])=>{
    const q=chartPoint(p,width,height,tilt);
    return{name,x:Math.min(width-15,Math.max(12,q.x+6)),y:Math.min(height-12,Math.max(18,q.y-5))};
  });
}
