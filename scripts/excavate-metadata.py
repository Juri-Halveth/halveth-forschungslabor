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
from contextlib import closing
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


def inventory(root: Path, output: Path, max_files: int, max_seconds: float, *,
              order: str = "sorted", max_entries: int | None = None) -> dict:
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
    if order not in ("sorted", "filesystem"):
        raise ValueError("order must be sorted or filesystem")
    if max_entries is not None and (type(max_entries) is not int or max_entries < 1):
        raise ValueError("max_entries must be a positive integer")
    output.mkdir(parents=True, exist_ok=True)
    start = time.monotonic()
    roots: list[dict] = []
    excluded: Counter[str] = Counter()
    extensions: Counter[str] = Counter()
    errors = 0
    files = 0
    entries_read = 0
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

    def bounded_entries(iterator):
        nonlocal entries_read
        while True:
            check_budget()
            if max_entries is not None and entries_read >= max_entries:
                raise BudgetLimit("ENTRIES")
            try:
                entry = next(iterator)
            except StopIteration:
                return
            entries_read += 1
            check_budget()
            yield entry

    def eligible(entry):
        nonlocal errors
        try:
            if is_reparse(entry, check_budget):
                excluded["reparse"] += 1
                return None
            check_budget()
            is_dir = entry.is_dir(follow_symlinks=False)
            check_budget()
            if is_dir and entry.name.casefold() in GENERATED:
                excluded["generated"] += 1
                return None
            candidate = Path(entry.path)
            if is_dir and candidate.resolve() == output:
                excluded["own_output"] += 1
                return None
            if not is_dir and not entry.is_file(follow_symlinks=False):
                return None
            check_budget()
            return candidate
        except (OSError, ValueError):
            errors += 1
            return None

    def sort_key(entry):
        check_budget()
        return entry.name.casefold()

    def children(directory, top=False):
        nonlocal errors
        try:
            check_budget()
            with os.scandir(directory) as iterator:
                if order == "filesystem":
                    for entry in bounded_entries(iterator):
                        candidate = eligible(entry)
                        if candidate is not None:
                            yield candidate
                    return
                entries = list(bounded_entries(iterator))
            entries.sort(key=sort_key, reverse=not top)
            check_budget()
            if top:
                for entry in entries:
                    candidate = eligible(entry)
                    if candidate is not None:
                        yield candidate
            else:
                # Preserve both the established depth-first order and the
                # existing metadata checks before processing this directory.
                pending = []
                for entry in entries:
                    candidate = eligible(entry)
                    if candidate is not None:
                        pending.append(candidate)
                yield from reversed(pending)
        except (OSError, ValueError):
            errors += 1

    def record_file(current, stream):
        nonlocal files, bytes_seen
        if not current.is_file():
            return
        check_budget()
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

    def visit_top(top, stream):
        nonlocal errors
        stack = [iter((top,))]
        try:
            while stack:
                check_budget()
                try:
                    current = next(stack[-1])
                except StopIteration:
                    stack.pop()
                    continue
                try:
                    check_budget()
                    is_dir = current.is_dir()
                    check_budget()
                    if is_dir:
                        stack.append(children(current))
                    else:
                        record_file(current, stream)
                except (OSError, ValueError):
                    errors += 1
        finally:
            for iterator in reversed(stack):
                close = getattr(iterator, "close", None)
                if close is not None:
                    close()

    with (output / "inventory_local.jsonl").open("w", encoding="utf-8") as stream, \
            closing(children(root, top=True)) as top_entries:
        try:
            for top in top_entries:
                active_root = {"name": top.name, "files": 0, "state": "COMPLETE_WITH_EXCLUSIONS"}
                roots.append(active_root)
                visit_top(top, stream)
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
        "ordering": order,
        "entriesRead": entries_read,
        "maxEntries": max_entries,
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
    parser.add_argument("--order", choices=("sorted", "filesystem"), default="sorted",
                        help="filesystem processes each entry as it arrives; sorted preserves the normal order")
    parser.add_argument("--max-entries", type=int, help="cap directory entries read, including excluded names")
    args = parser.parse_args()
    summary = inventory(args.root, args.output, args.max_files, args.max_seconds,
                        order=args.order, max_entries=args.max_entries)
    print(json.dumps({key: summary[key] for key in (
        "files", "bytes", "entriesRead", "ordering", "elapsedSeconds", "readErrors", "state", "truncated", "budgetLimit",
    )}, ensure_ascii=False))


if __name__ == "__main__":
    main()
