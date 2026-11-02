// SPDX-License-Identifier: MIT
// Original arithmetic/data: CC0-1.0. Explanations: CC BY 4.0.
// Source authors retain attribution; these are paraphrases, not copied articles.
export const RESEARCH_VERSION = "1.0.0";
export const RESEARCH_SOURCES = Object.freeze({
  rosetta: {
    title: "British Museum · Rosetta-Stein, 196 v. Chr.",
    url: "https://www.britishmuseum.org/blog/everything-you-ever-wanted-know-about-rosetta-stone",
    kind: "HOLDING_INSTITUTION_OBJECT_DESCRIPTION",
  },
  euclid: {
    title: "Euklid · Elemente IX, Proposition 36",
    url: "https://mathcs.clarku.edu/~djoyce/elements/bookIX/propIX36.html",
    kind: "PRIMARY_TEXT_TRANSLATION",
  },
  carbon: {
    title: "IUPAC Gold Book · Kohlenstoff",
    url: "https://goldbook.iupac.org/terms/view/C00821",
    kind: "OFFICIAL_CHEMICAL_DEFINITION",
  },
  atomicNumber: {
    title: "Royal Society of Chemistry · Ordnungszahl und Kohlenstoff",
    url: "https://periodic-table.rsc.org/element/6/carbon",
    kind: "CHEMICAL_SOCIETY_ELEMENT_REFERENCE",
  },
  benzene: {
    title: "NIST WebBook · Benzol, C6H6",
    url: "https://webbook.nist.gov/cgi/cbook.cgi?ID=71-43-2",
    kind: "OFFICIAL_CHEMICAL_REFERENCE",
  },
  sunflower: {
    title: "Swinton, Ochu et al. 2016 · 657 Sonnenblumen",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4892450/",
    kind: "ORIGINAL_EMPIRICAL_RESEARCH",
  },
  growth: {
    title: "Douady & Couder 1992 · Selbstorganisation der Phyllotaxis",
    url: "https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.68.2098",
    kind: "ORIGINAL_RESEARCH_ABSTRACT",
  },
  genetic: {
    title: "NCBI · Genetische Codes, Tabelle 1",
    url: "https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi#SG1",
    kind: "OFFICIAL_BIOLOGICAL_REFERENCE",
  },
  leibniz: {
    title: "Leibniz–Bouvet · Briefedition, Swarthmore College",
    url: "https://archive.swarthmore.edu/leibniz-bouvet/",
    kind: "PRIMARY_CORRESPONDENCE_EDITION",
  },
  alpha: {
    title: "CODATA 2022 · Inverse Feinstrukturkonstante",
    url: "https://api.codata.org/drum/constants/constants/InverseFineStructureConstant",
    kind: "OFFICIAL_MEASURED_REFERENCE_WITH_UNCERTAINTY",
  },
  alphaDefinition: {
    title: "NIST · Bedeutung der Feinstrukturkonstante",
    url: "https://physics.nist.gov/cuu/Constants/alpha.html",
    kind: "OFFICIAL_DEFINITION_EXPLANATION_ONLY_HISTORICAL_NUMERIC_VALUES_NOT_USED",
  },
  agrippa: {
    title: "Agrippa · Sonnentafel, englische Ausgabe 1651, S. 246",
    url: "https://en.wikisource.org/wiki/Page:Three_Books_of_Occult_Philosophy_(De_Occulta_Philosophia)_(1651).djvu/271",
    kind: "PRIMARY_HISTORICAL_TEXT_AND_TABLE",
  },
  revelation: {
    title: "Offenbarung 13,18 · Text und Editionsanmerkung",
    url: "https://bible.usccb.org/bible/revelation/13",
    kind: "PRIMARY_SCRIPTURAL_TEXT_WITH_EDITORIAL_NOTES",
  },
  irenaeus: {
    title: "Irenäus · Gegen die Häresien V,30",
    url: "https://www.newadvent.org/fathers/0103530.htm",
    kind: "PRIMARY_TEXT_TRANSLATION",
  },
  sigils: {
    title: "Grimorium Verum · Textedition von Joseph H. Peterson",
    url: "https://www.esotericarchives.com/solomon/gv.htm",
    kind: "PRIMARY_GRIMOIRE_TEXT_WITH_VARIANT_APPARATUS",
  },
});

