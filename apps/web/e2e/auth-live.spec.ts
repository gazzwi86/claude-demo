// Live integration tests — hit the real API on :3001 + DynamoDB Local.
// Requires the full local stack to be running:
//   pnpm localstack:up && pnpm localstack:seed && pnpm dev
//
// Test user seeded by infra/docker/init/seed.sh: test@test.com / test

import { test, expect } from "@playwright/test";

const TEST_EMAIL = "test@test.com";
const TEST_PASS = "testtest"; // min 8 chars per PasswordSchema

test.describe("live auth flow", () => {
  test("login with seeded test user redirects to studio", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill(TEST_PASS);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/(studio|dashboard)/, { timeout: 10_000 });
  });

  test("login with wrong password shows 401 error", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert").filter({ hasText: /\S/ }).first()).toBeVisible({
      timeout: 5_000,
    });
    await expect(page).not.toHaveURL(/\/(studio|dashboard)/);
  });

  test("authenticated user can reach /studio", async ({ page }) => {
    // Log in first
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill(TEST_PASS);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/(studio|dashboard)/, { timeout: 10_000 });

    // Navigate to studio directly
    await page.goto("/studio");
    await expect(page).toHaveURL("/studio", { timeout: 5_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("unauthenticated user is redirected away from /studio", async ({ page }) => {
    await page.goto("/studio");
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    // Log in
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill(TEST_PASS);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/(studio|dashboard)/, { timeout: 10_000 });

    // Log out via the account page (Sign out button lives there)
    await page.goto("/account");
    await page.getByRole("button", { name: /sign.?out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });

    // Confirm /studio is now protected again
    await page.goto("/studio");
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
