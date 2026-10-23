// SPDX-License-Identifier: MIT
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

export const moduleFiles = Object.freeze([
  "index.html",
  "style.css",
  "view.mjs",
  "dashboard.mjs",
  "model.mjs",
  "geometry.mjs",
  "results-data.mjs",
  "results.json",
  "RESEARCH_PLAN.json",
  "KNOWLEDGE.json",
  "SOURCE.json",
  "SOURCES.md",
  "README.md",
  "preview.png",
]);
export const licenseFiles = Object.freeze([
  "LICENSE",
  "LICENSES.md",
  "LICENSE-DATA.md",
  "LICENSE-CONTENT.md",
  "RIGHTS-RESERVATION.md",
]);

export async function buildSite({ repoRoot, outputRoot, commit }) {
  if (!/^[a-f0-9]{40}$/.test(commit))
    throw Error("A full source commit is required");
  const source = await fs.realpath(repoRoot);
  const destination = path.resolve(outputRoot);
  const files = [];
  for (const [prefix, names] of [
    ["branches/encounter-systems", moduleFiles],
    ["", licenseFiles],
  ]) {
    for (const name of names) {
      const input = path.join(source, prefix, name);
      const stat = await fs.lstat(input);
      if (!stat.isFile() || stat.isSymbolicLink())
        throw Error("Only regular files: " + name);
      const real = await fs.realpath(input);
      if (!real.startsWith(source + path.sep))
        throw Error("Source boundary: " + name);
      const bytes = await fs.readFile(real);
      files.push({
        name,
        bytes,
        sourcePath: [prefix, name].filter(Boolean).join("/"),
      });
    }
  }
  // A fresh output is mandatory: stale files can never enter the published artifact.
  await fs.mkdir(destination);
  for (const file of files)
    await fs.writeFile(path.join(destination, file.name), file.bytes);
  const receipt = {
    schema: "halveth.encounter-publication.v1",
    sourceCommit: commit,
    repository: "Juri-Halveth/halveth-forschungslabor",
    files: files.map(({ name, bytes, sourcePath }) => ({
      path: name,
      sourcePath,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    })),
  };
  await fs.writeFile(
    path.join(destination, "release.json"),
    JSON.stringify(receipt, null, 2) + "\n",
  );
  return receipt;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const repoRoot = path.resolve(import.meta.dirname, "..");
  const head = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
  const dirty = execFileSync("git", ["status", "--porcelain"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
  if (dirty || head !== process.argv[3])
    throw Error(
      "Publication requires a clean checkout at the supplied source commit",
    );
  const receipt = await buildSite({
    repoRoot,
    outputRoot: process.argv[2] || "_encounter-site",
    commit: process.argv[3] || "",
  });
  console.log(
    `Prepared ${receipt.files.length} approved files at source ${receipt.sourceCommit}`,
  );
}