// The archival registry stays byte-unchanged. These are separately versioned
// research records; seven investigated examples do not cover all 1001 values.
export const RESEARCH_CASES = Object.freeze([
  {
    id: "RESEARCH-0003-V1",
    number: 3,
    shortTitle: "Rosetta",
    title: "Drei Schriften. Zwei Sprachen. Ein Dekret.",
    relationType: "HISTORICAL_MULTI_REPRESENTATION",
    formula: "3 Schriften / 2 Sprachen / 1 Dekret · 196 v. Chr.",
    claims: [
      {
        text: "Der Rosetta-Stein trägt dasselbe Dekret in Hieroglyphen, demotischer Schrift und Griechisch. Die ersten beiden schreiben Ägyptisch; die dritte schreibt Griechisch.",
        sources: ["rosetta"],
        evidence: "DOCUMENTED_OBJECT_DESCRIPTION",
      },
      {
        text: "Die lesbare griechische Fassung, weitere Inschriften und Sprachkenntnisse halfen bei der Entschlüsselung der ägyptischen Schriften.",
        sources: ["rosetta"],
        evidence: "DOCUMENTED_DECIPHERMENT_HISTORY",
      },
    ],
    mechanism:
      "Mehrere Darstellungen eines gebundenen Inhalts liefern gegenseitige Vergleichsstellen. Eine Zuordnung muss an Textstellen und Kontext geprüft werden.",
    limit:
      "Die geprüfte Museumsquelle beschreibt drei Schriftsysteme. Eine eingeritzte binäre 0/1-Codierung ist damit nicht belegt. Für zweiwertige historische Zeichen führt der recherchierte Pfad zu Tür 64.",
    application:
      "Für LUCINET: dieselbe Nachricht als Rohbytes, dekodierter Text und strukturierter Record vergleichen; Übersetzungsregeln und Informationsverlust benennen.",
    nextTest:
      "Ein bekanntes Testobjekt in drei Darstellungen überführen, einen Decoder absichtlich falsch wählen und die erste Abweichung lokalisieren.",
    nextDoor: 64,
  },
  {
    id: "RESEARCH-0006-V1",
    number: 6,
    shortTitle: "Kohlenstoff",
    title: "Kohlenstoff und der sechsgliedrige Ring.",
    relationType: "DIFFERENT_CHEMICAL_COUNTS",
    formula: "C: Ordnungszahl 6 · Benzol: C₆H₆ · 1 + 2 + 3 = 6",
    claims: [
      {
        text: "Kohlenstoff ist das Element mit Ordnungszahl 6. Die Ordnungszahl zählt die Protonen im Kern.",
        sources: ["carbon", "atomicNumber"],
        evidence: "OFFICIAL_DEFINITION",
      },
      {
        text: "Benzol besitzt die Summenformel C6H6 und einen Ring aus sechs Kohlenstoffatomen.",
        sources: ["benzene"],
        evidence: "OFFICIAL_STRUCTURE_REFERENCE",
      },
    ],
    mechanism:
      "Die Kernladung bestimmt das Element. Molekülstruktur betrifft die Bindung mehrerer Atome und ihre elektronische Struktur. Die zwei Sechsen zählen unterschiedliche Objekte.",
    limit:
      "Aus sechs Protonen folgt kein allgemeines Gesetz, dass Kohlenstoff nur Sechserringe bildet. Die zusätzliche perfekte Zahl 6 ist eine arithmetische Eigenschaft, keine Ursache der Molekülform.",
    application:
      "Für Code: Zähleinheit und Objekttyp mitführen. Elementnummer, Atomzahl und Knotenanzahl bleiben eigene Felder.",
    nextTest:
      "Benzol mit anderen Kohlenstoffverbindungen vergleichen; prüfen, welche Struktur ein Modell über die Elementnummer hinaus vorhersagt.",
    nextDoor: 28,
  },
  {
    id: "RESEARCH-0028-V1",
    number: 28,
    shortTitle: "Vollständige Paare",
    title: "Perfekte Zahl. Vollständiger Vergleich.",
    relationType: "TWO_EXACT_MATHEMATICAL_IDENTITIES",
    formula: "1 + 2 + 4 + 7 + 14 = 28 = 8 × 7 / 2",
    claims: [
      {
        text: "28 ist die Summe seiner positiven echten Teiler. Euklids Proposition IX.36 konstruiert perfekte Zahlen aus geeigneten Zweierpotenzen und einer Primzahlsumme.",
        sources: ["euclid"],
        evidence: "PRIMARY_THEOREM_AND_LOCAL_ARITHMETIC",
      },
      {
        text: "Acht verschiedene Elemente besitzen genau 28 ungeordnete Zweierpaare. Dabei werden keine Selbstpaare gezählt.",
        sources: [],
        evidence: "EXACT_LOCAL_COMBINATORICS",
      },
    ],
    mechanism:
      "Jedes der acht Elemente hat sieben Partner. Division durch zwei entfernt die doppelte Zählung von AB und BA.",
    limit:
      "Die gleiche Zahl begründet keine Kausalität zwischen perfekten Zahlen und einem bestimmten sozialen oder technischen System.",
    application:
      "Für unsere acht Forschungsachsen: genau 28 direkte Vergleiche erfassen. Eine Nachbarschaftskette ersetzt den vollständigen Paargraphen nicht.",
    nextTest:
      "Die 28 verschiedenen Paare aufzählen und jede fehlende Vergleichskante sichtbar machen.",
    nextDoor: 64,
  },
  {
    id: "RESEARCH-0055-V1",
    number: 55,
    shortTitle: "Pflanzenmuster",
    title: "Fibonacci trifft Wachstum und Geometrie.",
    relationType: "MATHEMATICAL_MODEL_AND_EMPIRICAL_PATTERN",
    formula: "34 + 55 = 89 · φ = (1 + √5)/2 · 360°/φ² ≈ 137,507764°",
    claims: [
      {
        text: "55 gehört zur Fibonacci-Folge. Eine Studie mit 657 Sonnenblumen dokumentiert häufige Fibonacci-Spiralzahlen und ausdrücklich auch Abweichungen und unregelmäßige Köpfe.",
        sources: ["sunflower"],
        evidence: "EMPIRICAL_RESEARCH_WITH_COUNTEREXAMPLES",
      },
      {
        text: "Douady und Couder erzeugten phyllotaktische Muster im physikalischen Experiment und in einer Simulation als Ergebnis iterativen Wachstums und Selbstorganisation.",
        sources: ["growth"],
        evidence: "ORIGINAL_RESEARCH_ABSTRACT",
      },
    ],
    mechanism:
      "Wiederholte Platzierung mit einer festen Winkelregel kann Spiralmuster hervorbringen. Physische Wachstumsmodelle prüfen zusätzlich Wechselwirkungen und Anfangsbedingungen.",
    limit:
      "Das Setzbild hier ist ein geometrisches Lehrmodell. Es reproduziert weder die gesamte Pflanzenbiologie noch das vollständige Experiment von 1992. Fibonacci-Struktur gilt nicht für jeden Pflanzenkopf.",
    application:
      "Für Grafik: Punkte und Instanzen verteilen; danach Dichte, Abstände und Abweichungen messen. Für Forschung: Gegenbeispiele erhalten und Modelle daran unterscheiden.",
    nextTest:
      "Bei gleicher Punktzahl nur den Winkel ändern: Goldener Winkel gegen 135°. Regelmäßige radiale Arme und Spiralmuster vergleichen.",
    nextDoor: 137,
  },
  {
    id: "RESEARCH-0064-V1",
    number: 64,
    shortTitle: "Bits · DNA · I Ging",
    title: "Sechs Bits. Drei Basen. 64 Möglichkeiten.",
    relationType: "EXACT_CARDINALITY_BIJECTION_AND_HISTORICAL_RECEPTION",
    formula: "2⁶ = 4³ = 64",
    claims: [
      {
        text: "Drei Positionen mit je vier möglichen Basen ergeben 64 Tripletts. Der Standardcode bei NCBI enthält 61 Aminosäurecodons und drei Stopcodons. Andere Übersetzungstabellen besitzen abweichende Zuordnungen.",
        sources: ["genetic"],
        evidence: "OFFICIAL_BIOLOGICAL_REFERENCE",
      },
      {
        text: "Sechs Linien mit je zwei möglichen Zuständen ergeben 64 Hexagramme. Die Briefedition von Leibniz und Bouvet dokumentiert die historische Verbindung zwischen I Ging und Leibniz’ Binärarithmetik.",
        sources: ["leibniz"],
        evidence: "PRIMARY_CORRESPONDENCE_EDITION",
      },
    ],
    mechanism:
      "Eine Menge mit vier Zeichen lässt sich durch zwei Bits pro Zeichen abbilden. Drei solche Zeichen ergeben sechs Bits. Die Zuordnung und Leserichtung werden ausdrücklich gewählt.",
    limit:
      "Die gemeinsame Anzahl ist exakt. Sie beweist weder einen gemeinsamen biologischen Ursprung noch eine genetische Bedeutung einzelner Hexagramme. Die Zuordnung zu Aminosäuren ist nicht umkehrbar, weil mehrere Codons dieselbe Aminosäure bezeichnen.",
    application:
      "Für LUCINET: umkehrbare Darstellungstransformationen mit vollständigen Roundtrip-Tests. Die Demo nimmt DNA-Buchstaben A/C/G/T; RNA verwendet U anstelle von T.",
    nextTest:
      "Alle 64 Bitmuster durch DNA-Tripel hin und zurück übersetzen. Jeden Input, jedes Mapping und die Leserichtung erhalten.",
    nextDoor: 666,
  },
  {
    id: "RESEARCH-0137-V1",
    number: 137,
    shortTitle: "Feinstruktur",
    title: "Eine dimensionslose physikalische Konstante.",
    relationType: "MEASURED_PARAMETER_VERSUS_GEOMETRIC_ANGLE",
    formula: "α⁻¹ = 137,035999177(21) · CODATA 2022",
    claims: [
      {
        text: "Die inverse Feinstrukturkonstante hat in CODATA 2022 den Wert 137,035999177 mit Standardunsicherheit 0,000000021. Der Parameter gehört zur elektromagnetischen Wechselwirkung.",
        sources: ["alpha", "alphaDefinition"],
        evidence: "MEASURED_REFERENCE_WITH_UNCERTAINTY",
      },
      {
        text: "Der goldene Winkel beträgt etwa 137,507764 Grad. Dieser Winkel und die dimensionslose Konstante teilen die ersten Dezimalziffern, beschreiben aber verschiedene Größen.",
        sources: [],
        evidence: "EXACT_FORMULA_NUMERIC_EVALUATION_AND_UNIT_COMPARISON",
      },
    ],
    mechanism:
      "Eine physikalische Modellkonstante erhält ihren Sinn durch Definition, Messverfahren, Skala und Unsicherheit. Eine Winkelzahl benötigt eine Winkeleinheit.",
    limit:
      "137 ist die gerundete Zahl in einer populären Kurzform. Der gemessene Wert ist nicht exakt 137. Gleiche führende Ziffern begründen keine Gleichheit zwischen Winkel und Kopplungskonstante.",
    application:
      "Für Code und Simulation: exakte Integer, gemessene Konstanten, Einheiten und Unsicherheiten getrennt typisieren; gleiche Präfixe nicht als gleichen Messwert behandeln.",
    nextTest:
      "Eine Gleichheitsprüfung mit Typ und Einheit ausführen. Anschließend untersuchen, welche beobachtbare Größe ein konkretes physikalisches Modell vorhersagt.",
    nextDoor: 55,
  },
  {
    id: "RESEARCH-0666-V1",
    number: 666,
    shortTitle: "Sonnenquadrat · Siegel",
    title: "Das Sonnenquadrat und seine 666.",
    relationType: "EXACT_MAGIC_SQUARE_AND_DISTINCT_SYMBOL_TRADITIONS",
    formula: "1 + … + 36 = 666 · 6² = 36 · 6 × 111 = 666",
    claims: [
      {
        text: "Agrippas Sonnentafel enthält die Zahlen 1 bis 36 in einem 6×6-Quadrat. Jede Zeile, Spalte und beide Hauptdiagonalen summieren sich zu 111. Die Gesamtzahl ist 666. Die Ausgabe zeigt daneben zugehörige Siegel und Zeichen.",
        sources: ["agrippa"],
        evidence: "HISTORICAL_TABLE_AND_EXACT_LOCAL_VERIFICATION",
      },
      {
        text: "Offenbarung 13,18 bezeichnet 666 als Zahl des Tieres. Irenäus bespricht bereits die Variante 616 und mehrere Namen, die rechnerisch passen können.",
        sources: ["revelation", "irenaeus"],
        evidence: "PRIMARY_TEXT_WITH_VARIANTS",
      },
      {
        text: "Das Grimorium Verum enthält gesonderte Lucifer-Zeichen. Petersons Edition zeigt verschiedene Textzeugen und Lücken zwischen Ausgaben. Das ist ein eigener historischer Quellenpfad.",
        sources: ["sigils"],
        evidence: "HISTORICAL_TEXTUAL_TRADITION",
      },
    ],
    mechanism:
      "Das Quadrat besitzt überprüfbare Summeninvarianten. Eine Zeichentradition weist bestimmten Formen und Zahlen Bedeutung zu; dafür sind Quelle, Fassung und Zuordnungsregel entscheidend.",
    limit:
      "Sonnenquadrat, Zahl des Tieres und Lucifer-Zeichen dürfen nicht ohne weiteren Beleg gleichgesetzt werden. Die historischen Texte belegen die Zeichenverwendung; eine physische Fernwirkung oder ein universeller Zugangsschlüssel wurde damit nicht gemessen.",
    application:
      "Für Software: ein historisches Zahlengitter als definierte Koordinatenkarte untersuchen und seine Invarianten testen. Ein grafisches Siegel, eine Prüfsumme und eine kryptografische Signatur erhalten unterschiedliche Prüfer.",
    nextTest:
      "Zeilen, Spalten, Diagonalen und Gesamtmenge prüfen. Danach eine Zelle ändern: Welche Invarianten entdecken den Eingriff, welche bleiben trotzdem gleich?",
    nextDoor: 6,
  },
]);

