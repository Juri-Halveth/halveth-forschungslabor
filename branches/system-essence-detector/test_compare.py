#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Meaningful local counterexamples for the read-only tree comparator."""

from __future__ import annotations

import importlib.util
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


if __name__ == "__main__":
    unittest.main()
