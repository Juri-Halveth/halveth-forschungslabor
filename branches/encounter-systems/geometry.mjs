// SPDX-License-Identifier: MIT
// Source coordinates and their view operators; no physical reconstruction claim.
export const VIEWS = Object.freeze(["perspective", "top", "front", "side"]);
export const SOURCE_POINTS = Object.freeze(
  [
    { id: "host", x: 0, y: 0, z: 10 },
    { id: "partner", x: -185, y: -70, z: 10 },
    { id: "visitor", x: 180, y: -80, z: 10 },
    { id: "writer", x: 180, y: 100, z: 10 },
    { id: "port-partner", x: -90, y: -35, z: 12 },
    { id: "port-visitor", x: 90, y: -35, z: 12 },
    { id: "port-writer", x: 90, y: 40, z: 12 },
    { id: "host-back", x: 0, y: 0, z: 3 },
  ].map(Object.freeze),
);
export function observe(points, view) {
  if (!VIEWS.includes(view)) throw Error("Unknown projection");
  const seen = new Set();
  return points.map((point) => {
    if (
      !point ||
      typeof point.id !== "string" ||
      seen.has(point.id) ||
      !["x", "y", "z"].every((k) => Number.isFinite(point[k]))
    )
      throw Error("Invalid source point");
    seen.add(point.id);
    const { id, x, y, z } = point;
    if (view === "top") return { id, u: x, v: y, depth: z };
    if (view === "front") return { id, u: x, v: z, depth: y };
    if (view === "side") return { id, u: y, v: z, depth: x };
    const a = 0.1,
      b = 0.53,
      xx = x * Math.cos(a) + z * Math.sin(a),
      zz = -x * Math.sin(a) + z * Math.cos(a);
    return { id, u: xx, v: y * Math.cos(b) - zz * Math.sin(b), depth: zz };
  });
}
