import { expect, test } from "@playwright/test";

/**
 * Critical flows (Section 14). These run against a dev server with a real
 * API_FOOTBALL_KEY; skip locally if the key is absent.
 */
const HAS_KEY = !!process.env.API_FOOTBALL_KEY;

test.describe("smoke flows", () => {
  test("matches page loads with date tabs", async ({ page }) => {
    test.skip(!HAS_KEY, "API_FOOTBALL_KEY not configured");
    await page.goto("/");
    await expect(page.getByRole("tab", { name: "Today" })).toBeVisible();
    await expect(page.getByRole("button", { name: /live only/i })).toBeVisible();
  });

  test("search returns results for a known team", async ({ page }) => {
    test.skip(!HAS_KEY, "API_FOOTBALL_KEY not configured");
    await page.goto("/search");
    await page.getByLabel("Search teams and leagues").fill("Arsenal");
    await expect(page.getByRole("link", { name: /Arsenal/ }).first()).toBeVisible({ timeout: 15_000 });
  });

  test("match detail opens from the board", async ({ page }) => {
    test.skip(!HAS_KEY, "API_FOOTBALL_KEY not configured");
    await page.goto("/");
    const firstMatch = page.locator("a[href^='/matches/']").first();
    await expect(firstMatch).toBeVisible({ timeout: 20_000 });
    await firstMatch.click();
    await expect(page.getByRole("tablist", { name: "Match sections" })).toBeVisible();
  });
});