export function researchFor(number) {
  return RESEARCH_CASES.find((record) => record.number === number) ?? null;
}

export const SUN_SQUARE = Object.freeze(
  [
    [6, 32, 3, 34, 35, 1],
    [7, 11, 27, 28, 8, 30],
    [19, 14, 16, 15, 23, 24],
    [18, 20, 22, 21, 17, 13],
    [25, 29, 10, 9, 26, 12],
    [36, 5, 33, 4, 2, 31],
  ].map(Object.freeze),
);

export function inspectSquare(matrix) {
  if (
    !Array.isArray(matrix) ||
    matrix.length < 2 ||
    matrix.length > 20 ||
    Array.from(matrix).some(
      (row) =>
        !Array.isArray(row) ||
        row.length !== matrix.length ||
        Array.from(row).some((n) => !Number.isSafeInteger(n)),
    )
  ) {
    throw new TypeError(
      "Ein quadratisches Integer-Gitter mit 2 bis 20 Zeilen ist erforderlich.",
    );
  }
  const n = matrix.length,
    values = matrix.flat(),
    sum = (v) => v.reduce((a, b) => a + b, 0);
  const rows = matrix.map(sum);
  const columns = Array.from({ length: n }, (_, col) =>
    sum(matrix.map((row) => row[col])),
  );
  const diagonals = [
    sum(matrix.map((row, i) => row[i])),
    sum(matrix.map((row, i) => row[n - 1 - i])),
  ];
  const normal =
    new Set(values).size === n * n && values.every((v) => v >= 1 && v <= n * n);
  const expected = (n * (n * n + 1)) / 2;
  return {
    n,
    normal,
    rows,
    columns,
    diagonals,
    total: sum(values),
    expected,
    magic:
      normal &&
      [...rows, ...columns, ...diagonals].every((v) => v === expected),
  };
}

