// SPDX-License-Identifier: MIT
import { SUN_SQUARE } from "./number-research.mjs";
import {
  powerState,
  cube512,
  POWER_CASES,
  POWER_SOURCES,
  powerResearchFor,
  sunComparison,
  namePath,
  numeral36,
  HISTORICAL_NAMES,
  STRUCTURE_VERSION,
} from "./powers-square.mjs";

const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};
const button = (text, action) => {
  const b = el("button", text);
  b.type = "button";
  b.addEventListener("click", action);
  return b;
};
const shape = (tag, attrs, text) => {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs))
    node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
};
const link = (source) => {
  const a = el("a", `${source.title} ↗`);
  a.href = source.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
};
function download(name, object) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(object, null, 2) + "\n"], {
      type: "application/json",
    }),
  );
  const a = el("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function renderPowerDetail(host, number, openLab) {
  const record = powerResearchFor(number);
  if (!record) return;
  host.hidden = false;
  host.replaceChildren(
    el("p", "QUERVERBINDUNG / BINÄRE ZUSTANDSRÄUME", "eyebrow"),
    el("h3", record.title),
    el("p", record.formula, "research-equation"),
    button("Skalierungslabor öffnen ↗", () => openLab(number)),
  );
  for (const claim of record.claims) {
    const p = el("p", claim.text),
      citations = el("span", undefined, "research-citations");
    for (const id of claim.sources) citations.append(link(POWER_SOURCES[id]));
    p.append(citations);
    host.append(p);
  }
  for (const [title, text] of [
    ["Mechanismus", record.mechanism],
    ["Einordnung", record.limit],
    ["Für HALVETH / LUCINET", record.application],
    ["Gegenprobe", record.nextTest],
  ]) {
    const p = el("p");
    p.append(el("strong", title + ": "), document.createTextNode(text));
    host.append(p);
  }
}

