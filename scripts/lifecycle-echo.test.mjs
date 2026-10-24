// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

test("four fresh own Python runs reproduce the eight published lifecycle observations", async (t) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "halveth-lifecycle-"));
  t.after(async () => {
    const real = await fs.realpath(temporary);
    const parent = await fs.realpath(os.tmpdir());
    if (path.dirname(real) !== parent || !path.basename(real).startsWith("halveth-lifecycle-")) throw Error("Cleanup boundary");
    await fs.rm(real, { recursive: true, force: true });
  });
  const module = new URL("../research/lifecycle-echo/", import.meta.url);
  const source = await fs.readFile(new URL("lifecycle_probe.py", module));
  const fixture = path.join(temporary, "lifecycle_probe.py");
  await fs.writeFile(fixture, source, { flag: "wx" });
  const python = process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");
  const run = JSON.parse(execFileSync(python, ["-I", "-S", fixture], { cwd: temporary, encoding: "utf8", timeout: 30000 }));
  const resultPath = await fs.realpath(run.result);
  assert.equal(path.dirname(path.dirname(resultPath)), await fs.realpath(temporary));
  const result = JSON.parse(await fs.readFile(resultPath, "utf8"));
  const published = JSON.parse(await fs.readFile(new URL("results.json", module), "utf8"));
  assert.equal(published.sourceSha256, createHash("sha256").update(source).digest("hex"));
  assert.equal(Object.keys(result.checks).length, 8);
  assert.deepEqual(result.checks, published.checks);
  assert.ok(Object.values(result.checks).every((value) => value === true));
  assert.equal(result.observations.length, 4);
  for (let i = 0; i < 4; i++) {
    const actual = result.observations[i], expected = published.observations[i];
    for (const key of ["id", "source_sha256", "exit_code", "stdout", "file_exists_after_exit", "file_sha256"])
      assert.deepEqual(actual[key], expected[key], `${actual.id}: ${key}`);
  }
});
