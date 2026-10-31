// SPDX-License-Identifier: MIT
// A single material sheet with retained UV coordinates. This is kinematics:
// force, plasticity, self-contact and fibre failure are not solved here.
import {DEFAULTS, foldState} from "./model.js";

export const SHEET_ID = "HALVETH-A4-001";
export const SHEET_CONTRACT = "halveth.material-sheet.v1";

function checkedParameters(parameters) {
  foldState(0, parameters);
  return parameters;
}

export function sheetStages(parameters = DEFAULTS) {
  checkedParameters(parameters);
  const stages = [];
  let topZ = 0;
  for (let n = 0; n < 16; n++) {
    const state = foldState(n, parameters);
    const axis = state.stack.widthM >= state.stack.heightM ? "x" : "y";
    const spanM = axis === "x" ? state.stack.widthM : state.stack.heightM;
    // A finite packet needs a wider turn than a zero-thickness hinge. This
    // radius is a declared clearance assumption, not a paper measurement.
    const packetHeightM = topZ + parameters.thicknessM;
    const radiusM = Math.max(state.stack.thicknessM + parameters.thicknessM / 2,
      packetHeightM / 2 + parameters.thicknessM / 4);
    const halfBandM = Math.PI * radiusM / 2;
    const room = spanM >= 2 * halfBandM;
    stages.push(Object.freeze({n, axis, spanM, topZ, packetHeightM,
      radiusM, halfBandM, room}));
    if (!room) break;
    // Conservative top envelope of the packet after a complete turn.
    topZ = 2 * topZ + 2 * radiusM;
  }
  return Object.freeze(stages);
}

export function sheetLimit(parameters = DEFAULTS) {
  const stages = sheetStages(parameters);
  return stages.find(stage => !stage.room)?.n ?? stages.length;
}

function turn(point, stage, progress) {
  if (progress === 0) return point;
  const theta = Math.PI * progress;
  const {axis, spanM, topZ, halfBandM: a} = stage;
  const s = point[axis], z = point.z;
  const radius = 2 * a / theta;
  let along = s, height = z;
  if (s > -a && s < a) {
    const phi = (s + a) / radius;
    along = -a + radius * Math.sin(phi) - (z - topZ) * Math.sin(phi);
    height = topZ + radius * (1 - Math.cos(phi)) + (z - topZ) * Math.cos(phi);
  } else if (s >= a) {
    along = -a + radius * Math.sin(theta) + (s - a) * Math.cos(theta)
      - (z - topZ) * Math.sin(theta);
    height = topZ + radius * (1 - Math.cos(theta)) + (s - a) * Math.sin(theta)
      + (z - topZ) * Math.cos(theta);
  }
  along += progress * spanM / 4;
  return axis === "x" ? {x:along, y:point.y, z:height}
    : {x:point.x, y:along, z:height};
}

function projectMaterial(u, v, completedFolds, progress, stages) {
  let point = {x:u, y:v, z:0};
  for (let n = 0; n < completedFolds; n++) point = turn(point, stages[n], 1);
  if (progress > 0) point = turn(point, stages[completedFolds], progress);
  return {sheetId:SHEET_ID, u, v, ...point};
}

export function sheetPoint(u, v, completedFolds, progress = 0, parameters = DEFAULTS) {
  checkedParameters(parameters);
  const stages = sheetStages(parameters);
  const limit = stages.find(stage => !stage.room)?.n ?? stages.length;
  if (!Number.isInteger(completedFolds) || completedFolds < 0 ||
      completedFolds > limit)
    throw new RangeError("completedFolds is outside the material-sheet window");
  if (!Number.isFinite(progress) || progress < 0 || progress > 1 ||
      (completedFolds === limit && progress !== 0))
    throw new RangeError("progress must describe an available fold");
  if (![u,v].every(Number.isFinite) || Math.abs(u) > parameters.widthM / 2 ||
      Math.abs(v) > parameters.heightM / 2)
    throw new RangeError("material coordinate outside the original sheet");
  return Object.freeze(projectMaterial(u, v, completedFolds, progress, stages));
}

function coordinates(length, axis, completedFolds, stages) {
  const values = new Set();
  const add = value => {
    if (value >= -length / 2 && value <= length / 2)
      values.add(Number(value.toPrecision(14)));
  };
  for (let i = 0; i <= 64; i++) add(-length / 2 + i * length / 64);
  for (const stage of stages) {
    if (stage.n > completedFolds || stage.axis !== axis || !stage.room) continue;
    const level = Math.floor(stage.n / 2);
    const places = 2 ** level;
    // Dyadic material positions preserve a crease neighbourhood at each scale.
    // At later folds these are sampling anchors, not an exact inverse crease map.
    for (let i = 0; i < places; i++) {
      const center = -length / 2 + (i + .5) * length / places;
      for (const factor of [-1, -.75, -.5, -.25, 0, .25, .5, .75, 1])
        add(center + factor * stage.halfBandM);
    }
  }
  return [...values].sort((a,b)=>a-b);
}

export function sheetMesh(completedFolds, progress = 0, parameters = DEFAULTS) {
  const stages = sheetStages(parameters);
  const limit = stages.find(stage => !stage.room)?.n ?? stages.length;
  if (!Number.isInteger(completedFolds) || completedFolds < 0 || completedFolds > limit)
    throw new RangeError("no material mesh beyond the declared window");
  if (!Number.isFinite(progress) || progress < 0 || progress > 1 ||
      (completedFolds === limit && progress !== 0))
    throw new RangeError("progress must describe an available fold");
  const u = coordinates(parameters.widthM, "x", completedFolds, stages);
  const v = coordinates(parameters.heightM, "y", completedFolds, stages);
  const vertices = [];
  for (const vv of v) for (const uu of u) {
    const point = projectMaterial(uu, vv, completedFolds, progress, stages);
    vertices.push({...point, id:`uv:${uu.toPrecision(12)}:${vv.toPrecision(12)}`});
  }
  const faces = [];
  let materialAreaM2 = 0;
  for (let j = 0; j < v.length - 1; j++) for (let i = 0; i < u.length - 1; i++) {
    const a = j * u.length + i, b = a + 1, c = a + u.length, d = c + 1;
    faces.push([a,b,d], [a,d,c]);
    materialAreaM2 += (u[i+1]-u[i]) * (v[j+1]-v[j]);
  }
  return Object.freeze({sheetId:SHEET_ID, contract:SHEET_CONTRACT,
    completedFolds, progress, u, v, vertices, faces, materialAreaM2,
    layerOrder:"PROJECTED_DEPTH_ONLY", contact:"NOT_EVALUATED"});
}
