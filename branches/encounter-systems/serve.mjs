// SPDX-License-Identifier: MIT
// Loopback development server; not a production service.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { publicFiles } from "../../scripts/build-encounter-site.mjs";
const root = await fs.realpath(path.resolve(import.meta.dirname,"../..")),
  port = Number(process.argv[2] || 8849);
const routes = new Map(publicFiles.map((entry) => [entry.path,entry.sourcePath]));
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw Error("Invalid local port");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".md": "text/plain; charset=utf-8",
  ".py": "text/plain; charset=utf-8",
};
const server = http.createServer(async (req, res) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      res.end();
      return;
    }
    const pathname = decodeURIComponent(
        new URL(req.url, "http://127.0.0.1").pathname,
      ),
      relative = pathname.endsWith("/") ? pathname.slice(1)+"index.html" : pathname.slice(1);
    if (
      relative.split(/[\\/]/).some((s) => s.startsWith(".")) ||
      !mime[path.extname(relative)] || !routes.has(relative)
    )
      throw Error("Not served");
    const target = await fs.realpath(path.resolve(root, routes.get(relative)));
    if (!target.startsWith(root + path.sep)) throw Error("Out of scope");
    const bytes = await fs.readFile(target);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(target)],
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; frame-ancestors 'self'",
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Encounter lab: http://127.0.0.1:${port}/`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
