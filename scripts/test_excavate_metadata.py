"""The public scanner keeps private file content out of its index."""

import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("excavate-metadata.py")
SPEC = importlib.util.spec_from_file_location("excavate_metadata", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class Clock:
    def __init__(self):
        self.now = 0.0

    def advance(self, seconds):
        self.now += seconds


class DelayedEntry:
    def __init__(self, entry, delay, advance, counts):
        self.entry, self.delay, self.advance, self.counts = entry, delay, advance, counts

    def __getattr__(self, name):
        return getattr(self.entry, name)

    def stat(self, **kwargs):
        if self.delay:
            self.counts["entry_stat"] += 1
            self.advance(self.delay)
        return self.entry.stat(**kwargs)


class DelayedScandir:
    def __init__(self, iterator, enumeration_delay, metadata_delay, advance, counts):
        self.iterator = iterator
        self.enumeration_delay, self.metadata_delay = enumeration_delay, metadata_delay
        self.advance, self.counts = advance, counts

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.iterator.close()
        self.counts["closed"] += 1

    def __iter__(self):
        return self

    def __next__(self):
        entry = next(self.iterator)
        if self.enumeration_delay:
            self.counts["next"] += 1
            self.advance(self.enumeration_delay)
        return DelayedEntry(entry, self.metadata_delay, self.advance, self.counts)


class InventoryTests(unittest.TestCase):
    def delayed_inventory(self, phase, advance=None):
        """Only twenty freshly created synthetic files; no user-file discovery."""
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            source, output = base / "source", base / "output"
            target = source if phase == "top_enumeration" else source / "old"
            target.mkdir(parents=True)
            for i in range(20):
                (target / f"{i:02}.bin").write_bytes(b"synthetic")
            clock = Clock()
            counts = {"next": 0, "entry_stat": 0, "path_stat": 0, "closed": 0}
            real_scandir, real_stat = MODULE.os.scandir, Path.stat
            advance = advance or clock.advance

            def scandir(path):
                selected = Path(path) == target
                return DelayedScandir(real_scandir(path),
                    .01 if selected and phase.endswith("enumeration") else 0,
                    .01 if selected and phase == "entry_metadata" else 0,
                    advance, counts)

            def stat(path, *args, **kwargs):
                if phase == "path_metadata" and path.parent == target and path.suffix == ".bin":
                    counts["path_stat"] += 1
                    advance(.01)
                return real_stat(path, *args, **kwargs)

            with patch.object(MODULE.os, "scandir", side_effect=scandir), patch.object(Path, "stat", stat):
                if advance == clock.advance:
                    with patch.object(MODULE.time, "monotonic", side_effect=lambda: clock.now):
                        summary = MODULE.inventory(source, output, 100, .02)
                else:
                    summary = MODULE.inventory(source, output, 100, .02)
            summary["syntheticRows"] = (output / "inventory_local.jsonl").read_text(encoding="utf-8").splitlines()
            return summary, counts

    def check_time_limit(self, phase, counter):
        summary, counts = self.delayed_inventory(phase)
        self.assertLessEqual(counts[counter], 2, "stop before starting more slow operations")
        self.assertGreater(counts[counter], 0)
        self.assertEqual(summary["state"], "BUDGET_LIMIT")
        self.assertEqual(summary["budgetLimit"], "TIME")
        self.assertTrue(summary["truncated"])
        self.assertEqual(summary["readErrors"], 0, "budget expiration is not a read error")
        # A 10 ms file stat may complete a row before the 20 ms deadline.
        # The second stat reaches the deadline and must not publish a late row.
        self.assertEqual(len(summary["syntheticRows"]), 1 if phase == "path_metadata" else 0)
        self.assertGreater(counts["closed"], 0)
        if phase != "top_enumeration":
            self.assertEqual(summary["roots"][0]["state"], "BUDGET_LIMIT")

    def test_top_enumeration_checks_deadline_between_entries(self):
        self.check_time_limit("top_enumeration", "next")

    def test_nested_enumeration_checks_deadline_between_entries(self):
        self.check_time_limit("nested_enumeration", "next")

    def test_entry_metadata_checks_deadline(self):
        self.check_time_limit("entry_metadata", "entry_stat")

    def test_path_metadata_checks_deadline_before_writing_a_row(self):
        self.check_time_limit("path_metadata", "path_stat")

    def test_healthy_inventory_keeps_deterministic_depth_first_order(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            source = base / "source"
            for folder in ["Zeta", "alpha", "alpha/nested"]:
                (source / folder).mkdir(parents=True, exist_ok=True)
            for name in ["Zeta/z.py", "alpha/b.txt", "alpha/A.txt", "alpha/nested/c.md", "Beta.txt"]:
                (source / name).write_text("synthetic", encoding="utf-8")
            orders = []
            for i in range(2):
                output = base / f"output-{i}"
                summary = MODULE.inventory(source, output, 100, 30)
                rows = [json.loads(line) for line in (output / "inventory_local.jsonl").read_text(encoding="utf-8").splitlines()]
                orders.append([row["relativePath"] for row in rows])
                self.assertEqual(summary["state"], "COMPLETE_WITH_EXCLUSIONS")
                self.assertFalse(summary["truncated"])
                self.assertIsNone(summary["budgetLimit"])
            self.assertEqual(orders[0], ["alpha/A.txt", "alpha/b.txt", "alpha/nested/c.md", "Beta.txt", "Zeta/z.py"])
            self.assertEqual(orders[0], orders[1])

    def test_bounded_metadata_excludes_generated_and_reparse(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            source = base / "source"
            output = base / "output"
            (source / "old").mkdir(parents=True)
            (source / "node_modules").mkdir()
            (source / ".codex-build").mkdir()
            (source / "old" / "idea.py").write_text("VERY_PRIVATE_CONTENT", encoding="utf-8")
            (source / "node_modules" / "package.js").write_text("generated", encoding="utf-8")
            (source / ".codex-build" / "copy.py").write_text("copy", encoding="utf-8")
            try:
                (source / "linked").symlink_to(source / "old", target_is_directory=True)
            except (OSError, NotImplementedError):
                pass
            summary = MODULE.inventory(source, output, 100, 30)
            rows = [json.loads(line) for line in (output / "inventory_local.jsonl").read_text(encoding="utf-8").splitlines()]
            self.assertEqual(summary["files"], 1)
            self.assertEqual([row["relativePath"] for row in rows], ["old/idea.py"])
            self.assertNotIn("VERY_PRIVATE_CONTENT", json.dumps(rows))
            self.assertEqual(summary["readMode"], "METADATA_ONLY_NO_REPARSE_NO_CONTENT")

    def test_budget_retains_incomplete_state(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            source = base / "source"
            source.mkdir()
            (source / "old").mkdir()
            for name in ("a", "b", "c"):
                (source / "old" / name).write_text(name, encoding="utf-8")
            summary = MODULE.inventory(source, base / "output", 1, 30)
            self.assertEqual(summary["files"], 1)
            self.assertEqual(summary["roots"][0]["state"], "BUDGET_LIMIT")
            self.assertEqual(summary["state"], "BUDGET_LIMIT")
            self.assertEqual(summary["budgetLimit"], "FILES")
            self.assertTrue(summary["truncated"])

    def test_nonfinite_time_budgets_are_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            for seconds in [float("nan"), float("inf"), -1, 0]:
                with self.subTest(seconds=seconds), self.assertRaisesRegex(ValueError, "positive and finite"):
                    MODULE.inventory(base, base / "output", 100, seconds)

    def test_private_output_cannot_be_placed_inside_public_repo(self):
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary)
            with self.assertRaisesRegex(ValueError, "outside this repository"):
                MODULE.inventory(source, SCRIPT.parents[1] / "private-index", 1, 1)
            (source / "other-checkout" / ".git").mkdir(parents=True)
            with self.assertRaisesRegex(ValueError, "outside any Git checkout"):
                MODULE.inventory(source, source / "other-checkout" / "private-index", 1, 1)


if __name__ == "__main__":
    unittest.main()
