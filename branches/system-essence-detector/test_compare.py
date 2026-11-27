#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Meaningful local counterexamples for the read-only tree comparator."""

from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

MODULE_PATH = Path(__file__).with_name("compare.py")
SPEC = importlib.util.spec_from_file_location("essence_compare", MODULE_PATH)
assert SPEC and SPEC.loader
compare = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(compare)


class TreeComparisonTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix="halveth-compare-")
        self.addCleanup(self.temporary.cleanup)
        base = Path(self.temporary.name)
        self.left = base / "left"
        self.right = base / "right"
        self.left.mkdir()
        self.right.mkdir()
        for root in (self.left, self.right):
            (root / "source").mkdir()
            (root / "source" / "code.txt").write_bytes(b"same bytes\x00\xff")

    def test_exact_tree_equality_is_bounded_to_bytes(self) -> None:
        report = compare.compare_trees(self.left, self.right)
        self.assertEqual(report["verdict"], "EQUAL_WITHIN_BOUND_COVERAGE")
        self.assertEqual(report["differences"], [])
        self.assertTrue(report["left"]["coverage"]["complete"])
        self.assertEqual(report["left"]["treeSha256"], report["right"]["treeSha256"])

    def test_replica_only_file_is_visible(self) -> None:
        (self.right / "training.bin").write_bytes(b"unique generated state")
        report = compare.compare_trees(self.left, self.right)
        self.assertEqual(report["verdict"], "DIFFERENT")
        self.assertIn({"kind": "RIGHT_ONLY_FILE", "path": "training.bin"}, report["differences"])

    def test_same_length_content_change_is_visible(self) -> None:
        (self.right / "source" / "code.txt").write_bytes(b"new! bytes\x00\xff")
        report = compare.compare_trees(self.left, self.right)
        self.assertEqual(report["verdict"], "DIFFERENT")
        self.assertEqual(report["differences"][0]["kind"], "CONTENT_DIFFERENT")

    def test_entry_budget_does_not_claim_equality(self) -> None:
        report = compare.compare_trees(self.left, self.right, max_entries=1)
        self.assertEqual(report["verdict"], "UNKNOWN_INCOMPLETE")
        self.assertTrue(any(item["kind"] == "ENTRY_LIMIT" for item in report["left"]["coverage"]["gaps"]))

    def test_unstable_file_does_not_claim_equality(self) -> None:
        with patch.object(compare, "stable_hash", return_value=None):
            report = compare.compare_trees(self.left, self.right)
        self.assertEqual(report["verdict"], "UNKNOWN_INCOMPLETE")
        self.assertTrue(any(item["kind"] == "UNSTABLE_FILE" for item in report["left"]["coverage"]["gaps"]))

    def test_link_is_a_coverage_gap_and_not_followed(self) -> None:
        outside = Path(self.temporary.name) / "outside.txt"
        outside.write_bytes(b"private")
        try:
            (self.right / "link.txt").symlink_to(outside)
        except (OSError, NotImplementedError):
            self.skipTest("creating symlinks is unavailable in this environment")
        report = compare.compare_trees(self.left, self.right)
        self.assertEqual(report["verdict"], "UNKNOWN_INCOMPLETE")
        self.assertTrue(any(item["kind"] == "LINK_OR_REPARSE" for item in report["right"]["coverage"]["gaps"]))
        self.assertNotIn("link.txt", {item["path"] for item in report["right"]["manifest"]["files"]})

    def test_growing_file_is_read_only_up_to_its_declared_size(self) -> None:
        folder = Path(self.temporary.name) / "growth"
        folder.mkdir()
        path = folder / "changing.bin"
        path.write_bytes(b"base")
        original = Path.open
        reads = []

        class Growth:
            def __init__(self, stream):
                self.stream = stream

            def __enter__(self):
                return self

            def __exit__(self, *args):
                self.stream.close()

            def fileno(self):
                return self.stream.fileno()

            def read(self, size):
                if not reads:
                    with original(path, "ab") as writer:
                        writer.write(b"next")
                data = self.stream.read(size)
                reads.append(len(data))
                return data

        def open_fixture(selected, *args, **kwargs):
            result = original(selected, *args, **kwargs)
            return Growth(result) if selected == path else result

        with patch.object(Path, "open", open_fixture), patch.object(compare, "READ_CHUNK", 2):
            result = compare.inventory(folder, max_entries=10, max_bytes=4)
        self.assertEqual(sum(reads), 4)
        self.assertEqual(result["coverage"]["bytesRead"], 4)
        self.assertEqual(result["coverage"]["bytesHashed"], 0)
        self.assertFalse(result["coverage"]["complete"])

    def test_unobserved_path_is_not_reported_absent(self) -> None:
        target = self.right / "source" / "code.txt"
        target.write_bytes(b"x" * 200)
        report = compare.compare_trees(self.left, self.right, max_bytes=100)
        self.assertEqual(report["verdict"], "UNKNOWN_INCOMPLETE")
        self.assertEqual(report["differences"], [])
        self.assertIn({"seenOn": "LEFT", "kind": "FILE", "path": "source/code.txt"},
                      report["unpairedWithinIncompleteCoverage"])

    def test_cli_replaces_hard_link_and_rejects_output_in_another_checkout(self) -> None:
        base = Path(self.temporary.name)
        output = base / "result.json"
        source = self.left / "source" / "code.txt"
        original = source.read_bytes()
        try:
            os.link(source, output)
        except OSError:
            self.skipTest("hard links unavailable")
        cmd = [sys.executable, "-B", str(MODULE_PATH), str(self.left), str(self.right), "--output"]
        ok = subprocess.run([*cmd, str(output)], capture_output=True, text=True, timeout=10)
        self.assertEqual(ok.returncode, 0, ok.stderr)
        self.assertEqual(source.read_bytes(), original)
        self.assertEqual(json.loads(output.read_bytes())["verdict"], "EQUAL_WITHIN_BOUND_COVERAGE")
        repo = base / "another"
        (repo / ".git").mkdir(parents=True)
        denied = subprocess.run([*cmd, str(repo / "report.json")], capture_output=True, text=True, timeout=10)
        self.assertNotEqual(denied.returncode, 0)
        self.assertFalse((repo / "report.json").exists())


if __name__ == "__main__":
    unittest.main()
