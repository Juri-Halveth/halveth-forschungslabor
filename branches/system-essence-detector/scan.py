#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Read-only, explicitly scoped storage scan. Never removes or moves files."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA = "halveth.essence-scan.v1"
PYTHON_CACHE_NAMES = {"__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_link_or_reparse(entry: os.DirEntry[str], stat: os.stat_result) -> bool:
    return entry.is_symlink() or bool(getattr(stat, "st_file_attributes", 0) & 0x400)


def source_probe(path: Path) -> tuple[str, list[str]] | None:
    """Return a candidate class and its local, bounded evidence notes."""
    name = path.name.lower()
    if name in PYTHON_CACHE_NAMES:
        return "PYTHON_BYTECODE_CACHE", ["Exact cache directory name; Python can regenerate it."]
    if name == "incremental" and path.parent.name.lower() == "debug" and path.parent.parent.name.lower() == "target":
        project = path.parent.parent.parent
        if (project / "Cargo.toml").is_file() and (project / "target" / "CACHEDIR.TAG").is_file():
            return "CARGO_INCREMENTAL", ["Cargo.toml and target/CACHEDIR.TAG present."]
        return "REVIEW_UNKNOWN_INCREMENTAL", ["Cargo source or cache marker missing."]
    if name == "build" and path.parent.name.lower() == "intermediate":
        project = path.parent.parent
        if any(project.glob("*.uproject")) and (project / "Source").is_dir() and (project / "Content").is_dir():
            return "UNREAL_INTERMEDIATE_BUILD", ["Unreal project, Source and Content present."]
        return "REVIEW_UNKNOWN_BUILD", ["Unreal source project not established."]
    if name == ".site-build":
        return "SITE_BUILD", ["Generated site folder; Git/source receipt needs a separate probe."]
    if name == "node_modules":
        return "REVIEW_DEPENDENCIES", ["Installed dependencies; lockfile and offline needs are unknown."]
    if name == ".cache":
        return "REVIEW_GENERIC_CACHE", ["Generic cache name; may contain resumable model downloads."]
    return None


def git_site_probe(path: Path) -> tuple[str, list[str]]:
    parent = path.parent
    receipt_path = path / "build-info.json"
    notes: list[str] = []
    if not receipt_path.is_file() or receipt_path.stat().st_size > 65536:
        return "HOLD_SOURCE_STATE", ["Missing or oversized build-info.json."]
    try:
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError):
        return "HOLD_SOURCE_STATE", ["Build receipt cannot be parsed."]
    try:
        def git(*args: str) -> subprocess.CompletedProcess[str]:
            return subprocess.run(
                ["git", "-C", str(parent), *args],
                capture_output=True,
                text=True,
                timeout=15,
                check=False,
            )

        head = git("rev-parse", "HEAD")
        status = git("status", "--porcelain", "--untracked-files=normal")
        ignored = git("check-ignore", "-q", "--", str(path))
    except (OSError, subprocess.TimeoutExpired):
        return "HOLD_SOURCE_STATE", ["Git probe unavailable."]
    if head.returncode or status.returncode or ignored.returncode:
        return "HOLD_SOURCE_STATE", ["HEAD, worktree or ignore binding missing."]
    notes.append("Git HEAD, worktree status and ignored output checked.")
    if receipt.get("sourceTreeState") != "GIT_STATUS_CLEAN":
        return "HOLD_SOURCE_STATE", notes + ["Build receipt records a dirty or unknown source state."]
    if receipt.get("sourceCommit") != head.stdout.strip() or status.stdout.strip():
        return "HOLD_SOURCE_STATE", notes + ["Receipt commit differs from current clean checkout."]
    if not (parent / "tools" / "build_site.mjs").is_file():
        return "HOLD_SOURCE_STATE", notes + ["Build script not found at expected path."]
    return "REBUILDABLE_CANDIDATE", notes + ["Receipt clean and tied to current HEAD; build script present."]


def candidate(path: Path, kind: str, notes: list[str], root: Path) -> dict[str, Any]:
    relative = str(path.relative_to(root))
    decision = "REVIEW"
    if kind in {"PYTHON_BYTECODE_CACHE", "CARGO_INCREMENTAL", "UNREAL_INTERMEDIATE_BUILD"}:
        decision = "REBUILDABLE_CANDIDATE"
    if kind == "SITE_BUILD":
        decision, more = git_site_probe(path)
        notes = notes + more
    return {
        "id": hashlib.sha256(relative.encode("utf-8")).hexdigest()[:16],
        "relativePath": relative,
        "kind": kind,
        "decision": decision,
        "notes": notes,
        "files": 0,
        "logicalBytes": 0,
    }


