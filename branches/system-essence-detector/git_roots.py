#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Find local Git roots at a bounded depth without publishing their content.

The report is private metadata. A repository marker, HEAD, remote name, or
license filename is not proof of ownership, current use, license validity, or
permission to copy, delete, or publish files.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA = "halveth.essence-git-roots.v1"
LICENSE_NAMES = ("LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING", "NOTICE")


def is_reparse(path: Path) -> bool:
    stat = path.lstat()
    return path.is_symlink() or bool(getattr(stat, "st_file_attributes", 0) & 0x400)


def git(path: Path, *args: str) -> tuple[int, str]:
    try:
        process = subprocess.run(
            ["git", "-C", str(path), *args],
            text=True,
            encoding="utf-8",
            errors="strict",
            capture_output=True,
            timeout=12,
            check=False,
            env={**os.environ, "GIT_OPTIONAL_LOCKS": "0"},
        )
        return process.returncode, process.stdout.strip()
    except (OSError, UnicodeError, subprocess.TimeoutExpired):
        return -1, ""


def inspect_repo(path: Path) -> dict[str, Any] | None:
    marker = path / ".git"
    try:
        if not marker.exists() or is_reparse(marker):
            return None
        if not (marker.is_dir() or marker.is_file()):
            return None
    except OSError:
        return None
    rc, actual = git(path, "rev-parse", "--show-toplevel")
    if rc != 0:
        return None
    try:
        if not os.path.samefile(path, actual):
            return None
    except OSError:
        return None
    head_rc, head = git(path, "rev-parse", "--verify", "HEAD")
    _, branch = git(path, "branch", "--show-current")
    _, remotes = git(path, "remote")
    return {
        "path": str(path),
        "head": head if head_rc == 0 else None,
        "branch": branch or None,
        "remoteNames": remotes.splitlines(),
        "rootLicenseFileNames": [
            name for name in LICENSE_NAMES if (path / name).is_file()
        ],
        "hasRootAgents": (path / "AGENTS.md").is_file(),
        "state": "LOCAL_GIT_METADATA_ONLY",
    }


def discover(root: Path, max_children: int = 1000) -> dict[str, Any]:
    if max_children < 0:
        raise ValueError("max_children must be nonnegative")
    if is_reparse(root):
        raise ValueError("root must not be a link or reparse point")
    root = root.resolve(strict=True)
    if not root.is_dir():
        raise ValueError("root must be a directory")
    coverage: dict[str, Any] = {
        "depth": 1,
        "childLimit": max_children,
        "childrenSeen": 0,
        "skippedLinksOrReparse": 0,
        "errors": [],
        "limitReached": False,
    }
    results = []
    own = inspect_repo(root)
    if own:
        results.append(own)
    try:
        with os.scandir(root) as entries:
            for entry in entries:
                if coverage["childrenSeen"] >= max_children:
                    coverage["limitReached"] = True
                    break
                coverage["childrenSeen"] += 1
                try:
                    child = Path(entry.path)
                    if is_reparse(child):
                        coverage["skippedLinksOrReparse"] += 1
                        continue
                    if not entry.is_dir(follow_symlinks=False):
                        continue
                    record = inspect_repo(child)
                    if record:
                        results.append(record)
                except OSError as exc:
                    coverage["errors"].append({"name": entry.name, "error": str(exc)})
    except OSError as exc:
        coverage["errors"].append({"name": ".", "error": str(exc)})
    results.sort(key=lambda item: item["path"].casefold())
    return {
        "schema": SCHEMA,
        "at": datetime.now(timezone.utc).isoformat(),
        "mode": "LOCAL_READ_ONLY_GIT_METADATA",
        "root": str(root),
        "coverage": coverage,
        "repositories": results,
        "claimCeiling": (
            "A Git root, HEAD, remote name, or license filename is only local metadata. "
            "No ownership, license validity, public remote state, source cleanliness, "
            "or publication authorization is inferred."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--max-children", type=int, default=1000)
    args = parser.parse_args()
    public_repo = Path(__file__).resolve().parents[2]
    output = args.output.expanduser().resolve()
    if output == public_repo or public_repo in output.parents:
        parser.error("local Git reports contain private paths; choose an output outside this repository")
    selected_root = args.root.expanduser().resolve(strict=True)
    if output == selected_root or selected_root in output.parents:
        parser.error("local Git report must stay outside the selected source tree")
    report = discover(args.root, args.max_children)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"Wrote {output} | {len(report['repositories'])} local Git roots | "
        f"{report['coverage']['childrenSeen']} children seen"
    )


if __name__ == "__main__":
    main()
