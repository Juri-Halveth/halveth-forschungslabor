"""Bounded local metadata inventory. Never opens or executes discovered files.

The JSONL contains relative names and timestamps and must stay outside Git.
This is a search index, not a complete content or ownership audit.
"""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import time


GENERATED = frozenset({
    ".git", "node_modules", ".venv", "venv", "__pycache__", ".next",
    ".nuxt", ".pytest_cache", ".mypy_cache", "target", "site-packages",
    ".gradle", ".idea", ".vs", "obj",
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

    with (output / "inventory_local.jsonl").open("w", encoding="utf-8") as stream:
        with os.scandir(root) as iterator:
            top_entries = sorted(list(iterator), key=lambda item: item.name.casefold())
        for top in top_entries:
            if files >= max_files or time.monotonic() - start >= max_seconds:
                excluded["budget_remaining_roots"] += 1
                break
            if is_reparse(top):
                excluded["reparse"] += 1
                continue
            if top.is_dir(follow_symlinks=False) and top.name.casefold() in GENERATED:
                excluded["generated"] += 1
                continue
            if Path(top.path).resolve() == output:
                excluded["own_output"] += 1
                continue
            top_count = 0
            top_state = "COMPLETE_WITH_EXCLUSIONS"
            stack = [Path(top.path)]
            while stack:
                if files >= max_files or time.monotonic() - start >= max_seconds:
                    top_state = "BUDGET_LIMIT"
                    break
                current = stack.pop()
                try:
                    if current.is_dir():
                        with os.scandir(current) as iterator:
                            entries = sorted(list(iterator), key=lambda item: item.name.casefold(), reverse=True)
                        for entry in entries:
                            if is_reparse(entry):
                                excluded["reparse"] += 1
                            elif entry.is_dir(follow_symlinks=False):
                                if entry.name.casefold() in GENERATED:
                                    excluded["generated"] += 1
                                elif Path(entry.path).resolve() == output:
                                    excluded["own_output"] += 1
                                else:
                                    stack.append(Path(entry.path))
                            elif entry.is_file(follow_symlinks=False):
                                stack.append(Path(entry.path))
                    elif current.is_file():
                        info = current.stat()
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
            roots.append({"name": top.name, "files": top_count, "state": top_state})

    summary = {
        "schema": "local-metadata-inventory-v1",
        "capturedAt": datetime.now(timezone.utc).isoformat(),
        "readMode": "METADATA_ONLY_NO_REPARSE_NO_CONTENT",
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
