// SPDX-License-Identifier: MIT
import {
  researchFor,
  RESEARCH_SOURCES,
  SUN_SQUARE,
  inspectSquare,
  decodeBits6,
  GOLDEN_ANGLE,
  spiralPoints,
  completePairs,
} from "./number-research.mjs";

const node = (tag, text, className) => {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
};
const graphic = (label) => {
  const e = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  e.setAttribute("viewBox", "0 0 320 320");
  e.setAttribute("role", "img");
  e.setAttribute("aria-label", label);
  e.classList.add("research-graphic");
  return e;
};
const shape = (tag, attrs, text) => {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs))
    e.setAttribute(key, String(value));
  if (text !== undefined) e.textContent = text;
  return e;
};
const button = (text, action) => {
  const b = node("button", text);
  b.type = "button";
  b.addEventListener("click", action);
  return b;
};

function squareDemo(host) {
  const readout = node("p", undefined, "research-readout"),
    table = node("table", undefined, "sun-square");
  table.append(node("caption", "Agrippas Sonnentafel · Zahlen 1 bis 36"));
  const body = node("tbody"),
    cells = [];
  SUN_SQUARE.forEach((row, r) => {
    const tr = node("tr");
    row.forEach((value, c) => {
      const td = node("td", value);
      cells.push({ td, r, c });
      tr.append(td);
    });
    body.append(tr);
  });
  table.append(body);
  const controls = node("div", undefined, "research-controls");
  const result = inspectSquare(SUN_SQUARE);
  const highlight = (kind, index = 0) => {
    for (const { td, r, c } of cells)
      td.classList.toggle(
        "lit",
        kind === "rows"
          ? r === index
          : kind === "columns"
            ? c === index
            : kind === "diagonal"
              ? r === c
              : true,
      );
    const text =
      kind === "all"
        ? `Alle 36 Werte: ${result.total}. Jeder Wert von 1 bis 36 kommt einmal vor.`
        : kind === "diagonal"
          ? `Hauptdiagonale: ${result.diagonals[0]}. Auch die Gegendiagonale ergibt ${result.diagonals[1]}.`
          : `${kind === "rows" ? "Zeile" : "Spalte"} ${index + 1}: ${result[kind][index]}.`;
    readout.textContent = text;
  };
  const label = node("label", "Linie auswählen"),
    select = node("select");
  select.id = "square-line";
  label.htmlFor = select.id;
  for (let i = 0; i < 6; i++) {
    const option = node("option", `${i + 1}`);
    option.value = i;
    select.append(option);
  }
  let mode = "rows";
  select.addEventListener("change", () =>
    highlight(mode, Number(select.value)),
  );
  controls.append(
    label,
    select,
    button("Zeile", () => {
      mode = "rows";
      highlight(mode, Number(select.value));
    }),
    button("Spalte", () => {
      mode = "columns";
      highlight(mode, Number(select.value));
    }),
    button("Diagonal", () => {
      mode = "diagonal";
      highlight(mode);
    }),
    button("Gesamtes Quadrat", () => {
      mode = "all";
      highlight(mode);
    }),
  );
  readout.setAttribute("role", "status");
  host.append(table, controls, readout);
  highlight("rows");
}

