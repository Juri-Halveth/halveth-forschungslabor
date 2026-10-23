// SPDX-License-Identifier: MIT
import { writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  door,
  sha256,
  RANGE,
  SOURCES,
  SOURCE_ARCHIVE_SHA256,
} from "./model.mjs";

export async function buildRegistry() {
  const doors = [];
  for (let n = 0; n <= 1000; n++) {
    const record = door(n);
    doors.push({ ...record, recordDigest: await sha256(record) });
  }
  return {
    schema: "halveth.doors.registry.v2",
    range: RANGE,
    sourceArchiveSha256: SOURCE_ARCHIVE_SHA256,
    derivation:
      "NEW_COMPUTATION_FROM_DECLARED_PROPERTIES; ORIGINAL_V1_PRESERVED_SEPARATELY",
    scope:
      "1001 mathematical records; selected design motifs; no claim of 1001 individual historical investigations",
    sources: SOURCES,
    doors,
    heldOutOfRange: [
      {
        number: 1024,
        state: "OUTSIDE_DECLARED_RANGE",
        reopenTrigger: "Explicitly extend register version",
      },
      {
        number: 2048,
        state: "OUTSIDE_DECLARED_RANGE",
        reopenTrigger: "Explicitly extend register version",
      },
    ],
  };
}
export function buildRelations(registry) {
  const address = (record) => ({
    kind: "CONTENT_PACKET",
    id: record.id,
    digest: record.recordDigest,
    semanticAddress: record.semanticAddress,
  });
  return {
    schema: "halveth.doors.relations.v1",
    definition: {
      id: "INTEGER_SUCCESSOR_V1",
      meaning: "Endpoint B is the integer value of endpoint A plus one",
      transitive: false,
    },
    scope:
      "Only the 1000 adjacent successor pairs in 0..1000; not every possible relation",
    relations: registry.doors
      .slice(0, -1)
      .map((record, n) => ({
        id: `SUCCESSOR:${n}:${n + 1}`,
        from: address(record),
        to: address(registry.doors[n + 1]),
        relationDefinitionId: "INTEGER_SUCCESSOR_V1",
        direction: "FROM_TO",
        scope: "INTEGERS_0_THROUGH_1000",
        time: { kind: "TIMELESS_ARITHMETIC", eventAt: "UNKNOWN" },
        sourceIds: ["MATH_V2"],
        evidenceState: "COMPUTED",
        authority: "MATHEMATICAL_REFERENCE_ONLY",
        writeDomain: `halveth.doors.v2/relation/${n}-${n + 1}`,
      })),
  };
}
export async function generate({ check = false } = {}) {
  const registry = await buildRegistry(),
    relations = buildRelations(registry);
  for (const [name, value] of [
    ["registry.json", registry],
    ["relations.json", relations],
  ]) {
    // One addressable record per line keeps generated diffs bounded and readable.
    const collection = name === "registry.json" ? "doors" : "relations";
    const header = Object.entries(value)
      .filter(([key]) => key !== collection)
      .map(([key, v]) => `  ${JSON.stringify(key)}: ${JSON.stringify(v)}`);
    const bytes = `{\n${header.join(",\n")},\n  ${JSON.stringify(collection)}: [\n${value[collection].map((row) => "    " + JSON.stringify(row)).join(",\n")}\n  ]\n}\n`;
    const target = new URL(name, import.meta.url);
    if (check) {
      if ((await readFile(target, "utf8")) !== bytes)
        throw new Error(`${name} differs from deterministic build`);
    } else await writeFile(target, bytes, "utf8");
  }
  return {
    doors: registry.doors.length,
    relations: relations.relations.length,
  };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  console.log(await generate({ check: process.argv.includes("--check") }));
