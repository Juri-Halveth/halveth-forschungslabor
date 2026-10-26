// SPDX-License-Identifier: MIT
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: import.meta.dirname,
  testMatch: ["browser.spec.mjs", "organism.browser.spec.mjs"],
  workers: 1,
  timeout: 30000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8849",
    viewport: { width: 1440, height: 1000 },
    contextOptions: { reducedMotion: "reduce" },
    headless: true,
    channel: process.env.PLAYWRIGHT_CHROME === "1" ? "chrome" : undefined,
  },
  webServer: {
    command: "node serve.mjs 8849",
    cwd: import.meta.dirname,
    url: "http://127.0.0.1:8849",
    reuseExistingServer: false,
    timeout: 15000,
  },
});