function bitsDemo(host) {
  const controls = node("div", undefined, "research-bits"),
    readout = node("p", undefined, "research-readout");
  const lines = node("div", undefined, "research-hexagram");
  let value = 0;
  const draw = () => {
    const bits = value.toString(2).padStart(6, "0");
    controls.replaceChildren(
      ...[...bits].map((bit, i) => {
        const b = button(bit, () => {
          value ^= 1 << (5 - i);
          draw();
        });
        b.setAttribute("aria-label", `Bit ${i + 1}: ${bit}. Umschalten.`);
        b.setAttribute("aria-pressed", String(bit === "1"));
        return b;
      }),
    );
    lines.replaceChildren(
      ...[...bits].map((bit) =>
        node("div", bit === "1" ? "━━━━━━" : "━━  ━━", "research-line"),
      ),
    );
    lines.setAttribute(
      "aria-label",
      `Sechs Linien, von oben nach unten: ${bits}`,
    );
    readout.textContent = `${bits} ⇄ ${decodeBits6(bits)} · Index ${value} von 0 bis 63`;
  };
  readout.setAttribute("role", "status");
  const nav = node("div", undefined, "research-controls");
  nav.append(
    button("← Vorheriges Muster", () => {
      value = (value + 63) % 64;
      draw();
    }),
    button("Nächstes Muster →", () => {
      value = (value + 1) % 64;
      draw();
    }),
  );
  host.append(
    node(
      "p",
      "Klicke ein Bit: Die Basen und die Linienansicht ändern sich gemeinsam.",
      "hint",
    ),
    controls,
    lines,
    readout,
    nav,
    node(
      "p",
      "Demo-Vertrag: A=00, C=01, G=10, T=11. Bits von links nach rechts, Linien von oben nach unten. 1 = durchgehend; 0 = geteilt. Der Index ist keine traditionelle I-Ging-Nummer. Die gewählte Abbildung behauptet keine biologische Bedeutung der Hexagramme.",
      "hint",
    ),
    node(
      "p",
      "64 zählt die Muster. Ihre Indices 0–63 passen in sechs Bits. Der Zahlenwert 64 selbst wird binär als 1000000 mit sieben Ziffern geschrieben.",
      "hint",
    ),
  );
  draw();
}

function plantDemo(host) {
  const canvas = graphic("Geometrisches Setzmodell mit 360 Punkten"),
    dots = shape("g", {});
  canvas.append(dots);
  const label = node("label", "Winkel in Grad"),
    input = node("input"),
    readout = node("p", undefined, "research-readout");
  input.type = "range";
  input.min = "130";
  input.max = "145";
  input.step = "0.001";
  input.id = "plant-angle";
  input.value = "137.508";
  label.htmlFor = input.id;
  let angle = GOLDEN_ANGLE;
  const draw = () => {
    dots.replaceChildren(
      ...spiralPoints(360, angle).map(({ x, y, index }) =>
        shape("circle", {
          cx: 160 + x * 146,
          cy: 160 + y * 146,
          r: 2.8,
          class: index < 55 ? "seed-first" : "seed-other",
        }),
      ),
    );
    const value = `${angle.toLocaleString("de-DE", { minimumFractionDigits: 3, maximumFractionDigits: 6 })}° · 360 Punkte · erste 55 hervorgehoben`;
    readout.textContent = value;
    input.setAttribute("aria-valuetext", value);
  };
  input.addEventListener("input", () => {
    angle = Number(input.value);
    draw();
  });
  const controls = node("div", undefined, "research-controls");
  controls.append(
    button("Goldener Winkel", () => {
      angle = GOLDEN_ANGLE;
      input.value = angle.toFixed(3);
      draw();
    }),
    button("135° vergleichen", () => {
      angle = 135;
      input.value = "135";
      draw();
    }),
  );
  readout.setAttribute("role", "status");
  host.append(
    canvas,
    label,
    input,
    controls,
    readout,
    node(
      "p",
      "Geometrisches Lehrmodell: Radius ∝ √Index, fester Winkel. Bei 135° wiederholt sich die Richtung nach acht Schritten. Eine reale Sonnenblume ist kein exakter Plot dieser Vorschrift.",
      "hint",
    ),
  );
  draw();
}

function pairDemo(host) {
  const canvas = graphic(
    "Vollständiger Graph: acht Knoten, 28 ungeordnete Paare",
  );
  const points = Array.from({ length: 8 }, (_, i) => ({
    x: 160 + 128 * Math.cos((i * Math.PI) / 4 - Math.PI / 2),
    y: 160 + 128 * Math.sin((i * Math.PI) / 4 - Math.PI / 2),
  }));
  for (const [a, b] of completePairs(8))
    canvas.append(
      shape("line", {
        x1: points[a].x,
        y1: points[a].y,
        x2: points[b].x,
        y2: points[b].y,
        class: "pair-edge",
      }),
    );
  points.forEach(({ x, y }, i) => {
    canvas.append(
      shape("circle", { cx: x, cy: y, r: 14, class: "pair-node" }),
      shape(
        "text",
        { x, y: y + 4, "text-anchor": "middle", class: "pair-label" },
        String.fromCharCode(65 + i),
      ),
    );
  });
  host.append(
    canvas,
    node(
      "p",
      "8 Knoten · 28 verschiedene Paare · 0 Selbstpaare",
      "research-readout",
    ),
  );
}

