// SPDX-License-Identifier: MIT
// Computed arithmetic: CC0-1.0. New explanations: CC BY 4.0.
import { SUN_SQUARE, inspectSquare } from "./number-research.mjs";

export const STRUCTURE_VERSION = "1.0.0";
export const POWER_SOURCES = Object.freeze({
  binaryUnits: {
    title: "NIST · Binäre Präfixe",
    url: "https://pml.nist.gov/cuu/Units/binary.html",
    kind: "OFFICIAL_UNIT_REFERENCE",
  },
  numerals: {
    title: "Hebcal · Buchstabenwerte des eigenen Kalendersystems",
    url: "https://www.hebcal.com/home/1824/numerical-values-of-hebrew-letters",
    kind: "IMPLEMENTER_NUMERAL_REFERENCE",
  },
  agrippaNames: {
    title: "Agrippa II.22 · Textedition J. H. Peterson",
    url: "https://www.esotericarchives.com/agrippa/agripp2b.htm",
    kind: "PRIMARY_HISTORICAL_TEXT_WITH_EDITORIAL_NOTES",
  },
  agrippaScan: {
    title: "Agrippa 1651 · Sonnentafel und Zeichen, S. 246",
    url: "https://en.wikisource.org/wiki/Page:Three_Books_of_Occult_Philosophy_(De_Occulta_Philosophia)_(1651).djvu/271",
    kind: "PRIMARY_HISTORICAL_SCAN_AND_TRANSCRIPTION",
  },
  nowotny: {
    title: "K. A. Nowotny 1949 · Konstruktion der Siegel und Zeichen",
    url: "https://www.marianotomatis.it/biblioteca/repository/NOW1949.pdf",
    kind: "ORIGINAL_HISTORICAL_RECONSTRUCTION_WITH_VARIANTS",
  },
  sudoku: {
    title: "Nikoli · Sudoku-Regeln",
    url: "https://www.nikoli.co.jp/en/puzzles/sudoku/",
    kind: "PUZZLE_PUBLISHER_RULES",
  },
  unicodeHebrew: {
    title: "Unicode 17 · Hebräische Schrift, Abschnitt 9.1.1",
    url: "https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-9/",
    kind: "OFFICIAL_SCRIPT_ENCODING_REFERENCE",
  },
});

