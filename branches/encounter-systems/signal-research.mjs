// SPDX-License-Identifier: MIT
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pattern, experiment, SIGNAL_VERSION } from "./signal-model.mjs";
const root = import.meta.dirname;
const sha = (value) => createHash("sha256").update(value).digest("hex");
const normalized = (name) =>
  fs.readFileSync(path.join(root, name), "utf8").replace(/\r\n/g, "\n");
const runs = [];
for (const name of ["window", "pulse"])
  for (const noise of [0, 4])
    for (const mode of ["matched", "inverted", "detuned"]) {
      const result = experiment(pattern(name), { noise, mode });
      assert.equal(result.correct + result.wrong + result.unknown, 64);
      if (noise === 0)
        assert.equal(
          result[
            mode === "matched"
              ? "correct"
              : mode === "inverted"
                ? "wrong"
                : "unknown"
          ],
          64,
        );
      runs.push({
        pattern: name,
        noise,
        mode,
        correct: result.correct,
        wrong: result.wrong,
        unknown: result.unknown,
        decodedSha256: sha(JSON.stringify(result.decoded.bits)),
      });
    }
const disconnected = experiment(pattern("window"), { connected: false });
assert.equal(disconnected.unknown, 64);
const report = {
  schema: "halveth.signal-results.v1",
  modelVersion: SIGNAL_VERSION,
  scope: "DISCRETE_TIME_SOFTWARE_MODEL_ONLY",
  modelSha256: sha(normalized("signal-model.mjs")),
  planSha256: sha(normalized("SIGNAL_PLAN.json")),
  generatorSha256: sha(normalized("signal-research.mjs")),
  runs,
  disconnected: {
    correct: disconnected.correct,
    wrong: disconnected.wrong,
    unknown: disconnected.unknown,
  },
};
const json = JSON.stringify(report, null, 2) + "\n";
const module =
  "// SPDX-License-Identifier: MIT\n// Embedded results data: CC0-1.0\nexport const signalReport = " +
  json.trim() +
  ";\n";
if (process.argv[2] === "--write") {
  fs.writeFileSync(path.join(root, "signal-results.json"), json);
  fs.writeFileSync(path.join(root, "signal-results-data.mjs"), module);
} else if (process.argv[2] === "--check") {
  assert.equal(
    normalized("signal-results.json"),
    json,
    "Signal result data differs from current source/plan",
  );
  assert.equal(
    normalized("signal-results-data.mjs"),
    module,
    "Embedded signal results differ",
  );
} else throw Error("Use --write or --check");
console.log(
  "12 signal comparisons and disconnected-channel observation passed; software scope only.",
);
