// SPDX-License-Identifier: MIT
// Juri Halveth / HALVETH. Original finite models, developed with AI assistance.
import { door, canonical, sha256, RANGE } from "./model.mjs";
import { plainJson } from "../../scripts/plain-json.mjs";

export const JOURNEY_VERSION = "1.0.0";
export const ROLE_SOURCES = Object.freeze({
  XSD: {
    title: "W3C · Schreibweise, Wert und Abbildung",
    url: "https://www.w3.org/TR/xmlschema11-2/#dt-lexical-space",
  },
  PROV: {
    title: "W3C PROV · Entitäten, Aktivitäten und Herkunft",
    url: "https://www.w3.org/TR/prov-o/#description-starting-point-terms",
  },
  SKOS: {
    title: "W3C SKOS · exakte und nahe Zuordnungen",
    url: "https://www.w3.org/TR/skos-reference/#mapping",
  },
  YONEDA: {
    title: "Tom Leinster · Basic Category Theory, Kap. 4",
    url: "https://arxiv.org/abs/1612.09375",
  },
  STIGMERGY: {
    title: "Theraulaz & Bonabeau 1999 · Stigmergie",
    url: "https://santafe.edu/research/results/papers/1112-a-brief-history-of-stigmergy",
  },
  SI: {
    title: "BIPM · Zahlenwert und Einheit",
    url: "https://www.bipm.org/en/publications/si-brochure",
  },
});
export const ROUTES = Object.freeze({
  REPRESENTATION: {
    title: "Darstellung wechseln · Wert erhalten",
    operators: ["TO_BINARY", "BINARY_TO_HEX", "FROM_HEX"],
  },
  PLUS_THEN_DOUBLE: {
    title: "Erst +1, dann ×2",
    operators: ["PLUS_ONE", "DOUBLE"],
  },
  DOUBLE_THEN_PLUS: {
    title: "Erst ×2, dann +1",
    operators: ["DOUBLE", "PLUS_ONE"],
  },
  MODULO_12: {
    title: "Rest modulo 12 · mögliche Ursprünge",
    operators: ["MOD_12", "PREIMAGES_12"],
  },
});
const parameters = {
  TO_BINARY: { radix: 2 },
  BINARY_TO_HEX: { inputRadix: 2, outputRadix: 16 },
  FROM_HEX: { radix: 16 },
  PLUS_ONE: { addend: 1 },
  DOUBLE: { factor: 2 },
  MOD_12: { modulus: 12 },
  PREIMAGES_12: { modulus: 12, minimum: 0, maximum: 1000 },
};
const op = (id, input, output, loss, description) =>
  Object.freeze({
    id: `HALVETH:NUMBER-OP:${id}`,
    version: JOURNEY_VERSION,
    inputType: input,
    outputType: output,
    parameters: parameters[id],
    deterministic: true,
    informationLoss: loss,
    equality: "TYPED_EXACT_PAYLOAD",
    description,
  });
const OPERATORS = Object.freeze({
  TO_BINARY: op(
    "TO_BINARY",
    "INTEGER",
    "RADIX_LITERAL",
    "NONE",
    "Integer in ausdrücklich binärer Schreibweise darstellen.",
  ),
  BINARY_TO_HEX: op(
    "BINARY_TO_HEX",
    "RADIX_LITERAL",
    "RADIX_LITERAL",
    "NONE",
    "Binären Wert auslesen und ausdrücklich hexadezimal darstellen.",
  ),
  FROM_HEX: op(
    "FROM_HEX",
    "RADIX_LITERAL",
    "INTEGER",
    "NONE",
    "Hexadezimale Darstellung in einen Integer überführen.",
  ),
  PLUS_ONE: op(
    "PLUS_ONE",
    "INTEGER",
    "INTEGER",
    "NONE",
    "Im Integer-Modell eins addieren; inverse Operation ist minus eins.",
  ),
  DOUBLE: op(
    "DOUBLE",
    "INTEGER",
    "INTEGER",
    "NONE",
    "Integer verdoppeln; auf geraden Outputs invers durch zwei teilen.",
  ),
  MOD_12: op(
    "MOD_12",
    "INTEGER",
    "RESIDUE_MOD_12",
    "MANY_TO_ONE_WITH_ORIGIN_RETAINED",
    "Den Rest modulo 12 bilden; der Ausgangsrecord bleibt erhalten.",
  ),
  PREIMAGES_12: op(
    "PREIMAGES_12",
    "RESIDUE_MOD_12",
    "CANDIDATE_SET",
    "NO_UNIQUE_SELECTION",
    "Alle Urbilder dieses Restes im gebundenen Registerbereich 0 bis 1000 aufzählen.",
  ),
});
const int = (value) => ({ kind: "INTEGER", value });
function checkedRegistryInteger(n) {
  if (!Number.isSafeInteger(n) || Object.is(n, -0) || n < 0 || n > 1000)
    throw new TypeError("Ganze Registerzahl 0–1000 erforderlich.");
  return n;
}

