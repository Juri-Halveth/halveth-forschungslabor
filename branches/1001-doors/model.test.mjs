// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { HTTP_SOURCE } from "./http-status-data.mjs";
import {
  door,
  doorId,
  httpReference,
  interpretation033,
  timer,
  timerSample,
  ballot,
  evaluateBallot,
  transition,
  sha256,
} from "./model.mjs";
import { buildRegistry, buildRelations, generate } from "./generate.mjs";
const unanimous = { kind: "UNANIMOUS", requiredYes: 999 },
  quorum = { kind: "QUORUM_WITH_VETO", requiredYes: 667 };
const closed = { nowMs: 1000, deadlineMs: 1000 },
  open = { nowMs: 999, deadlineMs: 1000 };

test("all 1001 numbers agree with independent divisor, power, triangle and representation oracles", () => {
  const triangles = new Set(
      Array.from({ length: 46 }, (_, i) => (i * (i + 1)) / 2),
    ),
    powers = new Set(Array.from({ length: 10 }, (_, i) => 2 ** i));
  const seen = new Set();
  for (let n = 0; n <= 1000; n++) {
    const d = door(n),
      divisors = Array.from({ length: n }, (_, i) => i + 1).filter(
        (v) => n % v === 0,
      );
    assert(!seen.has(d.id));
    seen.add(d.id);
    assert.equal(d.math.isPrime, divisors.length === 2);
    assert.equal(d.math.isComposite, n > 1 && divisors.length > 2);
    assert.equal(d.math.isPowerOfTwo, powers.has(n));
    assert.equal(d.math.isTriangular, triangles.has(n));
    assert.equal(
      d.math.isSquare,
      Array.from({ length: 32 }, (_, i) => i * i).includes(n),
    );
    for (const [key, base] of [
      ["binary", 2],
      ["octal", 8],
      ["hexadecimal", 16],
    ])
      assert.equal(parseInt(d.math[key], base), n);
    if (n === 0) assert.equal(d.math.primeFactors, null);
    else {
      assert.equal(
        d.math.primeFactors.reduce((a, b) => a * b, 1),
        n,
      );
      for (const f of d.math.primeFactors)
        assert.equal(
          Array.from({ length: f }, (_, i) => i + 1).filter((v) => f % v === 0)
            .length,
          2,
        );
    }
    assert.equal(
      d.math.properDivisorSum,
      n === 0 ? null : divisors.filter((v) => v < n).reduce((a, b) => a + b, 0),
    );
  }
  assert.equal(seen.size, 1001);
});
test("zero, one and two keep their distinct facts; invalid numbers are rejected", () => {
  assert.equal(door(0).math.bitLength, 0);
  assert.equal(door(0).math.binaryDisplayDigits, 1);
  assert.deepEqual(door(1).math.primeFactors, []);
  assert.equal(door(1).math.isPrime, false);
  assert.equal(door(2).math.isPrime, true);
  assert.equal(door(2).math.isPowerOfTwo, true);
  for (const n of [-1, -0, 1001, 0.1, "033", null, NaN, Infinity])
    assert.throws(() => door(n));
});
test("033 numeric ID, octal escape and hexadecimal input remain different objects", () => {
  assert.deepEqual(
    interpretation033().map((v) => v.value),
    [33, 27, 51, 33],
  );
  assert.equal(door(27).ascii.notation, "ESC");
  assert.equal(door(33).ascii.notation, "!");
  assert.equal(door(51).ascii.notation, "3");
  assert.equal(door(128).ascii, null);
  assert.equal(doorId(33), "HALVETH:DOOR:0033");
});
test("HTTP namespace covers all 100..599 and preserves unassigned, unused and temporary snapshot states", async () => {
  for (let n = 100; n <= 599; n++) assert.equal(httpReference(n).value, n);
  for (const n of [0, 99, 600, 999, 1000]) assert.equal(httpReference(n), null);
  assert.equal(httpReference(400).description, "Bad Request");
  assert.equal(httpReference(401).description, "Unauthorized");
  assert.equal(httpReference(555).state, "UNASSIGNED_IN_SNAPSHOT");
  assert.equal(httpReference(418).state, "UNUSED_IN_SNAPSHOT");
  assert.equal(httpReference(104).state, "TEMPORARY_IN_SNAPSHOT");
  assert.equal(
    createHash("sha256")
      .update(
        await readFile(
          new URL("http-status-codes-source.csv", import.meta.url),
        ),
      )
      .digest("hex"),
    HTTP_SOURCE.sha256,
  );
});
test("ideal 555 timing and capacitor state satisfy threshold and RC invariants", () => {
  const p = { ra: 10000, rb: 68000, c: 0.00001, vcc: 5 },
    a = timer(p);
  assert(Math.abs(a.frequency - 0.988147) < 0.00001);
  assert(Math.abs(a.dutyHigh - 78 / 146) < 1e-12);
  assert(Math.abs(timerSample(0, p).capacitor - 5 / 3) < 1e-10);
  assert(Math.abs(timerSample(a.high, p).capacitor - 10 / 3) < 1e-10);
  for (let i = 0; i < 500; i++) {
    const s = timerSample(i / 100, p);
    assert(s.capacitor >= 5 / 3 - 1e-10 && s.capacitor <= 10 / 3 + 1e-10);
  }
  for (const bad of [0, -1, NaN, Infinity])
    assert.throws(() => timer({ ...p, c: bad }));
  assert.throws(() => timer({ ra: 1, rb: 1, c: 1e-309, vcc: 5 }));
  assert.throws(() => timerSample(-1, p));
});
test("all yes opens only at closed window; missing is preserved and dissent is explicit", () => {
  assert.equal(evaluateBallot(ballot(), unanimous, open).state, "COLLECTING");
  assert.equal(evaluateBallot(ballot(), unanimous, closed).state, "ELIGIBLE");
  assert.equal(
    evaluateBallot(ballot({ missing: 1 }), unanimous, closed).state,
    "INCOMPLETE_AT_DEADLINE",
  );
  assert.equal(
    evaluateBallot(ballot({ no: 1 }), unanimous, closed).state,
    "DISSENT",
  );
  assert.equal(
    evaluateBallot(ballot({ veto: 1 }), quorum, closed).state,
    "BLOCKED_BY_VETO",
  );
});
test("alternative quorum uses all 999 members as denominator and never rewrites unanimous rule", () => {
  const p = ballot({ missing: 332 });
  assert.equal(evaluateBallot(p, quorum, closed).state, "ELIGIBLE");
  assert.equal(
    evaluateBallot(p, unanimous, closed).state,
    "INCOMPLETE_AT_DEADLINE",
  );
  assert.equal(
    evaluateBallot(ballot({ missing: 333 }), quorum, closed).state,
    "INCOMPLETE_AT_DEADLINE",
  );
  assert.throws(() =>
    evaluateBallot(p, { kind: "UNANIMOUS", requiredYes: 667 }, closed),
  );
  assert.throws(() => ballot({ missing: 500, no: 500 }));
});
test("identity, proposal, scope, membership coverage and undeclared fields cannot be swapped", () => {
  const duplicate = ballot();
  duplicate.votes[998].memberId = duplicate.votes[0].memberId;
  assert.throws(() => evaluateBallot(duplicate, unanimous, closed));
  for (const key of ["proposalId", "scope"]) {
    const p = ballot();
    p.votes[0][key] = "OTHER";
    assert.throws(() => evaluateBallot(p, unanimous, closed));
  }
  const p = ballot();
  p.proposal.text = "Pay funds";
  assert.throws(() => evaluateBallot(p, unanimous, closed));
  assert.throws(() =>
    evaluateBallot({ ...ballot(), authorized: true }, unanimous, closed),
  );
});
test("transition cannot sanitize hidden state or execute a getter while taking its snapshot", async () => {
  const hidden = ballot();
  Object.defineProperty(hidden, "hidden", { value: true, enumerable: false });
  await assert.rejects(() => transition(hidden, unanimous, closed));
  const arrayState = ballot();
  Object.defineProperty(arrayState.votes, "hidden", {
    value: true,
    enumerable: false,
  });
  await assert.rejects(() => transition(arrayState, unanimous, closed));
  const getter = ballot();
  let reads = 0;
  Object.defineProperty(getter.votes[0], "answer", {
    enumerable: true,
    get() {
      reads++;
      return "YES";
    },
  });
  await assert.rejects(() => transition(getter, unanimous, closed));
  assert.equal(reads, 0);
});
test("kernel retains every vote, stable event identity and zero external authority", async () => {
  const p = ballot(),
    event = await transition(p, unanimous, closed);
  assert.equal(event.kernel.votes.length, 999);
  assert.equal(event.realWorldAuthority, "NONE");
  assert.equal(event.kernelDigest, await sha256(event.kernel));
  const second = await transition(p, unanimous, closed);
  assert.equal(event.eventId, second.eventId);
  const inFlight = transition(p, unanimous, closed);
  p.votes[0].answer = "NO";
  assert.equal((await inFlight).eventId, event.eventId);
  await assert.rejects(() => transition(ballot({ no: 1 }), unanimous, closed));
});
test("deterministic register and 1000 typed successor edges bind both endpoint digests", async () => {
  const registry = await buildRegistry(),
    relations = buildRelations(registry);
  assert.equal(registry.doors.length, 1001);
  assert.equal(relations.relations.length, 1000);
  const domains = new Set();
  for (const r of relations.relations) {
    const a = registry.doors.find((d) => d.id === r.from.id),
      b = registry.doors.find((d) => d.id === r.to.id);
    assert.equal(a.number + 1, b.number);
    assert.equal(r.from.digest, a.recordDigest);
    assert.equal(r.to.digest, b.recordDigest);
    assert(!domains.has(r.writeDomain));
    domains.add(r.writeDomain);
  }
  assert.deepEqual(
    JSON.parse(await readFile(new URL("registry.json", import.meta.url))),
    registry,
  );
  await generate({ check: true });
});
