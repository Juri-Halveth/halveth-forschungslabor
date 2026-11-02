// SPDX-License-Identifier: MIT
// Project design: Juri Halveth / HALVETH. Implementation with AI assistance.
import { HTTP_SOURCE, HTTP_ROWS } from "./http-status-data.mjs";
import { plainJson } from "../../scripts/plain-json.mjs";
export const RANGE = Object.freeze({ min: 0, max: 1000, count: 1001 });
export const SOURCE_ARCHIVE_SHA256 =
  "05ff6e9831050f079b90d12e0cfe2274bb0189a7ba726bdc5c7af2a7bee1aa89";
export const SOURCES = Object.freeze([
  {
    id: "MATH_V2",
    title: "Eigene endliche Berechnung, unabhängig gegengeprüft",
    url: null,
    scope: "Ganzzahlen 0–1000; Darstellungen und arithmetische Prädikate",
  },
  {
    id: "USER_ARCHIVE_V1",
    title: "HALVETH_1001_TUEREN_v1.zip",
    url: null,
    scope: "Gelieferte Entwurfsmotive; gebunden über SHA-256",
  },
  {
    id: "RFC20",
    title: "RFC 20 · ASCII",
    url: "https://datatracker.ietf.org/doc/html/rfc0020",
    scope: "7-Bit-Zeichencodes; ESC = 27, ! = 33",
  },
  {
    id: "ECMA48",
    title: "ECMA-48 · Steuerfunktionen",
    url: "https://ecma-international.org/publications-and-standards/standards/ecma-48/",
    scope: "Kontextabhängige Steuersequenzen für Darstellung",
  },
  {
    id: "IANA_HTTP",
    title: "IANA · HTTP-Statusregister",
    url: HTTP_SOURCE.landingPage,
    scope:
      "CSV-Snapshot vom 2026-10-23; Registry-Stand 2025-09-15, einschließlich unzugewiesener und temporärer Einträge",
  },
  {
    id: "TI555",
    title: "Texas Instruments · NE555-Datenblatt",
    url: "https://www.ti.com/lit/ds/symlink/ne555.pdf",
    scope: "Schwellwerte, Latch und ideale RC-Zeitnäherung",
  },
  {
    id: "SANTILLAN2018",
    title: "Santillán 2018 · gekoppelte 555-Oszillatoren",
    url: "https://doi.org/10.31349/RevMexFis.64.107",
    scope:
      "Experiment an zwei gekoppelten Schaltungen; kein Beleg für dieses Softwaremodell",
  },
  {
    id: "CAMENZIND",
    title: "Hans Camenzind · Oral History",
    url: "https://www.semiconductormuseum.com/Transistors/LectureHall/Camenzind/Camenzind_Page2.htm",
    scope: "Vom Entwickler berichtete Wahl des Produktnamens",
  },
]);

