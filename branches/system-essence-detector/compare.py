#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Compare two explicitly selected local trees by paths and file bytes, read only."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import stat as stat_module
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA = "halveth.essence-tree-compare.v1"
READ_CHUNK = 4 * 1024 * 1024


def is_reparse(st: os.stat_result) -> bool:
    return bool(getattr(st, "st_file_attributes", 0) & 0x400)


def selected_root(path: Path) -> Path:
    before = path.lstat()
    if stat_module.S_ISLNK(before.st_mode) or is_reparse(before):
        raise ValueError(f"selected root is a link or reparse point: {path}")
    root = path.resolve(strict=True)
    if not root.is_dir():
        raise ValueError(f"selected root is not a directory: {path}")
    return root


def stable_hash(path: Path, before: os.stat_result) -> str | None:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        opened = os.fstat(source.fileno())
        identity = lambda st: (st.st_dev, st.st_ino, st.st_size, st.st_mtime_ns)
        if identity(before) != identity(opened):
            return None
        for block in iter(lambda: source.read(READ_CHUNK), b""):
            digest.update(block)
    after = path.lstat()
    if identity(before) != identity(after) or is_reparse(after) or stat_module.S_ISLNK(after.st_mode):
        return None
    return digest.hexdigest()


def inventory(root: Path, *, max_entries: int, max_bytes: int) -> dict[str, Any]:
    if max_entries < 1 or max_bytes < 1:
        raise ValueError("entry and byte budgets must be positive")
    root = selected_root(root)
    coverage: dict[str, Any] = {
        "entriesSeen": 0,
        "filesHashed": 0,
        "bytesHashed": 0,
        "entryLimit": max_entries,
        "byteLimit": max_bytes,
        "gaps": [],
        "complete": True,
    }
    directories: set[str] = set()
    files: dict[str, dict[str, Any]] = {}
    stack = [root]
    while stack:
        folder = stack.pop()
        try:
            with os.scandir(folder) as entries:
                for entry in entries:
                    if coverage["entriesSeen"] >= max_entries:
                        coverage["gaps"].append({"kind": "ENTRY_LIMIT", "path": str(folder.relative_to(root))})
                        coverage["complete"] = False
                        stack.clear()
                        break
                    coverage["entriesSeen"] += 1
                    relative = Path(entry.path).relative_to(root).as_posix()
                    try:
                        # On Windows, DirEntry.stat can report zero dev/inode;
                        # Path.stat gives the identity used by the open handle.
                        st = Path(entry.path).lstat()
                        if entry.is_symlink() or is_reparse(st):
                            coverage["gaps"].append({"kind": "LINK_OR_REPARSE", "path": relative})
                            coverage["complete"] = False
                            continue
                        if entry.is_dir(follow_symlinks=False):
                            directories.add(relative)
                            stack.append(Path(entry.path))
                        elif entry.is_file(follow_symlinks=False):
                            if coverage["bytesHashed"] + st.st_size > max_bytes:
                                coverage["gaps"].append({"kind": "BYTE_LIMIT", "path": relative})
                                coverage["complete"] = False
                                continue
                            digest = stable_hash(Path(entry.path), st)
                            coverage["bytesHashed"] += st.st_size
                            if digest is None:
                                coverage["gaps"].append({"kind": "UNSTABLE_FILE", "path": relative})
                                coverage["complete"] = False
                                continue
                            coverage["filesHashed"] += 1
                            files[relative] = {"bytes": st.st_size, "sha256": digest}
                        else:
                            coverage["gaps"].append({"kind": "UNSUPPORTED_ENTRY", "path": relative})
                            coverage["complete"] = False
                    except OSError as exc:
                        coverage["gaps"].append({"kind": "READ_ERROR", "path": relative, "error": str(exc)})
                        coverage["complete"] = False
        except OSError as exc:
            coverage["gaps"].append({"kind": "ENUMERATION_ERROR", "path": str(folder.relative_to(root)), "error": str(exc)})
            coverage["complete"] = False
    coverage["gaps"].sort(key=lambda item: (item["path"], item["kind"]))
    manifest = {
        "directories": sorted(directories),
        "files": [{"path": path, **files[path]} for path in sorted(files)],
    }
    tree_digest = hashlib.sha256(
        json.dumps(manifest, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    return {"root": str(root), "coverage": coverage, "treeSha256": tree_digest, "manifest": manifest}


def compare_trees(left_root: Path, right_root: Path, *, max_entries: int = 1_000_000,
                  max_bytes: int = 100 * 1024**3) -> dict[str, Any]:
    left = inventory(left_root, max_entries=max_entries, max_bytes=max_bytes)
    right = inventory(right_root, max_entries=max_entries, max_bytes=max_bytes)
    left_files = {item["path"]: item for item in left["manifest"]["files"]}
    right_files = {item["path"]: item for item in right["manifest"]["files"]}
    left_dirs = set(left["manifest"]["directories"])
    right_dirs = set(right["manifest"]["directories"])
    differences = []
    differences.extend({"kind": "LEFT_ONLY_DIRECTORY", "path": path} for path in sorted(left_dirs - right_dirs))
    differences.extend({"kind": "RIGHT_ONLY_DIRECTORY", "path": path} for path in sorted(right_dirs - left_dirs))
    differences.extend({"kind": "LEFT_ONLY_FILE", "path": path} for path in sorted(left_files.keys() - right_files.keys()))
    differences.extend({"kind": "RIGHT_ONLY_FILE", "path": path} for path in sorted(right_files.keys() - left_files.keys()))
    for path in sorted(left_files.keys() & right_files.keys()):
        if left_files[path] != right_files[path]:
            kind = "SIZE_DIFFERENT" if left_files[path]["bytes"] != right_files[path]["bytes"] else "CONTENT_DIFFERENT"
            differences.append({"kind": kind, "path": path,
                                "left": left_files[path], "right": right_files[path]})
    complete = left["coverage"]["complete"] and right["coverage"]["complete"]
    verdict = "UNKNOWN_INCOMPLETE" if not complete else "DIFFERENT" if differences else "EQUAL_WITHIN_BOUND_COVERAGE"
    return {
        "schema": SCHEMA,
        "recordedAt": datetime.now(timezone.utc).isoformat(),
        "mode": "LOCAL_READ_ONLY_BYTE_COMPARISON",
        "equality": "SAME_RELATIVE_DIRECTORY_SET_AND_FILE_PATH_BYTE_SET",
        "left": left,
        "right": right,
        "verdict": verdict,
        "differences": differences,
        "claimCeiling": "Path and file-byte equality at bounded reads; no runtime, ACL, backup, stable-concurrency or disposal authorization.",
    }


def inside(child: Path, parent: Path) -> bool:
    try:
        return os.path.commonpath((os.path.normcase(str(child)), os.path.normcase(str(parent)))) == os.path.normcase(str(parent))
    except ValueError:
        return False


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("left", type=Path)
    parser.add_argument("right", type=Path)
    parser.add_argument("--output", type=Path, required=True, help="Private local JSON path outside both inputs and the public repository")
    parser.add_argument("--max-entries", type=int, default=1_000_000)
    parser.add_argument("--max-bytes", type=int, default=100 * 1024**3)
    args = parser.parse_args()
    output = args.output.expanduser().resolve()
    roots = (selected_root(args.left), selected_root(args.right))
    public_repo = Path(__file__).resolve().parents[2]
    if any(inside(output, root) for root in (*roots, public_repo)):
        parser.error("comparison reports contain local paths and must stay outside inputs and this public repository")
    report = compare_trees(*roots, max_entries=args.max_entries, max_bytes=args.max_bytes)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{report['verdict']} | {len(report['differences'])} observed differences | report: {output}")


if __name__ == "__main__":
    main()
