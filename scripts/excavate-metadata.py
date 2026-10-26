"""Bounded local metadata inventory. Never opens or executes discovered files.

The JSONL contains relative names and timestamps and must stay outside Git.
This is a search index, not a complete content or ownership audit.
"""

from __future__ import annotations

import argparse
from collections import Counter
from contextlib import closing
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import time


GENERATED = frozenset({
    ".git", "node_modules", ".venv", "venv", "__pycache__", ".next",
    ".nuxt", ".pytest_cache", ".mypy_cache", "target", "site-packages",
    ".gradle", ".idea", ".vs", ".codex-build", "vendor", "dist", "build", "obj",
})
SENSITIVE_NAMES = (".env", "password", "secret", "token", "credential", "private_key", "id_rsa", "wallet", "seedphrase", "mnemonic")


def is_reparse(entry: os.DirEntry[str]) -> bool:
    """Do not cross symlink or Windows reparse boundaries."""
    try:
        info = entry.stat(follow_symlinks=False)
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
    if max_files < 1 or max_seconds <= 0:
        raise ValueError("budgets must be positive")
    output.mkdir(parents=True, exist_ok=True)
    start = time.monotonic()
    roots: list[dict] = []
    excluded: Counter[str] = Counter()
    extensions: Counter[str] = Counter()
    errors = 0
    files = 0
    bytes_seen = 0

    def budget_reached() -> bool:
        return files >= max_files or time.monotonic() - start >= max_seconds

    def children(directory: Path):
        """Stream entries without buffering a whole directory before visiting it."""
        nonlocal errors
        if budget_reached():
            return
        try:
            with os.scandir(directory) as iterator:
                while not budget_reached():
                    try:
                        entry = next(iterator)
                    except StopIteration:
                        return
                    if budget_reached():
                        return
                    if is_reparse(entry):
                        excluded["reparse"] += 1
                        continue
                    if budget_reached():
                        return
                    is_directory = entry.is_dir(follow_symlinks=False)
                    if budget_reached():
                        return
                    if is_directory and entry.name.casefold() in GENERATED:
                        excluded["generated"] += 1
                        continue
                    candidate = Path(entry.path)
                    if candidate.resolve() == output:
                        excluded["own_output"] += 1
                        continue
                    if budget_reached():
                        return
                    yield candidate
        except (OSError, ValueError):
            errors += 1

    with (output / "inventory_local.jsonl").open("w", encoding="utf-8") as stream, \
            closing(children(root)) as top_entries:
        for top in top_entries:
            top_count = 0
            top_state = "COMPLETE_WITH_EXCLUSIONS"
            stack = [iter((top,))]
            try:
                while stack:
                    if budget_reached():
                        top_state = "BUDGET_LIMIT"
                        break
                    try:
                        current = next(stack[-1])
                    except StopIteration:
                        stack.pop()
                        continue
                    if budget_reached():
                        top_state = "BUDGET_LIMIT"
                        break
                    try:
                        is_directory = current.is_dir()
                        if budget_reached():
                            top_state = "BUDGET_LIMIT"
                            break
                        if is_directory:
                            stack.append(children(current))
                            continue
                        is_file = current.is_file()
                        if budget_reached():
                            top_state = "BUDGET_LIMIT"
                            break
                        if not is_file:
                            continue
                        info = current.stat()
                        if budget_reached():
                            top_state = "BUDGET_LIMIT"
                            break
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
                        top_count += 1
                        bytes_seen += info.st_size
                        extensions[ext] += 1
                    except (OSError, ValueError):
                        errors += 1
            finally:
                for iterator in reversed(stack):
                    close = getattr(iterator, "close", None)
                    if close is not None:
                        close()
            if budget_reached():
                top_state = "BUDGET_LIMIT"
            roots.append({"name": top.name, "files": top_count, "state": top_state})
        if budget_reached():
            excluded["budget_remaining_roots"] += 1

    summary = {
        "schema": "local-metadata-inventory-v1",
        "capturedAt": datetime.now(timezone.utc).isoformat(),
        "readMode": "METADATA_ONLY_NO_REPARSE_NO_CONTENT",
        "ordering": "FILESYSTEM_ENUMERATION",
        "budgetMode": "COOPERATIVE_BETWEEN_FILESYSTEM_CALLS",
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
    print(json.dumps({key: summary[key] for key in ("files", "bytes", "elapsedSeconds", "readErrors")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