const MOTIFS = new Map([
  [
    0,
    [
      "ZERO · Referenz",
      "Wie unterscheiden wir den gemessenen Wert 0 von einer fehlenden Beobachtung?",
    ],
  ],
  [
    1,
    [
      "Identität · Start",
      "Welche Eigenschaften bleiben erhalten, wenn wir mit 1 multiplizieren?",
    ],
  ],
  [
    2,
    [
      "Paar · Relation",
      "Welche Definition und Quelle bindet eine Verbindung zwischen zwei Knoten?",
    ],
  ],
  [
    3,
    [
      "Dreieck · Kopplung",
      "Welche der drei möglichen Kanten sind tatsächlich vorhanden?",
    ],
  ],
  [
    4,
    [
      "Vier Knoten",
      "Wie unterscheiden sich Quadrat, Kette und vollständiger Graph bei gleicher Knotenzahl?",
    ],
  ],
  [5, ["Fünferzyklus", "Was passiert beim letzten Schritt zurück zum Anfang?"]],
  [
    6,
    [
      "Paarverbindungen",
      "Vier Knoten besitzen sechs mögliche ungerichtete Paare: welche sind belegt?",
    ],
  ],
  [
    7,
    [
      "Beobachtungsfenster",
      "Welches Ergebnis ändert sich bei einer anderen Fensterlänge?",
    ],
  ],
  [
    8,
    [
      "2 × 2 × 2",
      "Welche unabhängigen Koordinaten benötigt die gewählte räumliche Anordnung?",
    ],
  ],
  [
    9,
    [
      "3 × 3",
      "Was bleibt gleich, wenn dasselbe Neunerfeld anders angeordnet wird?",
    ],
  ],
  [
    10,
    [
      "Stellenübertrag",
      "Welche Änderung betrifft den Wert und welche nur seine Darstellung?",
    ],
  ],
  [
    27,
    [
      "ESC · Code 27",
      "Was interpretiert der gebundene Empfänger nach einem ESC-Zeichen?",
    ],
  ],
  [
    33,
    [
      "033 · Basiskontrast",
      "Meint 033 eine dezimale ID oder einen ausdrücklich oktalen Wert?",
    ],
  ],
  [
    256,
    [
      "GENESIS-256",
      "Welche Grenze wird mit 256 Einträgen tatsächlich erreicht?",
    ],
  ],
  [
    512,
    [
      "GENESIS-512",
      "Welche andere Topologie liefert bei 512 Knoten ein anderes Ergebnis?",
    ],
  ],
  [
    555,
    [
      "TRIPLE TIMER",
      "Wie unterscheiden sich Phasendrift, wiederkehrendes Zusammentreffen und Kopplung?",
    ],
  ],
  [
    666,
    [
      "Dreifache Schleife",
      "Welche drei Schleifen, Zustände und Kopplungen sind im Entwurf genau definiert?",
    ],
  ],
  [
    888,
    [
      "8 · 8 · 8",
      "Welche Wirkung stammt aus Kopplung und welche aus der gewählten Darstellung?",
    ],
  ],
  [
    999,
    [
      "Gemeinsamer Kern K",
      "Was geschieht bei 998 Ja-Stimmen und einer fehlenden Antwort?",
    ],
  ],
  [
    1000,
    [
      "Übergangsereignis",
      "Welche gebundene Regel und welcher alte Zustand erlauben das neue Ereignis?",
    ],
  ],
]);
const C0 = [
  "NUL",
  "SOH",
  "STX",
  "ETX",
  "EOT",
  "ENQ",
  "ACK",
  "BEL",
  "BS",
  "HT",
  "LF",
  "VT",
  "FF",
  "CR",
  "SO",
  "SI",
  "DLE",
  "DC1",
  "DC2",
  "DC3",
  "DC4",
  "NAK",
  "SYN",
  "ETB",
  "CAN",
  "EM",
  "SUB",
  "ESC",
  "FS",
  "GS",
  "RS",
  "US",
];
const HTTP_LOOKUP = new Map();
for (const row of HTTP_ROWS) {
  const [lo, hi = lo] = row.Value.split("-").map(Number);
  for (let n = lo; n <= hi; n++) {
    if (HTTP_LOOKUP.has(n)) throw new Error("Overlapping HTTP registry rows");
    HTTP_LOOKUP.set(n, row);
  }
}
export function httpReference(n) {
  integer(n, 0, 1000, "Tür");
  const row = HTTP_LOOKUP.get(n);
  if (!row) return null;
  const state =
    row.Description === "Unassigned"
      ? "UNASSIGNED_IN_SNAPSHOT"
      : row.Description.includes("Unused")
        ? "UNUSED_IN_SNAPSHOT"
        : row.Description.includes("OBSOLETED")
          ? "OBSOLETED_IN_SNAPSHOT"
          : row.Description.includes("TEMPORARY")
            ? "TEMPORARY_IN_SNAPSHOT"
            : "REGISTERED_IN_SNAPSHOT";
  return {
    namespace: "HTTP_STATUS",
    value: n,
    description: row.Description,
    state,
    sourceRange: row.Value,
    reference: row.Reference,
    sourceId: "IANA_HTTP",
    sourceDigest: `sha256:${HTTP_SOURCE.sha256}`,
    registryLastUpdated: HTTP_SOURCE.registryLastUpdated,
    retrievedAt: HTTP_SOURCE.retrievedAt,
  };
}

