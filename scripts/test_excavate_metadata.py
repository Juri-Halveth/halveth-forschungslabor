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


class InventoryTests(unittest.TestCase):
    def check_streaming_budget(self, *, nested, slow_metadata=False, file_limit=100):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            source = base / "source"
            directory = source / "old" if nested else source
            directory.mkdir(parents=True)
            for index in range(30):
                (directory / f"file-{index}.txt").write_text("private", encoding="utf-8")
            clock = [0.0]
            consumed = [0]
            checked = [0]
            iterators = []
            original_scandir = MODULE.os.scandir
            original_reparse = MODULE.is_reparse

            class ObservedIterator:
                def __init__(self, path):
                    self.inner = original_scandir(path)
                    self.closed = False
                    iterators.append(self)

                def __iter__(self):
                    return self

                def __next__(self):
                    entry = next(self.inner)
                    consumed[0] += 1
                    if not slow_metadata:
                        clock[0] += 0.01
                    return entry

                def __enter__(self):
                    return self

                def __exit__(self, *args):
                    self.closed = True
                    self.inner.close()

            def slow_reparse(entry):
                checked[0] += 1
                clock[0] += 0.01
                return original_reparse(entry)

            with patch.object(MODULE.os, "scandir", ObservedIterator), \
                    patch.object(MODULE.time, "monotonic", side_effect=lambda: clock[0]), \
                    patch.object(MODULE, "is_reparse", side_effect=slow_reparse if slow_metadata else original_reparse):
                summary = MODULE.inventory(source, base / "output", file_limit,
                                           30 if file_limit == 1 else 0.025)
            self.assertTrue(iterators)
            self.assertTrue(all(iterator.closed for iterator in iterators))
            self.assertLessEqual(consumed[0], 2 if file_limit == 1 else 3)
            if slow_metadata:
                self.assertLessEqual(checked[0], 3)
            if file_limit == 1:
                self.assertEqual(summary["files"], 1)
                self.assertEqual(summary["roots"][0]["state"], "BUDGET_LIMIT")
            else:
                self.assertLessEqual(summary["elapsedSeconds"], 0.03)
                self.assertTrue(summary["excluded"].get("budget_remaining_roots") or
                                any(root["state"] == "BUDGET_LIMIT" for root in summary["roots"]))

    def test_time_budget_during_top_level_enumeration(self):
        self.check_streaming_budget(nested=False)

    def test_time_budget_during_nested_enumeration(self):
        self.check_streaming_budget(nested=True)

    def test_time_budget_during_entry_metadata(self):
        self.check_streaming_budget(nested=True, slow_metadata=True)

    def test_file_budget_does_not_buffer_a_wide_directory(self):
        self.check_streaming_budget(nested=True, file_limit=1)

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
