#!/usr/bin/env python3
"""SPDX-License-Identifier: MIT. Loopback preview with explicit module MIME types."""
import argparse
import functools
import http.server
from pathlib import Path


class LabHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".mjs": "text/javascript; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
    }

    def send_head(self):
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
    root = Path(__file__).resolve().parents[2]
    handler = functools.partial(LabHandler, directory=str(root))
    with http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"http://127.0.0.1:{args.port}/branches/1001-doors/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
