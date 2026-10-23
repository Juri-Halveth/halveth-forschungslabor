// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import { World, outputBytes, canonical, equal } from "./model.mjs";
import { referenceImage, deliveryAllowed } from "./reference.mjs";

for (const task of ["fractal", "wave"])
  test(
    task + ": scalar oracle, own work and partner work agree byte for byte",
    () => {
      const alone = new World({ task });
      alone.advanceTo(80);
      const together = new World({ task });
      together.command("partner");
      together.advanceTo(80);
      assert.equal(alone.done, 48);
      assert.equal(together.done, 48);
      assert.deepEqual(outputBytes(alone), referenceImage(task));
      assert.deepEqual(outputBytes(together), referenceImage(task));
      assert.ok(together.time < alone.time);
      assert.equal(
        together.host.contributed + together.partner.contributed,
        48,
      );
    },
  );
test("withdraw then re-grant does not revive an in-flight copy", () => {
  const w = new World();
  w.advanceTo(3);
  w.command("visit");
  w.advanceTo(4);
  assert.equal(w.flights[0].kind, "copy");
  const oldEpoch = w.flights[0].epoch;
  w.setConsent(false);
  w.setConsent(true);
  w.advanceTo(6);
  assert.equal(w.visitor.copies.length, 0);
  assert.notEqual(w.epoch, oldEpoch);
  assert.equal(
    deliveryAllowed({
      issuedEpoch: oldEpoch,
      currentEpoch: w.epoch,
      consent: true,
      operation: "COPY",
      ids: [0, 1, 2],
    }),
    false,
  );
});
test("received copies persist; incomplete partner jobs return to the queue", () => {
  const w = new World();
  w.advanceTo(3);
  w.command("visit");
  w.advanceTo(6);
  assert.equal(w.visitor.copies.length, 3);
  for (const copy of w.visitor.copies)
    assert.ok(equal(copy.bytes, w.tiles[copy.id].bytes));
  w.command("partner");
  w.advanceTo(7);
  w.setConsent(false);
  w.advanceTo(80);
  assert.equal(w.done, 48);
  assert.equal(w.visitor.copies.length, 3);
  assert.deepEqual(outputBytes(w), referenceImage("fractal"));
});
test("protection, actual overwrite and exact repair", () => {
  const w = new World();
  w.advanceTo(3);
  const original = w.tiles[0].bytes.slice();
  w.command("write");
  w.advanceTo(4);
  assert.deepEqual(w.tiles[0].bytes, original);
  w.setGuard(false);
  w.command("write");
  w.advanceTo(5);
  assert.notDeepEqual(w.tiles[0].bytes, original);
  w.repair();
  assert.deepEqual(w.tiles[0].bytes, canonical(0));
});
test("invalid options and unknown commands fail explicitly", () => {
  for (const bad of [
    { task: "unknown" },
    { rate: NaN },
    { rate: 0 },
    { copyDelay: -1 },
    { extra: true },
    null,
  ])
    assert.throws(() => new World(bad));
  const w = new World();
  const before = w.snapshot();
  assert.throws(() => w.command("unknown"));
  assert.deepEqual(w.snapshot(), before);
  assert.deepEqual(outputBytes(w), outputBytes(before));
  assert.equal(w.time, before.time);
  assert.throws(() => w.step(-1));
});
test("a corrupted partner delivery is rejected and recomputed", () => {
  const w = new World();
  w.command("partner");
  w.advanceTo(0.8);
  const f = w.flights.find((f) => f.kind === "build");
  assert.ok(f);
  f.bytes[0] ^= 255;
  w.advanceTo(80);
  assert.equal(w.done, 48);
  assert.ok(w.events.some((e) => e.kind === "DENY"));
  assert.deepEqual(outputBytes(w), referenceImage("fractal"));
});
test("snapshot is a detached display state", () => {
  const w = new World();
  w.advanceTo(4);
  const snapshot = w.snapshot();
  const before = outputBytes(w);
  snapshot.tiles[0].bytes[0] ^= 255;
  snapshot.events.push({ kind: "DISPLAY_ONLY" });
  assert.deepEqual(outputBytes(w), before);
  assert.ok(!w.events.some((e) => e.kind === "DISPLAY_ONLY"));
});
test("negative challenges detect epoch, write-guard and repair defects", () => {
  const a = new World();
  a.advanceTo(3);
  a.command("visit");
  a.advanceTo(4);
  a.setConsent(false);
  a.setConsent(true);
  a.canDeliver = (f) => a.authorize("visitor", "COPY", f.ids);
  a.advanceTo(6);
  assert.equal(a.visitor.copies.length, 3);
  const b = new World();
  b.advanceTo(3);
  const previous = b.authorize.bind(b);
  b.authorize = (actor, effect, ids) =>
    effect === "WRITE" || previous(actor, effect, ids);
  b.command("write");
  b.advanceTo(4);
  assert.equal(b.tiles[0].corrupted, true);
  b.repair = () => {};
  b.repair();
  assert.notDeepEqual(b.tiles[0].bytes, canonical(0));
});
