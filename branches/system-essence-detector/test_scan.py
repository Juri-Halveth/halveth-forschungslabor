# SPDX-License-Identifier: Apache-2.0
"""Focused tests for candidate gates and bounded read-only coverage."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scan import scan, is_path_link_or_reparse


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
        external = tempfile.TemporaryDirectory(prefix="halveth-scan-outside-")
        self.addCleanup(external.cleanup)
        outside = Path(external.name) / "outside-essence-test.bin"
        outside.write_bytes(b"external")
        link = self.root / "outside-link"
        try:
            link.symlink_to(outside)
        except OSError:
            self.skipTest("Symlinks unavailable in this environment")
        report = scan(self.root)
        self.assertEqual(report["coverage"]["skippedLinksOrReparse"], 1)
        self.assertEqual(report["logicalBytes"], 0)

    def test_selected_root_link_is_rejected_before_resolution(self) -> None:
        linked = self.root.parent / f"{self.root.name}-link"
        try:
            linked.symlink_to(self.root, target_is_directory=True)
        except OSError:
            self.skipTest("Directory symlinks unavailable in this environment")
        self.addCleanup(linked.unlink, missing_ok=True)
        with self.assertRaisesRegex(ValueError, "selected root is a link"):
            scan(linked)

    def test_reparse_marker_on_selected_root_is_rejected(self) -> None:
        original_lstat = Path.lstat

        def marked_lstat(path: Path):
            result = original_lstat(path)
            if path == self.root:
                return type("MarkedStat", (), {"st_mode": result.st_mode, "st_file_attributes": 0x400})()
            return result

        with patch.object(Path, "lstat", marked_lstat):
            self.assertTrue(is_path_link_or_reparse(self.root))
            with self.assertRaisesRegex(ValueError, "selected root is a link"):
                scan(self.root)

    def test_cli_refuses_output_inside_selected_tree(self) -> None:
        output = self.root / "report.json"
        process = subprocess.run(
            [sys.executable, str(Path(__file__).with_name("scan.py")), str(self.root), "--output", str(output)],
            capture_output=True, text=True, timeout=10,
        )
        self.assertNotEqual(process.returncode, 0)
        self.assertFalse(output.exists())
        self.assertIn("outside the selected source tree", process.stderr)

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

    @unittest.skipUnless(shutil.which("git"), "Git is required for this source-state gate")
    def test_linked_site_receipt_is_held(self) -> None:
        repo = self.root / "site"
        (repo / "tools").mkdir(parents=True)
        (repo / "tools" / "build_site.mjs").write_text("// build\n", encoding="utf-8")
        (repo / ".gitignore").write_text(".site-build/\n", encoding="utf-8")
        subprocess.run(["git", "init", "-q", str(repo)], check=True)
        subprocess.run(["git", "-C", str(repo), "add", "."], check=True)
        subprocess.run(
            ["git", "-C", str(repo), "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "seed"],
            check=True,
        )
        outside = self.root / "outside-receipt.json"
        outside.write_text('{"sourceTreeState":"GIT_STATUS_CLEAN"}', encoding="utf-8")
        build = repo / ".site-build"
        build.mkdir()
        try:
            (build / "build-info.json").symlink_to(outside)
        except OSError:
            self.skipTest("File symlinks unavailable in this environment")
        report = scan(repo)
        site = self.candidate(report, "SITE_BUILD")
        self.assertEqual(site["decision"], "HOLD_SOURCE_STATE")
        self.assertIn("link or reparse", " ".join(site["notes"]))

    def test_site_receipt_reparse_marker_prevents_parsing(self) -> None:
        repo = self.root / "site"
        build = repo / ".site-build"
        build.mkdir(parents=True)
        receipt = build / "build-info.json"
        receipt.write_text("malformed", encoding="utf-8")
        from scan import git_site_probe
        with patch("scan.is_path_link_or_reparse", return_value=True):
            decision, notes = git_site_probe(build)
        self.assertEqual(decision, "HOLD_SOURCE_STATE")
        self.assertIn("link or reparse", " ".join(notes))


if __name__ == "__main__":
    unittest.main()
