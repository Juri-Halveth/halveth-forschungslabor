"""The public scanner keeps private file content out of its index."""

import importlib.util
import json
from pathlib import Path
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("excavate-metadata.py")
SPEC = importlib.util.spec_from_file_location("excavate_metadata", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class InventoryTests(unittest.TestCase):
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
