// SPDX-License-Identifier: MIT
// All three frames are synthetic; A and B deliberately share the exact top view.
function frame(kind) {
  const width = 9, height = 9;
  const pixels = Array(width * height).fill(0);
  const put = (x, y, value = 220) => { pixels[y * width + x] = value; };
  if (kind === "C") {
    for (const x of [2, 4, 6]) for (let y = 1; y <= 7; y++) put(x, y);
  } else {
    for (let x = 1; x <= 7; x++) put(x, 4);
    for (let y = 1; y <= 7; y++) put(4, y);
    put(4, 4, 90);
  }
  return { width, height, pixels };
}

export const FIXTURES = Object.freeze([
  { id: "A", title: "Knoten", sourceModel: "SYNTHETIC_JUNCTION",
    description: "Zwei Linien treffen sich im künstlichen 3D-Quellmodell.", frame: frame("A") },
  { id: "B", title: "Überlagerung", sourceModel: "SYNTHETIC_OVERPASS",
    description: "Zwei Linien liegen im künstlichen 3D-Quellmodell in verschiedener Tiefe. Die Draufsicht ist dieselbe wie A.", frame: frame("B") },
  { id: "C", title: "Filamente", sourceModel: "SYNTHETIC_PARALLEL_FILAMENTS",
    description: "Drei getrennte Linien liefern hier kein vierarmiges Pixelmuster.", frame: frame("C") }
]);
