import tempfile
import unittest
from pathlib import Path

from inventory_triage import classify_version, triage


class VersionTriageTests(unittest.TestCase):
    def test_each_upstream_boundary(self):
        for before, fixed in [("8.2.34", "8.2.35"), ("8.3.35", "8.3.36"),
                              ("8.4.26", "8.4.27"), ("8.5.11", "8.5.12")]:
            with self.subTest(before=before):
                self.assertEqual(classify_version(before, "")[0], "BELOW_UPSTREAM_FIX")
                self.assertEqual(classify_version(fixed, "")[0], "UPSTREAM_VERSION_AT_OR_ABOVE_FIX")

    def test_backport_reference_does_not_assert_patch(self):
        self.assertEqual(classify_version("8.2.29-vendor1", "VENDOR-123")[0],
                         "VENDOR_BACKPORT_REVIEW")

    def test_legacy_and_unknown_remain_open(self):
        self.assertEqual(classify_version("8.1.34", "")[0], "LEGACY_UPGRADE_REQUIRED")
        self.assertEqual(classify_version("", "")[0], "UNKNOWN_VERSION")
        self.assertEqual(classify_version("8.6.0-rc4", "")[0], "OTHER_BRANCH_REVIEW")

    def test_duplicate_asset_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "inventory.csv"
            file.write_text("asset_id,php_version,sapi,internet_facing,vendor_backport_ref\n"
                            "same,8.2.35,FPM,yes,\nsame,8.2.34,FPM,no,\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "duplicated"):
                triage(file)


if __name__ == "__main__":
    unittest.main()