export function renderStructures(host) {
  host.replaceChildren();
  const intro = el("div", undefined, "structure-intro");
  intro.append(
    el("p", "ZWEIERPOTENZEN / QUELLEN / SICHTBARE REGELN", "eyebrow"),
    el("h2", "Mehr Zustände. Ein anderer Code."),
    el(
      "p",
      "Schalte ein Bit um. Verfolge seine Adresse. Wechsle vom modernen Zustandsraster zur historischen Zahlentafel.",
    ),
  );
  const grid = el("div", undefined, "structure-columns"),
    binary = el("article", undefined, "card structure-card"),
    historical = el("article", undefined, "card structure-card");
  host.append(intro, grid);
  grid.append(binary, historical);
  binary.append(
    el("p", "01 / GENESIS-256 · GENESIS-512 · 1024", "eyebrow"),
    el("h3", "Ein Bit verdoppelt die Auswahl."),
  );
  const selectLabel = el("label", "Zustandsraum"),
    select = el("select");
  select.id = "power-width";
  selectLabel.htmlFor = select.id;
  for (const width of [8, 9, 10]) {
    const option = el("option", `${2 ** width} Zustände / ${width} Bits`);
    option.value = String(width);
    select.append(option);
  }
  let width = 8,
    index = 0;
  const equation = el("p", undefined, "structure-equation"),
    bits = el("div", undefined, "structure-bits"),
    rangeLabel = el("label", "Index auswählen"),
    range = el("input"),
    readout = el("p", undefined, "research-readout"),
    raster = shape("svg", {
      viewBox: "0 0 320 320",
      role: "img",
      "aria-label": "Alle Zustandsadressen im gewählten Raster",
    }),
    boundary = el("p", undefined, "hint"),
    layout = el("p", undefined, "hint"),
    powerRecord = el("p", undefined, "hint");
  range.id = "power-index";
  range.type = "range";
  range.min = "0";
  range.step = "1";
  rangeLabel.htmlFor = range.id;
  range.setAttribute("aria-describedby", "power-readout");
  readout.id = "power-readout";
  readout.setAttribute("role", "status");
  const draw = () => {
    const state = powerState(width, index);
    equation.textContent = `2^${width} = ${state.count} Zustände · 0 bis ${state.maxIndex}`;
    bits.replaceChildren(
      ...[...state.bits].map((bit, i) => {
        const b = button(bit, () => {
          index ^= 2 ** (width - 1 - i);
          draw();
        });
        b.setAttribute(
          "aria-label",
          `Zustandsbit ${i + 1}: ${bit}. Umschalten.`,
        );
        b.setAttribute("aria-pressed", String(bit === "1"));
        return b;
      }),
    );
    range.max = String(state.maxIndex);
    range.value = String(index);
    range.setAttribute(
      "aria-valuetext",
      `Index ${index} von ${state.maxIndex}; Binär ${state.bits}`,
    );
    readout.textContent = `${state.bits}₂ = ${index} · Rasteradresse (${state.x}, ${state.y})`;
    boundary.textContent = `Die Anzahl ${state.count} selbst: ${state.countBinary}₂, also ${state.countBitLength} Binärziffern. Die ${state.count} Indices benötigen jeweils ${width} Bits.`;
    const cell = 320 / state.columns,
      offset = (320 - state.rows * cell) / 2;
    raster.replaceChildren(
      ...Array.from({ length: state.count }, (_, value) =>
        shape("rect", {
          x: (value % state.columns) * cell + 1,
          y: Math.floor(value / state.columns) * cell + offset + 1,
          width: cell - 2,
          height: cell - 2,
          class: value === index ? "state-active" : "state-cell",
        }),
      ),
    );
    raster.setAttribute(
      "aria-label",
      `${state.count} Zellen im ${state.columns} mal ${state.rows} Raster. Index ${index} ist hervorgehoben.`,
    );
    layout.textContent = `${state.columns}×${state.rows} · X läuft links nach rechts, Y oben nach unten. Index = Y×${state.columns}+X.`;
    if (width === 9) {
      const xyz = cube512(index);
      layout.textContent += ` Derselbe Index im 8×8×8-Würfel: (${xyz.x}, ${xyz.y}, ${xyz.z}).`;
    }
    powerRecord.textContent = POWER_CASES.find(
      (x) => x.number === state.count,
    ).application;
  };
  select.addEventListener("change", () => {
    width = Number(select.value);
    index = 0;
    draw();
  });
  range.addEventListener("input", () => {
    index = Number(range.value);
    draw();
  });
  const controls = el("div", undefined, "role-controls");
  controls.append(
    button("Erster Zustand", () => {
      index = 0;
      draw();
    }),
    button("Letzter Zustand", () => {
      index = 2 ** width - 1;
      draw();
    }),
    button("Versuch als JSON ↓", () =>
      download(`halveth-power-${2 ** width}.json`, {
        schema: "halveth.doors.power-experiment.v1",
        version: STRUCTURE_VERSION,
        recordedAt: new Date().toISOString(),
        eventAt: "UNKNOWN",
        observationKind: "USER_SELECTED_LOCAL_MODEL",
        state: powerState(width, index),
        research: powerResearchFor(2 ** width),
        sources: { binaryUnits: POWER_SOURCES.binaryUnits },
      }),
    ),
  );
  binary.append(
    selectLabel,
    select,
    equation,
    bits,
    rangeLabel,
    range,
    readout,
    raster,
    layout,
    boundary,
    controls,
    powerRecord,
    el(
      "p",
      "1024 ist ein eigener Zusatzpfad. Das Register 0–1000 enthält weiterhin exakt 1001 Zahlen.",
      "hint",
    ),
    link(POWER_SOURCES.binaryUnits),
  );

  historical.append(
    el("p", "02 / AGRIPPA · BUCH II, KAPITEL 22", "eyebrow"),
    el("h3", "Name. Zahl. Weg über ein Quadrat."),
  );
  const summary = sunComparison(),
    nameLabel = el("label", "Name aus der historischen Tabelle"),
    names = el("select");
  names.id = "source-name";
  nameLabel.htmlFor = names.id;
  for (const item of HISTORICAL_NAMES) {
    const option = el("option", `${item.latin} · ${item.expectedSum}`);
    option.value = item.id;
    names.append(option);
  }
  const trace = el("p", undefined, "structure-equation"),
    mapping = el("p", undefined, "hint"),
    mapGraphic = shape("svg", {
      viewBox: "0 0 320 320",
      role: "img",
      "aria-label": "Deklarierte Namensspur über Agrippas Sonnentafel",
    }),
    historyStatus = el("p", undefined, "hint"),
    displayLabel = el("label", "Zellenschreibweise"),
    display = el("select");
  display.id = "square-notation";
  displayLabel.htmlFor = display.id;
  for (const [value, text] of [
    ["DECIMAL", "Dezimale Werte"],
    ["MODERN", "Hebräische Zahlzeichen / heutige Konvention"],
  ]) {
    const option = el("option", text);
    option.value = value;
    display.append(option);
  }
  trace.setAttribute("role", "status");
  let currentPath;
  const drawName = () => {
    currentPath = namePath(names.value);
    trace.replaceChildren(
      el("bdi", currentPath.text),
      document.createTextNode(
        ` · ${currentPath.values.join(" + ")} = ${currentPath.sum}`,
      ),
    );
    trace.firstChild.setAttribute("dir", "rtl");
    trace.firstChild.setAttribute("lang", "he");
    mapping.textContent = `Gewählte Zellfolge: ${currentPath.cells.map((x) => x.reduced).join(" → ")}. Regel: Werte über 36 durch 10 teilen, solange sie durch 10 teilbar sind. Originalwerte bleiben erhalten.`;
    const cells = [];
    SUN_SQUARE.forEach((row, y) =>
      row.forEach((value, x) => {
        cells.push(
          shape("rect", {
            x: x * 50 + 10,
            y: y * 50 + 10,
            width: 48,
            height: 48,
            class: "sigil-cell",
          }),
        );
        cells.push(
          shape(
            "text",
            {
              x: x * 50 + 34,
              y: y * 50 + 39,
              "text-anchor": "middle",
              class: "sigil-cell-label",
              ...(display.value === "MODERN"
                ? { direction: "rtl", lang: "he" }
                : {}),
            },
            display.value === "MODERN" ? numeral36(value) : value,
          ),
        );
      }),
    );
    const points = currentPath.cells
      .map(({ x, y }) => `${x * 50 + 34},${y * 50 + 34}`)
      .join(" ");
    mapGraphic.replaceChildren(
      ...cells,
      shape("polyline", { points, class: "sigil-path" }),
    );
    currentPath.cells.forEach(({ x, y }, i) =>
      mapGraphic.append(
        shape("circle", {
          cx: x * 50 + 34,
          cy: y * 50 + 34,
          r: i === 0 ? 9 : 4,
          class: "sigil-point",
        }),
      ),
    );
    mapGraphic.setAttribute(
      "aria-label",
      `${currentPath.latin}: Buchstabenwerte ${currentPath.values.join(", ")}; Summe ${currentPath.sum}; gewählte Zellfolge ${currentPath.cells.map((x) => x.reduced).join(", ")}.`,
    );
    historyStatus.textContent = currentPath.limitation;
  };
  names.addEventListener("change", drawName);
  display.addEventListener("change", drawName);
  const facts = el("dl", undefined, "role-profile");
  for (const [key, value] of [
    ["Zahlentafel", "6×6 · Zahlen 1–36 je einmal"],
    ["Zeile / Spalte / beide Hauptdiagonalen", "111"],
    ["Gesamtsumme", "666"],
    ["Standard-Sudoku", "9×9 · 1–9 in jeder Zeile, Spalte und jedem 3×3-Block"],
  ])
    facts.append(el("dt", key), el("dd", value));
  const archiveControls = el("div", undefined, "role-controls");
  archiveControls.append(
    button("Namensspur als JSON ↓", () =>
      download(`halveth-name-${currentPath.id.toLowerCase()}.json`, {
        schema: "halveth.doors.name-path.v1",
        version: STRUCTURE_VERSION,
        recordedAt: new Date().toISOString(),
        path: currentPath,
        comparison: summary,
        sources: Object.fromEntries(
          ["agrippaNames", "agrippaScan", "nowotny", "numerals", "sudoku"].map(
            (key) => [key, POWER_SOURCES[key]],
          ),
        ),
      }),
    ),
  );
  const citations = el("div", undefined, "research-citations");
  for (const key of [
    "agrippaScan",
    "agrippaNames",
    "nowotny",
    "numerals",
    "sudoku",
    "unicodeHebrew",
  ])
    citations.append(link(POWER_SOURCES[key]));
  historical.append(
    facts,
    nameLabel,
    names,
    trace,
    displayLabel,
    display,
    mapGraphic,
    mapping,
    historyStatus,
    el(
      "p",
      "Die hebräische Ansicht ist eine neue berechnete Zahldarstellung. 15 erscheint als טו und 16 als טז; Agrippas Druck verwendet hier andere Varianten. Der Scan bleibt die historische Referenz.",
      "hint",
    ),
    el(
      "p",
      "Die Namenssumme verliert Reihenfolge: אב und בא ergeben beide 3. Eine gleiche Summe identifiziert daher keinen eindeutigen Namen oder Träger.",
      "hint",
    ),
    archiveControls,
    citations,
  );
  const report = el("a", "Vollständige Quellenprüfung und Versuchsvertrag ↗");
  report.href = "POWERS_SQUARE_RESEARCH.md";
  host.append(report);
  draw();
  drawName();
  return {
    selectNumber(number) {
      const record = powerResearchFor(number);
      if (!record) throw new RangeError("Unbekannter Zusatzpfad.");
      width = Math.log2(record.number);
      index = 0;
      select.value = String(width);
      draw();
    },
  };
}