function integer(value, min, max, label) {
  if (
    !Number.isSafeInteger(value) ||
    Object.is(value, -0) ||
    value < min ||
    value > max
  )
    throw new TypeError(`${label}: ganze Zahl ${min}–${max} erforderlich`);
  return value;
}
function exact(object, fields, label) {
  if (
    !object ||
    Object.getPrototypeOf(object) !== Object.prototype ||
    Reflect.ownKeys(object).length !== fields.length ||
    fields.some(
      (k) =>
        !Object.hasOwn(object, k) ||
        !Object.hasOwn(Object.getOwnPropertyDescriptor(object, k), "value"),
    )
  )
    throw new TypeError(`${label}: unerwartete Struktur`);
}
export function doorId(n) {
  return `HALVETH:DOOR:${String(integer(n, 0, 1000, "Tür")).padStart(4, "0")}`;
}
export function factors(n) {
  integer(n, 0, 1000, "Zahl");
  if (n === 0) return null;
  const result = [];
  let rest = n;
  for (let d = 2; d * d <= rest; d++)
    while (rest % d === 0) {
      result.push(d);
      rest /= d;
    }
  if (rest > 1) result.push(rest);
  return result;
}
export function door(n) {
  integer(n, 0, 1000, "Tür");
  const primeFactors = factors(n),
    dec = String(n),
    root = Math.sqrt(8 * n + 1),
    motif = MOTIFS.get(n);
  const math = {
    decimal: dec,
    binary: n.toString(2),
    octal: n.toString(8),
    hexadecimal: n.toString(16).toUpperCase(),
    bitLength: n === 0 ? 0 : Math.floor(Math.log2(n)) + 1,
    binaryDisplayDigits: n.toString(2).length,
    digitSum: [...dec].reduce((a, c) => a + Number(c), 0),
    parity: n % 2 === 0 ? "EVEN" : "ODD",
    primeFactors,
    factorizationState:
      n === 0
        ? "UNDEFINED_FOR_ZERO"
        : n === 1
          ? "EMPTY_PRODUCT_ONE"
          : "FACTORED",
    isPrime: n >= 2 && primeFactors.length === 1,
    isComposite: n >= 2 && primeFactors.length > 1,
    isPowerOfTwo: n > 0 && (n & (n - 1)) === 0,
    isSquare: Number.isInteger(Math.sqrt(n)),
    isTriangular: Number.isInteger(root),
    isDecimalPalindrome: dec === [...dec].reverse().join(""),
    properDivisorSum:
      n === 0
        ? null
        : Array.from({ length: Math.floor(n / 2) }, (_, i) => i + 1)
            .filter((d) => n % d === 0)
            .reduce((a, b) => a + b, 0),
  };
  const ascii =
    n > 127
      ? null
      : {
          value: n,
          notation:
            n < 32
              ? C0[n]
              : n === 127
                ? "DEL"
                : n === 32
                  ? "SPACE"
                  : String.fromCodePoint(n),
          kind: n < 32 || n === 127 ? "CONTROL" : "GRAPHIC",
          sourceId: "RFC20",
        };
  const http = httpReference(n);
  return {
    id: doorId(n),
    number: n,
    semanticAddress: `integer/${n}`,
    math,
    ascii,
    http,
    design: motif
      ? {
          title: motif[0],
          question: motif[1],
          state: n === 27 ? "SOURCE_BOUND_REFERENCE" : "USER_DEFINED_DESIGN",
          sourceId: n === 27 ? "RFC20" : "USER_ARCHIVE_V1",
        }
      : null,
    investigation: {
      mathState: "COMPUTED",
      individualHistoricalResearch: "OPEN",
      physicalEffect: "NOT_TESTED",
      question:
        motif?.[1] ??
        `Welche messbare Änderung entsteht, wenn ${n} als Anzahl oder Parameter eines benannten Modells verwendet wird?`,
      countermodel: `Vergleiche denselben Versuch mit ${n === 0 ? 1 : n - 1}; halte alle anderen Parameter fest.`,
      reopenTrigger:
        "Konkreten Zielreferenten, zuständige Quelle oder unterscheidenden Versuch binden.",
    },
    sourceIds: [
      "MATH_V2",
      ...(ascii ? ["RFC20"] : []),
      ...(http ? ["IANA_HTTP"] : []),
      ...(motif && n !== 27 ? ["USER_ARCHIVE_V1"] : []),
      ...([27, 33].includes(n) ? ["ECMA48"] : []),
      ...(n === 555 ? ["TI555", "SANTILLAN2018", "CAMENZIND"] : []),
    ],
  };
}

