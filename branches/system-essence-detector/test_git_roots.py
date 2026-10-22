#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Counterexamples for the local, one-level Git root finder."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("git_roots.py")
SPEC = importlib.util.spec_from_file_location("essence_git_roots", MODULE_PATH)
assert SPEC and SPEC.loader
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


def run_git(path: Path, *args: str) -> None:
    subprocess.run(
        ["git", "-C", str(path), *args],
        check=True, capture_output=True, timeout=10,
    )


class GitRootTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory(prefix="halveth-git-roots-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def create_repo(self, path: Path) -> None:
        path.mkdir(parents=True)
        run_git(path, "init", "--quiet")
        (path / "README.md").write_text("synthetic", encoding="utf-8")
        run_git(path, "add", "README.md")
        run_git(path, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
                "commit", "--quiet", "-m", "fixture")

    def test_unicode_child_repo_and_private_remote_url(self) -> None:
        path = self.root / "für-projekt"
        self.create_repo(path)
        (path / "LICENSE").write_text("filename only", encoding="utf-8")
        run_git(path, "remote", "add", "origin", "https://example.invalid/private-token-sentinel")
        report = module.discover(self.root)
        self.assertEqual(len(report["repositories"]), 1)
        found = report["repositories"][0]
        self.assertEqual(found["path"], str(path))
        self.assertEqual(found["remoteNames"], ["origin"])
        self.assertEqual(found["rootLicenseFileNames"], ["LICENSE"])
        self.assertNotIn("private-token-sentinel", json.dumps(report))
        self.assertIsNotNone(found["head"])

    def test_nested_repo_beyond_one_child_is_not_claimed(self) -> None:
        path = self.root / "middle" / "deep"
        self.create_repo(path)
        report = module.discover(self.root)
        self.assertEqual(report["repositories"], [])
        self.assertEqual(report["coverage"]["depth"], 1)

    def test_marker_named_git_without_valid_repo_is_not_claimed(self) -> None:
        fake = self.root / "fake"
        (fake / ".git").mkdir(parents=True)
        report = module.discover(self.root)
        self.assertEqual(report["repositories"], [])

    def test_budget_limit_does_not_claim_complete_scan(self) -> None:
        self.create_repo(self.root / "child")
        report = module.discover(self.root, max_children=0)
        self.assertTrue(report["coverage"]["limitReached"])
        self.assertEqual(report["repositories"], [])

    def test_root_repo_is_found_at_zero_child_budget(self) -> None:
        self.create_repo(self.root / "project")
        report = module.discover(self.root / "project", max_children=0)
        self.assertEqual(len(report["repositories"]), 1)
        self.assertTrue(report["coverage"]["limitReached"])


if __name__ == "__main__":
    unittest.main()