export const POWER_CASES = Object.freeze([
  {
    id: "POWER-0256-V1",
    number: 256,
    shortTitle: "GENESIS-256 · 8 Bits",
    title: "256 Zustände. Acht binäre Entscheidungen.",
    formula: "256 = 2⁸ = 16² = 4⁴ · Indices 0–255",
    relationType: "EXACT_FINITE_CARDINALITY_AND_LAYOUT",
    claims: [
      {
        text: "Acht unabhängige binäre Positionen ergeben 256 verschiedene Muster. Ein Byte hat acht Bits; der unsigned Wertebereich ist 0 bis 255.",
        sources: ["binaryUnits"],
        evidence: "OFFICIAL_UNIT_REFERENCE_AND_EXACT_COMBINATORICS",
      },
    ],
    mechanism:
      "Jedes zusätzliche Bit verdoppelt die Zahl der möglichen Muster. Ein 16×16-Raster ist eine gewählte Anordnung dieser 256 Indices.",
    limit:
      "Die Anzahl 256 und der größte Index 255 sind verschiedene Größen. Der Zahlenwert 256 selbst benötigt neun Binärziffern.",
    application:
      "GENESIS-256 aus dem gelieferten Entwurf als vollständig aufzählbaren Testzustandsraum nutzen; jede Position und jeden Roundtrip prüfen.",
    nextTest:
      "Alle 256 Muster in Rasterkoordinaten und zurück übersetzen. Danach nur die Anordnung verändern und dieselben Indices erhalten.",
  },
  {
    id: "POWER-0512-V1",
    number: 512,
    shortTitle: "GENESIS-512 · 9 Bits",
    title: "512 Zustände. Ein Raster ist eine Entscheidung.",
    formula: "512 = 2⁹ = 8³ = 2 × 256 · Indices 0–511",
    relationType: "EXACT_CARDINALITY_WITH_DIFFERENT_COORDINATE_MAPS",
    claims: [
      {
        text: "Neun binäre Positionen ergeben 512 Muster. Dieselben 512 Indices lassen sich in einem 8×8×8-Raster oder einem 32×16-Raster adressieren.",
        sources: [],
        evidence: "EXACT_LOCAL_COMBINATORICS",
      },
    ],
    mechanism:
      "Eine Koordinatenabbildung legt die Nachbarn fest. Die gleiche Knotenanzahl erzeugt allein noch keine gleiche Topologie.",
    limit:
      "Das gezeigte 2D-Raster besitzt keine automatisch belegte physische Dreidimensionalität. 512 selbst benötigt zehn Binärziffern.",
    application:
      "Den im Original genannten Vergleich von 8×8×8-Raster und dynamischem Graph vorbereiten: zuerst Identitäten und Koordinaten getrennt binden.",
    nextTest:
      "Alle 512 Indices durch 2D- und 3D-Koordinaten hin und zurück abbilden. Für einen Graphvergleich danach eine eigene Kantenregel festlegen.",
  },
  {
    id: "POWER-1024-V1",
    number: 1024,
    shortTitle: "1024 · Binäre Schwelle",
    title: "1024: Der nächste binäre Zustandsraum.",
    formula: "1024 = 2¹⁰ = 32² = 4⁵ · 1 KiB = 1024 B",
    relationType: "EXACT_BINARY_CAPACITY_AND_NAMED_UNIT",
    claims: [
      {
        text: "Zehn binäre Positionen ergeben 1024 Muster mit Indices 0 bis 1023. Ein Kibibyte enthält 1024 Byte; ein Kilobyte enthält 1000 Byte.",
        sources: ["binaryUnits"],
        evidence: "OFFICIAL_UNIT_REFERENCE_AND_EXACT_COMBINATORICS",
      },
    ],
    mechanism:
      "Die Einheit und der Exponent bestimmen die gezählte Größe. Zehn Bits adressieren 1024 Zustände; 1024 Byte sind eine andere Datenmenge.",
    limit:
      "Dieser Zusatzpfad erweitert die Forschungsauswahl. Das historische Register bleibt bei 0 bis 1000 mit 1001 Einträgen. 1024 selbst benötigt elf Binärziffern.",
    application:
      "Die im Original bereits benannte binäre Schwelle als expliziten Zusatzversuch zugänglich machen; Speichergröße, Anzahl und Index unterscheiden.",
    nextTest:
      "Alle 1024 Muster prüfen und den höchsten Index 1023 mit dem nächsten Wert 1024 vergleichen.",
  },
]);
export function powerResearchFor(number) {
  return POWER_CASES.find((x) => x.number === number) ?? null;
}
function uint(value, max, label) {
  if (
    !Number.isSafeInteger(value) ||
    Object.is(value, -0) ||
    value < 0 ||
    value > max
  )
    throw new RangeError(`${label}: Integer 0–${max} erforderlich.`);
  return value;
}
export function powerState(width, index) {
  if (![8, 9, 10].includes(width))
    throw new RangeError("Bitbreite 8, 9 oder 10 erforderlich.");
  const count = 2 ** width;
  uint(index, count - 1, "Index");
  const columns = width === 8 ? 16 : 32;
  return {
    width,
    count,
    minIndex: 0,
    maxIndex: count - 1,
    index,
    bits: index.toString(2).padStart(width, "0"),
    countBinary: count.toString(2),
    countBitLength: width + 1,
    columns,
    rows: count / columns,
    x: index % columns,
    y: Math.floor(index / columns),
    coordinateRule: "INDEX_EQUALS_Y_TIMES_COLUMNS_PLUS_X",
    sourceScope: "EXACT_LOCAL_FINITE_MODEL",
  };
}
export function rasterIndex(width, x, y) {
  const state = powerState(width, 0);
  uint(x, state.columns - 1, "X");
  uint(y, state.rows - 1, "Y");
  return y * state.columns + x;
}
export function cube512(index) {
  uint(index, 511, "Index");
  return {
    x: index % 8,
    y: Math.floor(index / 8) % 8,
    z: Math.floor(index / 64),
  };
}
export function cube512Index({ x, y, z }) {
  [x, y, z].forEach((value) => uint(value, 7, "Würfelkoordinate"));
  return z * 64 + y * 8 + x;
}

