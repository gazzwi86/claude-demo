import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { test } from "../fixtures.js";

const { Given, When, Then } = createBdd(test);

async function shoot(page: Page, name: string) {
  await page.waitForLoadState("networkidle");
  await page.addStyleTag({
    content: `
      * { caret-color: transparent !important; }
      *, *::before, *::after { animation: none !important; transition: none !important; }
    `,
  });
  await expect(page).toHaveScreenshot(name, { fullPage: true });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

Given("the viewport is {int}x{int}", async ({ page }, width: number, height: number) => {
  await page.setViewportSize({ width, height });
});

// ── Navigation ────────────────────────────────────────────────────────────────

When("I visit {string}", async ({ page }, url: string) => {
  await page.goto(url);
});

When("I click enable audio", async ({ page }) => {
  await page.getByRole("button", { name: /enable audio/i }).click();
  await page.waitForTimeout(300);
});

// ── Assertions ────────────────────────────────────────────────────────────────

Then("the page matches snapshot {string}", async ({ page }, name: string) => {
  await shoot(page, name);
});