export function roleProfile(n) {
  const record = door(n); // Reuses the existing strict 0..1000 input contract.
  const text = String(n);
  const places = [...text].map((digit, i) => ({
    digit: Number(digit),
    power: text.length - i - 1,
    contribution: Number(digit) * 10 ** (text.length - i - 1),
  }));
  return {
    schema: "halveth.number-role-profile.v1",
    number: n,
    registryId: record.id,
    representations: {
      decimal: text,
      binary: record.math.binary,
      hexadecimal: record.math.hexadecimal,
    },
    decimalPlaces: places,
    finiteCardinality: {
      count: n,
      indexMinimum: n ? 0 : null,
      indexMaximum: n ? n - 1 : null,
      fixedWidthBits: n ? Math.ceil(Math.log2(n)) : null,
      state: n ? "FINITE_INDEX_DOMAIN" : "EMPTY_DOMAIN",
    },
    pairCount: n < 2 ? 0 : (n * (n - 1)) / 2,
    ascii: record.ascii,
    http: record.http,
    orderRole: {
      definitionId: "INTEGER_LE_ON_0_TO_1000_V1",
      rule: "probe <= number",
      probeRange: { min: 0, max: 1000 },
      yesAnswers: n + 1,
      noAnswers: 1000 - n,
      incomingMorphismsIncludingIdentity: n + 1,
      outgoingMorphismsIncludingIdentity: 1001 - n,
      coverage: "COMPLETE_FOR_THIS_DECLARED_FINITE_ORDER",
    },
    scope: "COMPUTED_CONTEXT_ROLES_NOT_COMPLETE_HISTORICAL_MEANING",
  };
}
export function orderProbe(number, probe) {
  checkedRegistryInteger(number);
  checkedRegistryInteger(probe);
  return probe <= number;
}
export function firstOrderDifference(a, b) {
  checkedRegistryInteger(a);
  checkedRegistryInteger(b);
  if (a === b) return null;
  const probe = Math.min(a, b) + 1;
  return {
    probe,
    left: orderProbe(a, probe),
    right: orderProbe(b, probe),
    scope: "DECLARED_FINITE_ORDER_ONLY",
  };
}