export function interpretation033() {
  return [
    {
      representation: "033",
      base: 10,
      value: 33,
      ascii: "!",
      rule: "Dezimale Zahl; führende Null ist hier nur Formatierung.",
    },
    {
      representation: "033",
      base: 8,
      value: 27,
      ascii: "ESC",
      rule: "Ausdrücklich oktal interpretiert.",
    },
    {
      representation: "0x33",
      base: 16,
      value: 51,
      ascii: "3",
      rule: "Hexadezimale Schreibweise.",
    },
    {
      representation: "HALVETH:DOOR:0033",
      base: null,
      value: 33,
      ascii: null,
      rule: "Register-ID; ihr numerisches Feld bleibt dezimal 33.",
    },
  ];
}

export function timer({ ra, rb, c, vcc = 5 }) {
  for (const [name, value] of Object.entries({ ra, rb, c, vcc }))
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
      throw new TypeError(`${name}: endlicher positiver Wert erforderlich`);
  const high = Math.LN2 * (ra + rb) * c,
    low = Math.LN2 * rb * c,
    period = high + low;
  if (!Number.isFinite(period) || period <= 0 || !Number.isFinite(1 / period))
    throw new RangeError("Zeitkonstante außerhalb des Modells");
  return {
    ra,
    rb,
    c,
    vcc,
    high,
    low,
    period,
    frequency: 1 / period,
    dutyHigh: high / period,
    model: "IDEAL_RC_STEADY_STATE_V1",
  };
}
export function timerSample(time, config) {
  if (typeof time !== "number" || !Number.isFinite(time) || time < 0)
    throw new TypeError("Zeit muss endlich und nichtnegativ sein");
  const p = timer(config),
    phase = time % p.period,
    high = phase < p.high;
  const capacitor = high
    ? p.vcc - (2 / 3) * p.vcc * Math.exp(-phase / ((p.ra + p.rb) * p.c))
    : (2 / 3) * p.vcc * Math.exp(-(phase - p.high) / (p.rb * p.c));
  return {
    time,
    output: high ? 1 : 0,
    capacitor,
    phaseTurns: phase / p.period,
  };
}