function carbonDemo(host) {
  const canvas = graphic(
    "Benzolring: sechs Kohlenstoffatome. Die Wasserstoffatome sind in dieser Schemazeichnung ausgelassen.",
  );
  const points = Array.from({ length: 6 }, (_, i) => ({
    x: 160 + 100 * Math.cos((i * Math.PI) / 3 - Math.PI / 6),
    y: 160 + 100 * Math.sin((i * Math.PI) / 3 - Math.PI / 6),
  }));
  canvas.append(
    shape("polygon", {
      points: points.map(({ x, y }) => `${x},${y}`).join(" "),
      class: "benzene-ring",
    }),
    shape("circle", { cx: 160, cy: 160, r: 53, class: "benzene-ring" }),
  );
  points.forEach(({ x, y }) => {
    canvas.append(
      shape("circle", { cx: x, cy: y, r: 16, class: "pair-node" }),
      shape(
        "text",
        { x, y: y + 5, "text-anchor": "middle", class: "pair-label" },
        "C",
      ),
    );
  });
  host.append(
    canvas,
    node(
      "p",
      "Benzol · C₆H₆ · Schema des Kohlenstoffrings",
      "research-readout",
    ),
  );
}

function rosettaDemo(host) {
  const boxes = node("div", undefined, "research-representations");
  for (const [script, language] of [
    ["Hieroglyphen", "Ägyptisch"],
    ["Demotisch", "Ägyptisch"],
    ["Griechische Schrift", "Griechisch"],
  ]) {
    const box = node("div");
    box.append(node("strong", script), node("span", language));
    boxes.append(box);
  }
  host.append(
    boxes,
    node(
      "p",
      "Drei Textfassungen schaffen Vergleichsstellen. Die Grafik zeigt die Sprachzuordnung, keine Nachzeichnung der Inschrift.",
      "hint",
    ),
  );
}

export function renderNumberResearch(host, number) {
  host.replaceChildren();
  const record = researchFor(number);
  host.hidden = !record;
  if (!record) return;
  host.append(
    node("p", "QUERVERBINDUNG / QUELLENRECHERCHE", "eyebrow"),
    node("h3", record.title),
    node("p", record.formula, "research-equation"),
  );
  const demo = node("div", undefined, "research-demo");
  if (number === 666) squareDemo(demo);
  if (number === 64) bitsDemo(demo);
  if (number === 55) plantDemo(demo);
  if (number === 28) pairDemo(demo);
  if (number === 6) carbonDemo(demo);
  if (number === 3) rosettaDemo(demo);
  if (number === 137) {
    demo.append(
      node("p", "137,035999177(21)", "research-readout"),
      node("p", "α⁻¹ · dimensionslos · gemessener Referenzwert"),
      node("p", "137,507764…°", "research-readout"),
      node("p", "Goldener Winkel · Grad · aus einer mathematischen Formel"),
    );
  }
  host.append(demo);
  for (const claim of record.claims) {
    const p = node("p", claim.text),
      links = node("span", undefined, "research-citations");
    for (const key of claim.sources) {
      const source = RESEARCH_SOURCES[key],
        a = node("a", `${source.title} ↗`);
      a.href = source.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      links.append(a);
    }
    p.append(links);
    host.append(p);
  }
  for (const [label, text] of [
    ["Wie die Verbindung funktioniert", record.mechanism],
    ["Einordnung", record.limit],
    ["Für HALVETH / LUCINET", record.application],
    ["Nächste Gegenprobe", record.nextTest],
  ]) {
    const p = node("p");
    p.append(node("strong", `${label}: `), document.createTextNode(text));
    host.append(p);
  }
}
