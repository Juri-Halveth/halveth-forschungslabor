"""Bounded local metadata inventory. Never opens or executes discovered files.

The JSONL contains relative names and timestamps and must stay outside Git.
This is a search index, not a complete content or ownership audit.

The traversal budget is cooperative: an in-flight OS call, an in-memory sort
or writing the result cannot be preempted. Expiration stops further traversal
and is reported explicitly, including when top-level enumeration is cut short.
"""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import time


GENERATED = frozenset({
    ".git", "node_modules", ".venv", "venv", "__pycache__", ".next",
    ".nuxt", ".pytest_cache", ".mypy_cache", "target", "site-packages",
    ".gradle", ".idea", ".vs", ".codex-build", "vendor", "dist", "build", "obj",
})
SENSITIVE_NAMES = (".env", "password", "secret", "token", "credential", "private_key", "id_rsa", "wallet", "seedphrase", "mnemonic")


def is_reparse(entry: os.DirEntry[str], check_budget) -> bool:
    """Do not cross symlink or Windows reparse boundaries."""
    try:
        check_budget()
        info = entry.stat(follow_symlinks=False)
        check_budget()
        return entry.is_symlink() or bool(getattr(info, "st_file_attributes", 0) & 0x400)
    except OSError:
        return True


def inventory(root: Path, output: Path, max_files: int, max_seconds: float) -> dict:
    root = root.resolve(strict=True)
    output = output.resolve()
    repo = Path(__file__).resolve().parents[1]
    if not root.is_dir():
        raise ValueError("root must be a directory")
    if output == repo or repo in output.parents:
        raise ValueError("the private inventory must be written outside this repository")
    if any((ancestor / ".git").exists() for ancestor in (output, *output.parents)):
        raise ValueError("the private inventory must be written outside any Git checkout")
    if max_files < 1 or not math.isfinite(max_seconds) or max_seconds <= 0:
        raise ValueError("budgets must be positive and finite")
    output.mkdir(parents=True, exist_ok=True)
    start = time.monotonic()
    roots: list[dict] = []
    excluded: Counter[str] = Counter()
    extensions: Counter[str] = Counter()
    errors = 0
    files = 0
    bytes_seen = 0
    deadline = start + max_seconds
    budget_limit = None
    active_root = None

    class BudgetLimit(Exception):
        pass

    def check_budget():
        if time.monotonic() >= deadline:
            raise BudgetLimit("TIME")
        if files >= max_files:
            raise BudgetLimit("FILES")

    def read_entries(directory, reverse=False):
        check_budget()
        entries = []
        with os.scandir(directory) as iterator:
            while True:
                check_budget()
                try:
                    entry = next(iterator)
                except StopIteration:
                    break
                check_budget()
                entries.append(entry)

        def order(entry):
            check_budget()
            return entry.name.casefold()

        # Preserve the normal ordering of complete directories. If enumeration
        # expires, the caller reports an incomplete root rather than claiming
        # that an OS-dependent prefix was the complete sorted directory.
        check_budget()
        entries.sort(key=order, reverse=reverse)
        check_budget()
        return entries

    with (output / "inventory_local.jsonl").open("w", encoding="utf-8") as stream:
        try:
            for top in read_entries(root):
                check_budget()
                if is_reparse(top, check_budget):
                    excluded["reparse"] += 1
                    continue
                check_budget()
                top_is_dir = top.is_dir(follow_symlinks=False)
                check_budget()
                if top_is_dir and top.name.casefold() in GENERATED:
                    excluded["generated"] += 1
                    continue
                if Path(top.path).resolve() == output:
                    excluded["own_output"] += 1
                    continue
                active_root = {"name": top.name, "files": 0, "state": "COMPLETE_WITH_EXCLUSIONS"}
                roots.append(active_root)
                stack = [Path(top.path)]
                while stack:
                    check_budget()
                    current = stack.pop()
                    try:
                        current_is_dir = current.is_dir()
                        check_budget()
                        if current_is_dir:
                            for entry in read_entries(current, reverse=True):
                                check_budget()
                                if is_reparse(entry, check_budget):
                                    excluded["reparse"] += 1
                                    continue
                                check_budget()
                                entry_is_dir = entry.is_dir(follow_symlinks=False)
                                check_budget()
                                if entry_is_dir:
                                    if entry.name.casefold() in GENERATED:
                                        excluded["generated"] += 1
                                    elif Path(entry.path).resolve() == output:
                                        excluded["own_output"] += 1
                                    else:
                                        stack.append(Path(entry.path))
                                else:
                                    entry_is_file = entry.is_file(follow_symlinks=False)
                                    check_budget()
                                    if entry_is_file:
                                        stack.append(Path(entry.path))
                                check_budget()
                        else:
                            current_is_file = current.is_file()
                            check_budget()
                            if current_is_file:
                                info = current.stat()
                                check_budget()
                                relative = current.relative_to(root).as_posix()
                                ext = current.suffix.casefold() or "[none]"
                                stream.write(json.dumps({
                                    "relativePath": relative,
                                    "size": info.st_size,
                                    "mtimeNs": info.st_mtime_ns,
                                    "extension": ext,
                                    "sensitiveName": any(part in relative.casefold() for part in SENSITIVE_NAMES),
                                }, ensure_ascii=False, separators=(",", ":")) + "\n")
                                files += 1
                                active_root["files"] += 1
                                bytes_seen += info.st_size
                                extensions[ext] += 1
                    except (OSError, ValueError):
                        errors += 1
                active_root = None
        except BudgetLimit as limit:
            budget_limit = str(limit)
            if active_root is not None:
                active_root["state"] = "BUDGET_LIMIT"
            else:
                excluded["budget_remaining_roots"] += 1

    summary = {
        "schema": "local-metadata-inventory-v1",
        "capturedAt": datetime.now(timezone.utc).isoformat(),
        "readMode": "METADATA_ONLY_NO_REPARSE_NO_CONTENT",
        "state": "BUDGET_LIMIT" if budget_limit else "COMPLETE_WITH_EXCLUSIONS",
        "truncated": budget_limit is not None,
        "budgetLimit": budget_limit,
        "root": str(root),
        "files": files,
        "bytes": bytes_seen,
        "elapsedSeconds": round(time.monotonic() - start, 3),
        "roots": roots,
        "extensions": extensions.most_common(40),
        "excluded": dict(excluded),
        "readErrors": errors,
    }
    (output / "inventory_summary_local.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--max-files", type=int, default=100_000)
    parser.add_argument("--max-seconds", type=float, default=600)
    args = parser.parse_args()
    summary = inventory(args.root, args.output, args.max_files, args.max_seconds)
    print(json.dumps({key: summary[key] for key in (
        "files", "bytes", "elapsedSeconds", "readErrors", "state", "truncated", "budgetLimit",
    )}, ensure_ascii=False))


if __name__ == "__main__":
    main()