const PROPOSAL = Object.freeze({
  id: "MODEL:PROPOSAL:1000",
  text: "Lokalen Modellzustand 1000 öffnen",
  scope: "LOCAL_SYNTHETIC_TRANSITION_ONLY",
});
export function ballot({ no = 0, missing = 0, veto = 0 } = {}) {
  for (const [k, v] of Object.entries({ no, missing, veto }))
    integer(v, 0, 999, k);
  if (no + missing + veto > 999)
    throw new RangeError("Mehr Antworten als die 999 registrierten Mitglieder");
  return {
    proposal: { ...PROPOSAL },
    votes: Array.from({ length: 999 }, (_, i) => ({
      memberId: `MODEL:MEMBER:${String(i + 1).padStart(3, "0")}`,
      proposalId: PROPOSAL.id,
      scope: PROPOSAL.scope,
      answer:
        i < no
          ? "NO"
          : i < no + missing
            ? "MISSING"
            : i < no + missing + veto
              ? "VETO"
              : "YES",
    })),
  };
}
export function evaluateBallot(packet, policy, window) {
  plainJson(packet);
  plainJson(policy);
  plainJson(window);
  exact(packet, ["proposal", "votes"], "Stimmenpaket");
  exact(packet.proposal, ["id", "text", "scope"], "Vorschlag");
  if (Object.entries(PROPOSAL).some(([k, v]) => packet.proposal[k] !== v))
    throw new TypeError("Vorschlag oder Scope ist nicht gebunden");
  exact(policy, ["kind", "requiredYes"], "Regel");
  if (!["UNANIMOUS", "QUORUM_WITH_VETO"].includes(policy.kind))
    throw new TypeError("Unbekannte Regel");
  integer(policy.requiredYes, 1, 999, "Ja-Schwelle");
  if (policy.kind === "UNANIMOUS" && policy.requiredYes !== 999)
    throw new TypeError("Einstimmigkeit benötigt 999 Ja-Stimmen");
  exact(window, ["nowMs", "deadlineMs"], "Zeitfenster");
  integer(window.nowMs, 0, Number.MAX_SAFE_INTEGER, "Modellzeit");
  integer(window.deadlineMs, 1, Number.MAX_SAFE_INTEGER, "Frist");
  if (!Array.isArray(packet.votes) || packet.votes.length !== 999)
    throw new TypeError("Genau 999 gebundene Mitglieder erforderlich");
  if (Reflect.ownKeys(packet.votes).length !== 1000)
    throw new TypeError("Stimmenliste enthält nicht deklarierte Eigenschaften");
  const counts = { YES: 0, NO: 0, MISSING: 0, VETO: 0 },
    ids = new Set();
  for (const vote of packet.votes) {
    exact(vote, ["memberId", "proposalId", "scope", "answer"], "Stimme");
    if (!/^MODEL:MEMBER:\d{3}$/.test(vote.memberId))
      throw new TypeError("Mitglieds-ID ungültig");
    const n = Number(vote.memberId.slice(-3));
    if (n < 1 || n > 999 || ids.has(vote.memberId))
      throw new TypeError(
        "Mitglied fehlt, doppelt oder außerhalb des Registers",
      );
    if (
      vote.proposalId !== PROPOSAL.id ||
      vote.scope !== PROPOSAL.scope ||
      !Object.hasOwn(counts, vote.answer)
    )
      throw new TypeError("Stimme gehört nicht zu diesem Vorschlag/Scope");
    ids.add(vote.memberId);
    counts[vote.answer]++;
  }
  const closed = window.nowMs >= window.deadlineMs;
  let state;
  if (counts.VETO > 0) state = "BLOCKED_BY_VETO";
  else if (!closed) state = "COLLECTING";
  else if (policy.kind === "UNANIMOUS" && counts.NO > 0) state = "DISSENT";
  else if (counts.YES >= policy.requiredYes) state = "ELIGIBLE";
  else if (counts.MISSING > 0) state = "INCOMPLETE_AT_DEADLINE";
  else state = "THRESHOLD_NOT_MET";
  return {
    schema: "halveth.doors.ballot-evaluation.v1",
    model: "SYNTHETIC_DECLARED_VOTES",
    proposal: { ...packet.proposal },
    policy: { ...policy },
    window: { ...window },
    counts,
    denominator: 999,
    state,
    claimCeiling: "LOCAL_RULE_EVALUATION_ONLY",
    realConsent: "NOT_ESTABLISHED",
  };
}
export function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
    .join(",")}}`;
}
export async function sha256(value) {
  const bytes = new TextEncoder().encode(canonical(value));
  return (
    "sha256:" +
    Array.from(
      new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes)),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("")
  );
}
export async function transition(packet, policy, window) {
  evaluateBallot(packet, policy, window);
  // Clone before awaiting, so the digest and retained votes bind the same snapshot.
  const snapshot = structuredClone(packet),
    result = evaluateBallot(snapshot, policy, window);
  if (result.state !== "ELIGIBLE")
    throw new Error(`Übergang bleibt geschlossen: ${result.state}`);
  snapshot.votes.sort((a, b) => (a.memberId < b.memberId ? -1 : 1));
  const kernel = {
    schema: "halveth.doors.aggregate.v1",
    sourceCount: 999,
    proposal: snapshot.proposal,
    votes: snapshot.votes,
    evaluation: result,
  };
  const kernelDigest = await sha256(kernel);
  return {
    schema: "halveth.doors.transition-event.v1",
    eventId: `MODEL:TRANSITION:${kernelDigest.slice(7)}`,
    kind: "LOCAL_SYNTHETIC_TRANSITION",
    from: "MODEL:STATE:999",
    to: "MODEL:STATE:1000",
    eventAt: "UNKNOWN",
    modelTimeMs: result.window.nowMs,
    kernelDigest,
    kernel,
    realWorldAuthority: "NONE",
  };
}