export function moduloCandidates(remainder) {
  if (
    !Number.isInteger(remainder) ||
    Object.is(remainder, -0) ||
    remainder < 0 ||
    remainder > 11
  )
    throw new TypeError("Rest 0–11 erforderlich.");
  return Array.from(
    { length: Math.floor((RANGE.max - remainder) / 12) + 1 },
    (_, i) => remainder + 12 * i,
  );
}
function applyOperator(id, input) {
  if (input.kind !== OPERATORS[id].inputType)
    throw new TypeError("Operator-Typbrücke fehlt.");
  switch (id) {
    case "TO_BINARY":
      return {
        kind: "RADIX_LITERAL",
        radix: 2,
        text: input.value.toString(2),
        decodedValue: input.value,
      };
    case "BINARY_TO_HEX": {
      if (input.radix !== 2)
        throw new TypeError("Binäre Eingabe erforderlich.");
      const value = Number.parseInt(input.text, 2);
      return {
        kind: "RADIX_LITERAL",
        radix: 16,
        text: value.toString(16).toUpperCase(),
        decodedValue: value,
      };
    }
    case "FROM_HEX":
      if (input.radix !== 16)
        throw new TypeError("Hexadezimale Eingabe erforderlich.");
      return int(Number.parseInt(input.text, 16));
    case "PLUS_ONE":
      return int(input.value + 1);
    case "DOUBLE":
      return int(input.value * 2);
    case "MOD_12":
      return {
        kind: "RESIDUE_MOD_12",
        modulus: 12,
        remainder: input.value % 12,
        originRange: { min: 0, max: 1000 },
      };
    case "PREIMAGES_12":
      return {
        kind: "CANDIDATE_SET",
        values: moduloCandidates(input.remainder),
        range: { min: 0, max: 1000 },
        selection: "OPEN_ALL_RETAINED",
      };
    default:
      throw new TypeError("Unbekannter Operator.");
  }
}
export function routeValues(number, route) {
  door(number);
  if (typeof route !== "string" || !Object.hasOwn(ROUTES, route))
    throw new TypeError("Unbekannter Weg.");
  const values = [int(number)];
  for (const operator of ROUTES[route].operators)
    values.push(applyOperator(operator, values.at(-1)));
  return values;
}
function bindRun(runId, recordedAt) {
  if (
    typeof runId !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(runId)
  )
    throw new TypeError("ASCII-Lauf-ID erforderlich.");
  if (
    typeof recordedAt !== "string" ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(recordedAt) ||
    !Number.isFinite(Date.parse(recordedAt)) ||
    new Date(recordedAt).toISOString() !== recordedAt
  )
    throw new TypeError("Exakter ISO-UTC-Aufzeichnungszeitpunkt erforderlich.");
}