export const LETTER_VALUES = Object.freeze(
  Object.fromEntries([
    ...[..."אבגדהוזחט"].map((letter, i) => [letter, i + 1]),
    ...[..."יכלמנסעפצ"].map((letter, i) => [letter, (i + 1) * 10]),
    ...[..."קרשת"].map((letter, i) => [letter, (i + 1) * 100]),
  ]),
);
export const HISTORICAL_NAMES = Object.freeze(
  [
    {
      id: "NACHIEL",
      latin: "Nachiel",
      text: "נכיאל",
      expectedSum: 111,
      sourceRole: "Intelligence of the Sun",
    },
    {
      id: "SORATH",
      latin: "Sorath",
      text: "סורת",
      expectedSum: 666,
      sourceRole: "Spirit of the Sun",
    },
  ].map(Object.freeze),
);
export function letterSum(text) {
  if (
    typeof text !== "string" ||
    text.length < 1 ||
    text.length > 64 ||
    [...text].some((letter) => !Object.hasOwn(LETTER_VALUES, letter))
  )
    throw new TypeError(
      "1–64 exakt gebundene hebräische Grundbuchstaben erforderlich.",
    );
  const values = [...text].map((letter) => LETTER_VALUES[letter]);
  return {
    text,
    letters: [...text],
    values,
    sum: values.reduce((a, b) => a + b, 0),
    order: "UNICODE_LOGICAL_ORDER_RIGHT_TO_LEFT_READING",
  };
}
export function numeral36(value, convention = "MODERN") {
  if (!Number.isInteger(value) || value < 1 || value > 36)
    throw new RangeError("Zahlenwert 1–36 erforderlich.");
  if (!["MODERN", "ADDITIVE_DEMO"].includes(convention))
    throw new TypeError("Unbekannte Konvention.");
  if (convention === "MODERN" && value === 15) return "טו";
  if (convention === "MODERN" && value === 16) return "טז";
  const tens = ["", "י", "כ", "ל"],
    units = ["", ..."אבגדהוזחט"];
  return tens[Math.floor(value / 10)] + units[value % 10];
}
export function namePath(id) {
  const name = HISTORICAL_NAMES.find((x) => x.id === id);
  if (!name) throw new TypeError("Unbekannter Quellenname.");
  const record = letterSum(name.text);
  const cells = record.values.map((value) => {
    let reduced = value;
    // Explicit modern demo rule. Historical diagrams have documented variants.
    while (reduced > 36 && reduced % 10 === 0) reduced /= 10;
    if (reduced > 36)
      throw new RangeError("Kein Gitterplatz nach der gewählten Regel.");
    const row = SUN_SQUARE.findIndex((line) => line.includes(reduced));
    return {
      original: value,
      reduced,
      x: SUN_SQUARE[row].indexOf(reduced),
      y: row,
    };
  });
  return {
    ...name,
    ...record,
    cells,
    rule: "DIVIDE_BY_TEN_WHILE_ABOVE_36_AND_EXACTLY_DIVISIBLE",
    ruleVersion: "DEMO-1.0.0",
    operator: {
      id: "HEBREW_VALUES_TO_SUN_GRID_PATH",
      version: "1.0.0",
      inputType: "EXACT_HEBREW_BASE_LETTER_SEQUENCE",
      intermediateType: "ORDERED_POSITIVE_INTEGER_VALUES",
      outputType: "ORDERED_6_BY_6_GRID_COORDINATES",
      parameters: {
        grid: "AGRIPPA_SUN_1_TO_36",
        reduction: "DIVIDE_EXACT_TENS_ABOVE_36",
      },
      equality: "EXACT_ORDERED_RECORD_VALUES",
      determinism: "DETERMINISTIC_FOR_DECLARED_INPUT_AND_GRID",
      inverse: "NON_UNIQUE_FROM_REDUCED_PATH_ALONE",
    },
    informationLoss: {
      sum: "ORDER_AND_LETTER_IDENTITY_NOT_RECOVERABLE_FROM_SUM_ALONE",
      cellReduction: "MANY_TO_ONE",
      originalTextAndValuesRetained: true,
      historicalGlyphIdentity: "NOT_CLAIMED",
    },
    sourceReferences: ["agrippaNames", "agrippaScan", "numerals", "nowotny"],
    evidence: "HISTORICAL_NAME_AND_SUM_WITH_DECLARED_MODERN_PATH_MODEL",
    limitation:
      "Eigene deklarierte Pfadkonstruktion; keine pixelgenaue Reproduktion der Holzschnitte oder einheitliche historische Entschlüsselungsregel.",
  };
}
export function sunComparison() {
  const result = inspectSquare(SUN_SQUARE);
  return {
    square: result,
    sudoku: {
      rule: "NIKOLI_STANDARD_9_BY_9_WITH_3_BY_3_BLOCKS",
      matches: false,
      reason:
        "Sonnentafel 6×6 mit Zahlen 1–36; Standard-Sudoku 9×9 mit wiederholter Menge 1–9.",
    },
    modernHebrew: SUN_SQUARE.map((row) => row.map((n) => numeral36(n))),
    sourceTranscription: "NOT_CLAIMED_PIXEL_EXACT",
  };
}