def scan(root: Path, max_entries: int = 1_000_000) -> dict[str, Any]:
    if max_entries < 1:
        raise ValueError("max_entries must be positive")
    root = root.resolve(strict=True)
    if not root.is_dir():
        raise ValueError("root must be a directory")
    result: dict[str, Any] = {
        "schema": SCHEMA,
        "mode": "LOCAL_READ_ONLY_METADATA",
        "root": str(root),
        "startedAt": utc_now(),
        "coverage": {
            "entryLimit": max_entries,
            "entriesSeen": 0,
            "filesSeen": 0,
            "directoriesSeen": 0,
            "skippedLinksOrReparse": 0,
            "errors": [],
            "limitReached": False,
        },
        "logicalBytes": 0,
        "topLevel": {},
        "candidates": [],
        "candidateBytesNonAdditive": True,
        "claimCeiling": "Metadata names, sizes and local source probes only; no safe-delete authorization or physical-free-space estimate.",
    }
    coverage = result["coverage"]
    candidates: list[dict[str, Any]] = result["candidates"]
    stack: list[tuple[Path, tuple[int, ...], str | None]] = [(root, (), None)]
    while stack:
        folder, ancestors, top = stack.pop()
        try:
            with os.scandir(folder) as entries:
                for entry in entries:
                    if coverage["entriesSeen"] >= max_entries:
                        coverage["limitReached"] = True
                        break
                    coverage["entriesSeen"] += 1
                    try:
                        stat = entry.stat(follow_symlinks=False)
                        if is_link_or_reparse(entry, stat):
                            coverage["skippedLinksOrReparse"] += 1
                            continue
                        entry_top = top or entry.name
                        if entry.is_dir(follow_symlinks=False):
                            coverage["directoriesSeen"] += 1
                            child_ancestors = ancestors
                            probe = source_probe(Path(entry.path))
                            if probe:
                                item = candidate(Path(entry.path), *probe, root)
                                candidates.append(item)
                                child_ancestors = (*ancestors, len(candidates) - 1)
                            stack.append((Path(entry.path), child_ancestors, entry_top))
                        elif entry.is_file(follow_symlinks=False):
                            size = stat.st_size
                            coverage["filesSeen"] += 1
                            result["logicalBytes"] += size
                            item = result["topLevel"].setdefault(entry_top, {"files": 0, "logicalBytes": 0})
                            item["files"] += 1
                            item["logicalBytes"] += size
                            for index in ancestors:
                                candidates[index]["files"] += 1
                                candidates[index]["logicalBytes"] += size
                            if entry.name.endswith(".incomplete"):
                                incomplete = candidate(Path(entry.path), "RESUMABLE_DOWNLOAD_PART", ["Partial download may be resumable; retain until origin and restart path are checked."], root)
                                incomplete["files"] = 1
                                incomplete["logicalBytes"] = size
                                candidates.append(incomplete)
                    except OSError as exc:
                        if len(coverage["errors"]) < 1000:
                            coverage["errors"].append({"relativePath": os.path.relpath(entry.path, root), "error": str(exc)})
                if coverage["limitReached"]:
                    break
        except OSError as exc:
            if len(coverage["errors"]) < 1000:
                coverage["errors"].append({"relativePath": os.path.relpath(folder, root), "error": str(exc)})
    result["finishedAt"] = utc_now()
    result["topLevel"] = [
        {"name": name, **stats}
        for name, stats in sorted(result["topLevel"].items(), key=lambda pair: pair[1]["logicalBytes"], reverse=True)
    ]
    candidates.sort(key=lambda item: item["logicalBytes"], reverse=True)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="Explicit local directory to inspect")
    parser.add_argument("--output", type=Path, required=True, help="Local private JSON report path")
    parser.add_argument("--max-entries", type=int, default=1_000_000)
    args = parser.parse_args()
    output = args.output.expanduser().resolve()
    public_repo = Path(__file__).resolve().parents[2]
    if output == public_repo or public_repo in output.parents:
        parser.error("scan reports contain local paths and must be written outside this public repository")
    report = scan(args.root, max_entries=args.max_entries)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {output} | {report['coverage']['entriesSeen']} entries | {len(report['candidates'])} candidates")


if __name__ == "__main__":
    main()
