# SPDX-License-Identifier: Apache-2.0
"""Focused tests for candidate gates and bounded read-only coverage."""

from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from scan import scan


class ScanTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def candidate(self, report: dict, kind: str) -> dict:
        matches = [item for item in report["candidates"] if item["kind"] == kind]
        self.assertEqual(len(matches), 1)
        return matches[0]

    def test_cargo_incremental_requires_manifest_and_cache_marker(self) -> None:
        proper = self.root / "project"
        (proper / "target" / "debug" / "incremental").mkdir(parents=True)
        (proper / "Cargo.toml").write_text("[package]\nname='demo'\nversion='0.1.0'\n", encoding="utf-8")
        (proper / "target" / "CACHEDIR.TAG").write_text("Signature: 8a477f597d28d172789f06886806bc55\n", encoding="utf-8")
        (proper / "target" / "debug" / "incremental" / "cache.bin").write_bytes(b"x" * 17)
        unknown = self.root / "other" / "target" / "debug" / "incremental"
        unknown.mkdir(parents=True)
        (unknown / "cache.bin").write_bytes(b"y")
        report = scan(self.root)
        item = self.candidate(report, "CARGO_INCREMENTAL")
        self.assertEqual(item["decision"], "REBUILDABLE_CANDIDATE")
        self.assertEqual(item["logicalBytes"], 17)
        self.assertEqual(self.candidate(report, "REVIEW_UNKNOWN_INCREMENTAL")["decision"], "REVIEW")
        self.assertEqual(report["logicalBytes"], sum(x["logicalBytes"] for x in report["topLevel"]))

    def test_unreal_source_and_resumable_download_are_distinct(self) -> None:
        project = self.root / "ASHBOUNDUE"
        for part in ("Source", "Content", "Intermediate/Build"):
            (project / part).mkdir(parents=True)
        (project / "ASHBOUNDUE.uproject").write_text("{}", encoding="utf-8")
        (project / "Intermediate" / "Build" / "compiled.pch").write_bytes(b"z" * 9)
        partial = self.root / "model.cache" / "weights.incomplete"
        partial.parent.mkdir()
        partial.write_bytes(b"partial")
        report = scan(self.root)
        self.assertEqual(self.candidate(report, "UNREAL_INTERMEDIATE_BUILD")["logicalBytes"], 9)
        self.assertEqual(self.candidate(report, "RESUMABLE_DOWNLOAD_PART")["decision"], "REVIEW")
        self.assertTrue(partial.exists(), "Scanner must not remove partial downloads")

    def test_entry_limit_does_not_claim_complete_coverage(self) -> None:
        (self.root / "a").write_bytes(b"a")
        (self.root / "b").write_bytes(b"b")
        limited = scan(self.root, max_entries=1)
        self.assertTrue(limited["coverage"]["limitReached"])
        self.assertEqual(limited["coverage"]["entriesSeen"], 1)

    def test_symlink_outside_root_is_not_followed(self) -> None:
        outside = self.root.parent / "outside-essence-test.bin"
        outside.write_bytes(b"external")
        link = self.root / "outside-link"
        try:
            link.symlink_to(outside)
        except OSError:
            self.skipTest("Symlinks unavailable in this environment")
        finally:
            # The target is outside the TemporaryDirectory and must be removed separately.
            outside.unlink(missing_ok=True)
        report = scan(self.root)
        self.assertEqual(report["coverage"]["skippedLinksOrReparse"], 1)
        self.assertEqual(report["logicalBytes"], 0)

    @unittest.skipUnless(shutil.which("git"), "Git is required for this source-state gate")
    def test_site_build_needs_matching_clean_commit(self) -> None:
        repo = self.root / "site"
        (repo / "tools").mkdir(parents=True)
        (repo / "tools" / "build_site.mjs").write_text("// deterministic example\n", encoding="utf-8")
        (repo / ".gitignore").write_text(".site-build/\n", encoding="utf-8")
        subprocess.run(["git", "init", "-q", str(repo)], check=True)
        subprocess.run(["git", "-C", str(repo), "add", "."], check=True)
        subprocess.run(
            ["git", "-C", str(repo), "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "seed"],
            check=True,
        )
        head = subprocess.run(["git", "-C", str(repo), "rev-parse", "HEAD"], check=True, capture_output=True, text=True).stdout.strip()
        build = repo / ".site-build"
        build.mkdir()
        (build / "index.html").write_text("<h1>Local</h1>", encoding="utf-8")
        (build / "build-info.json").write_text(json.dumps({"sourceTreeState": "GIT_STATUS_CLEAN", "sourceCommit": head}), encoding="utf-8")
        good = scan(repo)
        self.assertEqual(self.candidate(good, "SITE_BUILD")["decision"], "REBUILDABLE_CANDIDATE")
        (repo / "untracked.txt").write_text("changed", encoding="utf-8")
        held = scan(repo)
        self.assertEqual(self.candidate(held, "SITE_BUILD")["decision"], "HOLD_SOURCE_STATE")


if __name__ == "__main__":
    unittest.main()
