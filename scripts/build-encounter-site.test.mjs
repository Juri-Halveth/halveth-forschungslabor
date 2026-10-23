// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  buildSite,
  moduleFiles,
  licenseFiles,
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
  for (const name of moduleFiles)
    await fs.writeFile(path.join(module, name), "approved " + name);
  for (const name of licenseFiles)
    await fs.writeFile(path.join(source, name), "license " + name);
  await fs.writeFile(
    path.join(module, "private-unlisted.txt"),
    "synthetic exclusion challenge",
  );
  const output = path.join(temporary, "site");
  const args = { repoRoot: source, outputRoot: output, commit: "a".repeat(40) };
  const receipt = await buildSite(args);
  assert.equal(receipt.sourceCommit, args.commit);
  assert.deepEqual(
    (await fs.readdir(output)).sort(),
    [...moduleFiles, ...licenseFiles, "release.json"].sort(),
  );
  assert.equal(
    await fs.readFile(path.join(output, "model.mjs"), "utf8"),
    "approved model.mjs",
  );
  assert.equal(receipt.files.find((x) => x.path === "model.mjs").bytes, 18);
  assert.match(receipt.files[0].sha256, /^[a-f0-9]{64}$/);
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