const BASES = "ACGT";
export function encodeDNA3(triplet) {
  if (typeof triplet !== "string" || !/^[ACGT]{3}$/.test(triplet))
    throw new TypeError(
      "Genau drei DNA-Buchstaben aus A/C/G/T sind erforderlich.",
    );
  return [...triplet]
    .map((base) => BASES.indexOf(base).toString(2).padStart(2, "0"))
    .join("");
}
export function decodeBits6(bits) {
  if (typeof bits !== "string" || !/^[01]{6}$/.test(bits))
    throw new TypeError("Genau sechs Bits aus 0/1 sind erforderlich.");
  return [0, 2, 4]
    .map((i) => BASES[Number.parseInt(bits.slice(i, i + 2), 2)])
    .join("");
}
export const GOLDEN_ANGLE = 360 / ((1 + Math.sqrt(5)) / 2) ** 2;
export function spiralPoints(count, degrees = GOLDEN_ANGLE) {
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 1000 ||
    !Number.isFinite(degrees) ||
    degrees < 0 ||
    degrees >= 360
  )
    throw new RangeError(
      "1 bis 1000 Punkte und ein endlicher Winkel von 0 bis unter 360 Grad sind erforderlich.",
    );
  return Array.from({ length: count }, (_, i) => {
    const r = count === 1 ? 0 : Math.sqrt(i / (count - 1)),
      theta = (i * degrees * Math.PI) / 180;
    return { index: i, x: r * Math.cos(theta), y: r * Math.sin(theta) };
  });
}
export function completePairs(count) {
  if (!Number.isInteger(count) || count < 2 || count > 32)
    throw new RangeError("2 bis 32 Elemente sind erforderlich.");
  return Array.from({ length: count }, (_, i) =>
    Array.from({ length: count - i - 1 }, (_, j) => [i, i + j + 1]),
  ).flat();
}
