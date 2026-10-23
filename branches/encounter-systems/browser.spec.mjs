// SPDX-License-Identifier: MIT
import { test, expect } from "@playwright/test";
import path from "node:path";
test("commands, timeline, workloads, corruption and repair are connected to model state", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(
    () => !!document.getElementById("halveth-encounter-work")?.__encounter,
  );
  const advance = (t) =>
    page.evaluate(
      (t) =>
        document
          .getElementById("halveth-encounter-work")
          .__encounter.advanceTo(t),
      t,
    );
  await advance(3);
  await page.locator("#ew-partner").click();
  await page.locator("#ew-visit").click();
  await advance(6);
  await expect(page.locator("#ew-copies")).toHaveText("3 / 3");
  await expect(page.locator("#result-runs")).toHaveText("12");
  const before = await page.evaluate(() =>
    JSON.stringify(
      document.getElementById("halveth-encounter-work").__encounter.snapshot(),
    ),
  );
  await page.locator("#history").fill("0");
  await expect(page.locator("#ew-partner")).toBeDisabled();
  const after = await page.evaluate(() =>
    JSON.stringify(
      document.getElementById("halveth-encounter-work").__encounter.snapshot(),
    ),
  );
  expect(after).toBe(before);
  await page.locator("#ew-view").click();
  await page.locator("#history-live").click();
  await expect(page.locator("#ew-partner")).toBeEnabled();
  await page.locator("#ew-view").click();
  await page.locator("#ew-write").click();
  await advance(7);
  await expect(page.locator("#ew-event")).toContainText("gestoppt");
  await page.locator("#ew-guard").uncheck();
  await page.locator("#ew-write").click();
  await advance(8);
  await expect(page.locator("#ew-repair")).toBeVisible();
  await page.locator("#ew-repair").click();
  expect(
    await page.evaluate(
      () =>
        document.getElementById("halveth-encounter-work").__encounter.inspect()
          .corrupted,
    ),
  ).toEqual([]);
  await page.screenshot({
    path: info.outputPath("desktop.png"),
    fullPage: true,
  });
  if (process.env.UPDATE_PREVIEW === "1")
    await page
      .locator("#experiment")
      .screenshot({ path: path.join(import.meta.dirname, "preview.png") });
  await page.locator("#ew-task").selectOption("wave");
  await advance(5);
  expect(
    await page.evaluate(
      () =>
        document.getElementById("halveth-encounter-work").__encounter.inspect()
          .task,
    ),
  ).toBe("wave");
  await page.locator("#ew-reset").click();
  await page.locator("#ew-play").click();
  await page.waitForFunction(
    () =>
      document.getElementById("halveth-encounter-work").__encounter.inspect()
        .time > 0.2,
  );
  await page.locator("#ew-play").click();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({
    path: info.outputPath("mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 320, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
