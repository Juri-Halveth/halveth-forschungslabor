// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import {
  roleProfile,
  routeValues,
  buildJourney,
  validateJourney,
  LocalHive,
  moduloCandidates,
  orderProbe,
  firstOrderDifference,
} from "./role-journey.mjs";
const time = "2026-10-23T16:10:00.000Z";

test("all 1001 values retain place-value sums, all representation roundtrips and complete index counts", () => {
  for (let n = 0; n <= 1000; n++) {
    const p = roleProfile(n);
    assert.equal(
      p.decimalPlaces.reduce((s, d) => s + d.contribution, 0),
      n,
    );
    assert.equal(Number.parseInt(p.representations.binary, 2), n);
    assert.equal(Number.parseInt(p.representations.hexadecimal, 16), n);
    const route = routeValues(n, "REPRESENTATION");
    assert.equal(route.at(-1).value, n);
    if (n)
      assert.equal(
        p.finiteCardinality.indexMaximum - p.finiteCardinality.indexMinimum + 1,
        n,
      );
    else assert.equal(p.finiteCardinality.state, "EMPTY_DOMAIN");
    assert.equal(p.pairCount, n < 2 ? 0 : (n * (n - 1)) / 2);
    assert.equal(Object.is(p.pairCount, -0), false);
  }
  assert.equal(roleProfile(64).finiteCardinality.fixedWidthBits, 6);
  assert.equal(roleProfile(64).representations.binary, "1000000");
  assert.equal(roleProfile(1).finiteCardinality.fixedWidthBits, 0);
  assert.throws(() => roleProfile(1001));
  assert.throws(() => roleProfile(-0));
});

test("operation order changes every result by exactly one within the input range", () => {
  for (let n = 0; n <= 1000; n++) {
    const a = routeValues(n, "PLUS_THEN_DOUBLE").at(-1).value;
    const b = routeValues(n, "DOUBLE_THEN_PLUS").at(-1).value;
    assert.equal(a, 2 * n + 2);
    assert.equal(b, 2 * n + 1);
    assert.equal(a - b, 1);
  }
});

test("the complete finite-order profile distinguishes all 1001 objects, while a partial residue profile collides", () => {
  const profiles = new Set();
  for (let n = 0; n <= 1000; n++) {
    const bits = Array.from({ length: 1001 }, (_, probe) =>
      orderProbe(n, probe),
    );
    assert.equal(bits.filter(Boolean).length, n + 1);
    profiles.add(bits.map(Number).join(""));
    if (n < 1000) {
      const d = firstOrderDifference(n, n + 1);
      assert.equal(d.probe, n + 1);
      assert.equal(d.left, false);
      assert.equal(d.right, true);
    }
  }
  assert.equal(profiles.size, 1001);
  assert.equal(6 % 12, 18 % 12);
  assert.deepEqual(firstOrderDifference(6, 18), {
    probe: 7,
    left: false,
    right: true,
    scope: "DECLARED_FINITE_ORDER_ONLY",
  });
  assert.equal(firstOrderDifference(1000, 1000), null);
});

test("many-to-one projection retains all and only allowed preimages, with a counterexample to unique origin", () => {
  const candidates = moduloCandidates(6);
  assert.ok(candidates.includes(6) && candidates.includes(18));
  for (let r = 0; r < 12; r++) {
    const all = moduloCandidates(r);
    assert.deepEqual(
      all,
      Array.from({ length: 1001 }, (_, i) => i).filter((i) => i % 12 === r),
    );
  }
  assert.equal(
    routeValues(6, "MODULO_12").at(-1).selection,
    "OPEN_ALL_RETAINED",
  );
  assert.throws(() => moduloCandidates(12));
  assert.throws(() => routeValues(1, "toString"));
});

test("a value-preserving return keeps separate state occurrences and a complete typed relation chain", async () => {
  assert.equal(
    (
      await validateJourney(
        await buildJourney(0, "REPRESENTATION", "ZERO", time),
      )
    ).state,
    "VALID_FOR_DECLARED_MODEL",
  );
  const p = await buildJourney(666, "REPRESENTATION", "RUN_A", time);
  assert.equal(p.states[0].digest, p.states.at(-1).digest);
  assert.notEqual(p.states[0].occurrenceId, p.states.at(-1).occurrenceId);
  assert.equal(p.events.length, 3);
  assert.equal(p.relations.length, 3);
  for (let i = 0; i < 3; i++) {
    assert.equal(p.relations[i].leftEndpoint.digest, p.states[i].digest);
    assert.equal(
      p.relations[i].rightEndpoint.occurrenceId,
      p.states[i + 1].occurrenceId,
    );
    assert.equal(p.events[i].eventAt, "UNKNOWN");
  }
  assert.equal((await validateJourney(p)).state, "VALID_FOR_DECLARED_MODEL");
  const other = await buildJourney(666, "REPRESENTATION", "RUN_B", time);
  assert.equal(p.states[0].contentId, other.states[0].contentId);
  assert.notEqual(p.events[0].id, other.events[0].id);
});

test("modified output, endpoint, source, scope and hidden-state records are rejected", async () => {
  const original = await buildJourney(6, "MODULO_12", "RUN_C", time);
  for (const mutate of [
    (p) => (p.states[1].payload.remainder = 7),
    (p) => (p.relations[0].rightEndpoint.digest = "sha256:bad"),
    (p) => (p.relations[0].scope.inputRegistryRange.max = 1001),
    (p) => (p.sources.XSD.url = "https://example.invalid/"),
    (p) => (p.evaluation.uniqueInverseFromFinalOutput = true),
  ]) {
    const p = structuredClone(original);
    mutate(p);
    await assert.rejects(validateJourney(p));
  }
  let reads = 0;
  const p = structuredClone(original);
  Object.defineProperty(p, "hidden", {
    get() {
      reads++;
      return 1;
    },
  });
  await assert.rejects(validateJourney(p));
  assert.equal(reads, 0);
  await assert.rejects(buildJourney(6, "MODULO_12", "BAD ID", time));
  await assert.rejects(
    buildJourney(6, "MODULO_12", "RUN", "2026-02-30T00:00:00.000Z"),
  );
});

test("Hive deduplicates the same run, preserves repeated witnesses and does not count them as independent evidence", async () => {
  const h = new LocalHive(),
    p = await buildJourney(33, "REPRESENTATION", "RUN_1", time);
  assert.equal((await h.collect(p)).runCount, 1);
  assert.equal((await h.collect(p)).state, "ALREADY_COLLECTED");
  const second = await buildJourney(33, "REPRESENTATION", "RUN_2", time);
  await h.collect(second);
  assert.deepEqual(h.summary(), {
    runCount: 2,
    claimCount: 1,
    provenanceClusterCount: 1,
    location: "THIS_BROWSER_SESSION_ONLY",
  });
  p.input = 7;
  assert.equal(h.export().witnesses[0].packet.input, 33);
  const collision = await buildJourney(34, "REPRESENTATION", "RUN_1", time);
  await assert.rejects(h.collect(collision));
  const e = h.export();
  e.witnesses[0].packet.input = 99;
  assert.equal(h.export().witnesses[0].packet.input, 33);
  h.clear();
  assert.equal(h.summary().runCount, 0);
});
