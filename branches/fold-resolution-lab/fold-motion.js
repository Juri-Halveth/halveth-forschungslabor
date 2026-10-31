// SPDX-License-Identifier: MIT
// A dimensioned hinge model. It does not solve paper elasticity or crease damage.
import {DEFAULTS, foldState} from "./model.js";

export const MOTION_CONTRACT = "halveth.fold-motion.v1";

export function foldGate(completedFolds, parameters = DEFAULTS) {
  const state = foldState(completedFolds, parameters);
  const axis = state.stack.widthM >= state.stack.heightM ? "x" : "y";
  const spanM = Math.max(state.stack.widthM, state.stack.heightM);
  const crossM = Math.min(state.stack.widthM, state.stack.heightM);
  // Optimistic outer-path check for a 180-degree turn around the existing stack.
  // The radius is an explicit geometric assumption, not a measured crease radius.
  const outerTurnRadiusM = state.stack.thicknessM + parameters.thicknessM / 2;
  const outerArcM = Math.PI * outerTurnRadiusM;
  return Object.freeze({completedFolds, axis, spanM, crossM,
    stackThicknessM: state.stack.thicknessM, outerTurnRadiusM, outerArcM,
    clearanceM: spanM - outerArcM, geometricRoom: spanM >= outerArcM});
}

export function geometricStop(parameters = DEFAULTS) {
  for (let completed = 0; completed <= 240; completed++) {
    if (!foldGate(completed, parameters).geometricRoom) return completed;
  }
  return null;
}

const box = (u0, u1, v0, v1, z0, z1) => [
  [u0,v0,z0], [u1,v0,z0], [u1,v1,z0], [u0,v1,z0],
  [u0,v0,z1], [u1,v0,z1], [u1,v1,z1], [u0,v1,z1],
];

function worldPoint(axis, [u,v,z]) {
  return axis === "x" ? {x:u,y:v,z} : {x:v,y:u,z};
}

export function foldPose(completedFolds, progress, parameters = DEFAULTS) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1)
    throw new RangeError("progress must be within [0,1]");
  const gate = foldGate(completedFolds, parameters);
  const {spanM: length, crossM: breadth, stackThicknessM: height, axis} = gate;
  const theta = Math.PI * progress;
  // Recenter the two halves as the fold completes. The end pose then has
  // exactly the same world-space bounds as foldState(n + 1).
  const centerShift = progress * length / 4;
  const locate = ([u,v,z]) => worldPoint(axis, [u + centerShift,v,z]);
  const staticPanel = box(-length/2, 0, -breadth/2, breadth/2, 0, height)
    .map(locate);
  const rotatingPanel = box(0, length/2, -breadth/2, breadth/2, 0, height)
    .map(([u,v,z]) => locate([
      u * Math.cos(theta) - (z - height) * Math.sin(theta),
      v,
      height + u * Math.sin(theta) + (z - height) * Math.cos(theta),
    ]));
  const hinge = [locate([0,-breadth/2,height]),
    locate([0,breadth/2,height])];
  return Object.freeze({gate, progress, staticPanel, rotatingPanel, hinge});
}

export function stackBox(completedFolds, parameters = DEFAULTS) {
  const {stack} = foldState(completedFolds, parameters);
  return box(-stack.widthM/2, stack.widthM/2,
    -stack.heightM/2, stack.heightM/2, 0, stack.thicknessM)
    .map(([x,y,z]) => ({x,y,z}));
}
