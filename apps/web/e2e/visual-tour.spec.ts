// Visual tour of the studio. One spec per page (and a few interaction
// states) — Playwright takes a fresh snapshot at desktop + mobile each.
//
// Run with: pnpm e2e:visual
// Update reference snapshots: pnpm e2e:update

import { expect, test, type Page } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

async function shoot(page: Page, name: string) {
  await page.waitForLoadState("networkidle");
  // Hide caret + animations so snapshots are stable.
  await page.addStyleTag({
    content: `
      * { caret-color: transparent !important; }
      *, *::before, *::after { animation: none !important; transition: none !important; }
    `,
  });
  await expect(page).toHaveScreenshot(name, { fullPage: true });
}

for (const [variant, viewport] of [
  ["desktop", DESKTOP],
  ["mobile", MOBILE],
] as const) {
  test.describe(`@visual ${variant}`, () => {
    test.use({ viewport });

    test("home page", async ({ page }) => {
      await page.goto("/");
      await shoot(page, `home-${variant}.png`);
    });

    test("login page", async ({ page }) => {
      await page.goto("/login");
      await shoot(page, `login-${variant}.png`);
    });

    test("signup page", async ({ page }) => {
      await page.goto("/signup");
      await shoot(page, `signup-${variant}.png`);
    });

    test("studio page (gated)", async ({ page }) => {
      await page.goto("/studio");
      // Page renders the "Enable audio" gate (browsers block AudioContext
      // autoplay). We snapshot that state.
      await shoot(page, `studio-gated-${variant}.png`);
    });

    test("studio page (active)", async ({ page }) => {
      await page.goto("/studio");
      await page.getByRole("button", { name: /enable audio/i }).click();
      // Wait for the layout to settle.
      await page.waitForTimeout(300);
      await shoot(page, `studio-active-${variant}.png`);
    });

    test("dashboard page (offline / 401 state)", async ({ page }) => {
      await page.goto("/dashboard");
      // Without an api running the loops fetch fails; we capture that error
      // state since it must look intentional, not broken.
      await page.waitForTimeout(500);
      await shoot(page, `dashboard-${variant}.png`);
    });
  });
}
