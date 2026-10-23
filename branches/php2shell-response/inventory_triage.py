#!/usr/bin/env python3
"""Classify operator-supplied PHP runtime inventory without probing any host.

This is a decision aid for CVE-2026-109618 / CVE-2026-109619, not a
vulnerability scanner or proof that a running web service has been patched.
"""

import csv
import json
import re
import sys
from pathlib import Path

FIXED = {(8, 2): 35, (8, 3): 36, (8, 4): 27, (8, 5): 12}
REQUIRED = {"asset_id", "php_version", "sapi", "internet_facing", "vendor_backport_ref"}
VERSION = re.compile(r"^(\d+)\.(\d+)\.(\d+)(?:$|[-+~].*)")


def classify_version(raw: str, vendor_ref: str) -> tuple[str, str]:
    version = raw.strip()
    ref = vendor_ref.strip()
    if not version:
        return "UNKNOWN_VERSION", "Bind the active web runtime and package/build source."
    match = VERSION.fullmatch(version)
    if not match:
        return "UNPARSEABLE_VERSION", "Check the package's exact version and vendor advisory."
    major, minor, patch = map(int, match.groups())
    if (major, minor) in FIXED:
        if patch >= FIXED[(major, minor)]:
            return "UPSTREAM_VERSION_AT_OR_ABOVE_FIX", "Verify this is the active web worker build and that workers restarted."
        if ref:
            return "VENDOR_BACKPORT_REVIEW", "Validate the cited vendor advisory, package build and active worker."
        return "BELOW_UPSTREAM_FIX", f"Update to PHP {major}.{minor}.{FIXED[(major, minor)]} or a verified vendor backport."
    if major < 8 or (major == 8 and minor < 2):
        if ref:
            return "LEGACY_VENDOR_BACKPORT_REVIEW", "Validate the cited backport and plan migration to a supported branch."
        return "LEGACY_UPGRADE_REQUIRED", "Move to a supported patched PHP branch or obtain vendor-supported remediation."
    return "OTHER_BRANCH_REVIEW", "Check the current PHP release advisory and production support status."


def triage(path: Path) -> dict:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None or not REQUIRED.issubset(reader.fieldnames):
            missing = sorted(REQUIRED - set(reader.fieldnames or []))
            raise ValueError("Missing CSV columns: " + ", ".join(missing))
        rows = []
        seen = set()
        for line, row in enumerate(reader, start=2):
            asset_id = (row.get("asset_id") or "").strip()
            if not asset_id or asset_id in seen:
                raise ValueError(f"Line {line}: asset_id is empty or duplicated")
            seen.add(asset_id)
            internet = (row.get("internet_facing") or "").strip().lower()
            if internet not in {"yes", "no", "unknown"}:
                raise ValueError(f"Line {line}: internet_facing must be yes, no or unknown")
            php_version = row.get("php_version") or ""
            vendor_ref = row.get("vendor_backport_ref") or ""
            status, next_action = classify_version(php_version, vendor_ref)
            rows.append({
                "asset_id": asset_id,
                "declared_php_version": php_version.strip(),
                "declared_sapi": (row.get("sapi") or "").strip() or "UNKNOWN",
                "declared_internet_facing": internet.upper(),
                "vendor_backport_ref": vendor_ref.strip() or None,
                "version_triage": status,
                "next_action": next_action,
                "claim_ceiling": "OPERATOR_DECLARED_INVENTORY_ONLY",
            })
    return {
        "tool": "HALVETH PHP2Shell inventory triage",
        "tool_version": "0.1.0",
        "cves": ["CVE-2026-109618", "CVE-2026-109619"],
        "source": "operator-supplied CSV; no host or network probes",
        "count": len(rows),
        "assets": rows,
    }


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python inventory_triage.py inventory.csv", file=sys.stderr)
        return 2
    try:
        result = triage(Path(sys.argv[1]))
    except (OSError, UnicodeError, csv.Error, ValueError) as exc:
        print(f"Inventory error: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
