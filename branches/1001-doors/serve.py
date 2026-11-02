#!/usr/bin/env python3
"""SPDX-License-Identifier: MIT. Loopback preview with explicit module MIME types."""
import argparse
import functools
import http.server
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[2]
PREFIX = "/branches/1001-doors/"
# The browser uses one existing shared parser. Do not expose the repository,
# its Git metadata, local receipts, or unrelated work through the preview.
PUBLIC_FILES = frozenset({
    "index.html", "style.css", "app.mjs", "model.mjs", "http-status-data.mjs",
    "number-research-view.mjs", "number-research.mjs",
    "powers-square-view.mjs", "powers-square.mjs",
    "role-journey-view.mjs", "role-journey.mjs",
    "registry.json", "relations.json", "README.md", "FORWARD_PORT.md",
    "NUMBER_RESEARCH.md",
    "NUMBER_RESEARCH_RECEIPT.json", "ROLE_JOURNEY_RESEARCH.md",
    "ROLE_JOURNEY_RECEIPT.json", "POWERS_SQUARE_RESEARCH.md",
    "SOURCE_RECEIPT.json", "http-status-codes-source.csv",
})


def public_resource(request_path):
    pathname = urlsplit(request_path).path
    if pathname == PREFIX:
        pathname += "index.html"
    if pathname == "/scripts/plain-json.mjs":
        candidate = ROOT / "scripts" / "plain-json.mjs"
    elif pathname.startswith(PREFIX) and pathname[len(PREFIX):] in PUBLIC_FILES:
        candidate = ROOT / "branches" / "1001-doors" / pathname[len(PREFIX):]
    else:
        return None
    # An allowlisted name replaced with a symlink must not escape its source.
    if candidate.is_symlink() or not candidate.is_file():
        return None
    resolved = candidate.resolve(strict=True)
    if resolved != candidate or not resolved.is_relative_to(ROOT):
        return None
    return candidate


class LabHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".mjs": "text/javascript; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
    }

    def send_head(self):
        # A browser page must not reach this loopback server through a
        # rebinding hostname. The local start URL always uses this exact host.
        if self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}":
            self.send_error(403, "Unexpected preview host")
            return None
        if public_resource(self.path) is None:
            self.send_error(404, "Not published by the local preview")
            return None
        # A previous Windows MIME response may be cached. Preview always sends
        # fresh bytes and headers instead of preserving it through a 304.
        for name in ("If-Modified-Since", "If-None-Match"):
            if name in self.headers:
                del self.headers[name]
        return super().send_head()

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8856)
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error("port must be from 1024 through 65535")
    handler = functools.partial(LabHandler, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"http://127.0.0.1:{args.port}/branches/1001-doors/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
