// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  buildSite,
  publicFiles,
} from "./build-encounter-site.mjs";

test("publication copies only approved files, binds bytes and rejects reused output", async (t) => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "halveth-site-test-"),
  );
  t.after(async () => {
    if (
      !path
        .resolve(temporary)
        .startsWith(path.resolve(os.tmpdir()) + path.sep + "halveth-site-test-")
    )
      throw Error("Cleanup boundary");
    await fs.rm(temporary, { recursive: true, force: true });
  });
  const source = path.join(temporary, "source");
  const module = path.join(source, "branches", "encounter-systems");
  await fs.mkdir(module, { recursive: true });
  for (const entry of publicFiles) {
    const target = path.join(source, entry.sourcePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, "approved " + entry.path);
  }
  await fs.writeFile(
    path.join(module, "private-unlisted.txt"),
    "synthetic exclusion challenge",
  );
  await fs.writeFile(path.join(source, "research/lifecycle-echo/private-receipt.json"), "synthetic private receipt");
  const output = path.join(temporary, "site");
  const args = { repoRoot: source, outputRoot: output, commit: "a".repeat(40) };
  const receipt = await buildSite(args);
  assert.equal(receipt.sourceCommit, args.commit);
  assert.deepEqual(
    (await fs.readdir(output, { recursive: true, withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => path.relative(output, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"))
      .sort(),
    [...publicFiles.map((entry) => entry.path), "release.json"].sort(),
  );
  assert.equal(
    await fs.readFile(path.join(output, "model.mjs"), "utf8"),
    "approved model.mjs",
  );
  assert.equal(receipt.files.find((x) => x.path === "model.mjs").bytes, 18);
  assert.match(receipt.files[0].sha256, /^[a-f0-9]{64}$/);
  assert.equal(receipt.files.find((entry) => entry.path === "endeck/index.html").sourcePath, "branches/endeck-observer/index.html");
  assert.equal(await fs.readFile(path.join(output, "lifecycle/lifecycle_probe.py"), "utf8"), "approved lifecycle/lifecycle_probe.py");
  await assert.rejects(buildSite(args), { code: "EEXIST" });
  await assert.rejects(
    buildSite({ ...args, commit: "main" }),
    /full source commit/,
  );
  await fs.mkdir(path.join(module, "unexpected-directory"));
  await fs.rename(
    path.join(module, "model.mjs"),
    path.join(module, "old-model"),
  );
  await fs.rename(
    path.join(module, "unexpected-directory"),
    path.join(module, "model.mjs"),
  );
  await assert.rejects(
    buildSite({ ...args, outputRoot: path.join(temporary, "second") }),
    /regular files/,
  );
});