export async function buildJourney(number, route, runId, recordedAt) {
  bindRun(runId, recordedAt);
  const values = routeValues(number, route),
    states = [],
    events = [],
    relations = [];
  for (let i = 0; i < values.length; i++) {
    const digest = await sha256(values[i]);
    states.push({
      occurrenceId: `JOURNEY:${runId}:STATE:${i}`,
      contentId: `CONTENT:${digest.slice(7)}`,
      digest,
      payload: values[i],
    });
  }
  for (let i = 0; i < values.length - 1; i++) {
    const definition = OPERATORS[ROUTES[route].operators[i]],
      definitionDigest = await sha256(definition),
      eventId = `JOURNEY:${runId}:EVENT:${i}`;
    const endpoint = (state, role) => ({
      kind: "CONTENT",
      id: state.contentId,
      digest: state.digest,
      occurrenceId: state.occurrenceId,
      semanticAddress: `number-journey/${runId}/states/${role === "INPUT" ? i : i + 1}/payload`,
      role,
      fieldLocator: "/payload",
      valueType: state.payload.kind,
    });
    const relationId = `JOURNEY:${runId}:RELATION:${i}`;
    events.push({
      id: eventId,
      kind: "SYNTHETIC_MODEL_STEP",
      sequence: i,
      eventAt: "UNKNOWN",
      recordedAt,
      relationId,
      clockSource: "CALLER_RECORDING_CLOCK_NOT_EXTERNAL_HISTORY",
      observationCoverage: "MODEL_VALUES_AND_DECLARED_SEQUENCE_ONLY",
    });
    relations.push({
      schema: "halveth.number-model-relation.v1",
      id: relationId,
      definitionId: definition.id,
      definitionVersion: definition.version,
      definitionDigest,
      definition,
      relationType: "MODEL_TRANSFORMATION",
      direction: "LEFT_TO_RIGHT",
      arity: 2,
      algebra: {
        composition: "TYPED_ROUTE_ORDER",
        transitivity: "NOT_INFERRED",
        symmetry: false,
      },
      leftEndpoint: endpoint(states[i], "INPUT"),
      rightEndpoint: endpoint(states[i + 1], "OUTPUT"),
      scope: {
        inputRegistryRange: { min: 0, max: 1000 },
        outputRange: "OPERATOR_DEFINED_MAY_EXCEED_INPUT_REGISTRY",
        modelVersion: JOURNEY_VERSION,
      },
      time: {
        eventAt: "UNKNOWN",
        recordedAt,
        orderBasis: "DECLARED_MODEL_SEQUENCE",
      },
      sourceRefs: ["XSD", "PROV"],
      evidenceState: "COMPUTED_MODEL",
      eventId,
      authorityEffect: "NONE",
      writeDomainId: `JOURNEY:${runId}:RELATION-WRITE:${i}`,
    });
  }
  const last = states.at(-1).payload;
  return {
    schema: "halveth.number-journey.v1",
    modelVersion: JOURNEY_VERSION,
    runId,
    recordedAt,
    eventAt: "UNKNOWN",
    input: number,
    route,
    profile: roleProfile(number),
    states,
    events,
    relations,
    evaluation: {
      first: number,
      lastKind: last.kind,
      lastValue: last.kind === "INTEGER" ? last.value : null,
      valuePreserved: last.kind === "INTEGER" ? last.value === number : null,
      uniqueInverseFromFinalOutput: route !== "MODULO_12",
      originRetained: true,
      candidateCount: last.kind === "CANDIDATE_SET" ? last.values.length : null,
      claimCeiling: "FINITE_LOCAL_MODEL_TRACE_ONLY",
    },
    correlationCluster: "ONE_LOCAL_NUMBER_JOURNEY_MODEL_1_0_0",
    sources: ROLE_SOURCES,
  };
}
export async function validateJourney(packet) {
  plainJson(packet); // Reject hidden fields/getters before cloning or reading.
  const snapshot = structuredClone(packet);
  if (
    snapshot.schema !== "halveth.number-journey.v1" ||
    snapshot.modelVersion !== JOURNEY_VERSION
  )
    throw new TypeError("Unbekannte Journey-Fassung.");
  const expected = await buildJourney(
    snapshot.input,
    snapshot.route,
    snapshot.runId,
    snapshot.recordedAt,
  );
  if (canonical(snapshot) !== canonical(expected))
    throw new TypeError(
      "Lauf, Endpunkte, Definitionen oder Auswertung stimmen nicht mit diesem Modell überein.",
    );
  return {
    state: "VALID_FOR_DECLARED_MODEL",
    packetDigest: await sha256(snapshot),
    claimKey: await sha256({
      modelVersion: JOURNEY_VERSION,
      input: snapshot.input,
      route: snapshot.route,
    }),
    scope: "LOCAL_MODEL_ONLY",
  };
}

export class LocalHive {
  #runs = new Map();
  async collect(packet) {
    plainJson(packet);
    const copy = structuredClone(packet),
      validation = await validateJourney(copy);
    const prior = this.#runs.get(copy.runId);
    if (prior) {
      if (prior.validation.packetDigest !== validation.packetDigest)
        throw new Error("Diese Lauf-ID ist bereits anders gebunden.");
      return { state: "ALREADY_COLLECTED", ...this.summary() };
    }
    this.#runs.set(copy.runId, { packet: copy, validation });
    return { state: "COLLECTED", ...this.summary() };
  }
  summary() {
    return {
      runCount: this.#runs.size,
      claimCount: new Set(
        [...this.#runs.values()].map((v) => v.validation.claimKey),
      ).size,
      provenanceClusterCount: this.#runs.size ? 1 : 0,
      location: "THIS_BROWSER_SESSION_ONLY",
    };
  }
  export() {
    return {
      schema: "halveth.local-number-hive.v1",
      modelVersion: JOURNEY_VERSION,
      ...this.summary(),
      witnesses: structuredClone([...this.#runs.values()]),
      claimCeiling:
        "COLLECTED_LOCAL_MODEL_RUNS_NOT_INDEPENDENT_EXTERNAL_CONFIRMATIONS",
    };
  }
  clear() {
    this.#runs.clear();
    return this.summary();
  }
}
