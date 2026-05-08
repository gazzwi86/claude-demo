// Behavioural smoke for the public auth pages. These don't require the
// api to be running — they exercise the page rendering, form-level
// validation (zod) and the offline error path of the api client.

import { test, expect } from "@playwright/test";

test.describe("login page", () => {
  test("renders all expected controls", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Looper/);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
    await expect(page.getByRole("link", { name: /Create an account/ })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  test("shows a server-error message when the api is unreachable", async ({ page }) => {
    // Block requests to the api so we exercise the catch-all error path.
    await page.route("**/auth/login", (route) => route.abort("failed"));
    await page.goto("/login");
    await page.getByLabel("Email").fill("ghost@example.com");
    await page.getByLabel("Password").fill("supersecret");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /\S/ }).first()).toContainText(/Couldn't reach the server/);
  });

  test("focuses email on tab from page load (a11y)", async ({ page }) => {
    await page.goto("/login");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Email")).toBeFocused();
  });
});

test.describe("signup page", () => {
  test("client-side validates short passwords without hitting the network", async ({ page }) => {
    let serverHit = false;
    await page.route("**/auth/signup", (route) => {
      serverHit = true;
      return route.abort();
    });
    await page.goto("/signup");
    await page.getByLabel("Display name").fill("Demo");
    await page.getByLabel("Email").fill("demo@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    // Zod's default message for min(8) is "String must contain at least 8 character(s)"
    await expect(page.getByLabel("Password")).toHaveAttribute("aria-invalid", "true");
    expect(serverHit).toBe(false);
  });

  test("shows server error on duplicate email", async ({ page }) => {
    await page.route("**/auth/signup", (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "duplicate_email", message: "Email taken" } }),
      }),
    );
    await page.goto("/signup");
    await page.getByLabel("Display name").fill("Demo");
    await page.getByLabel("Email").fill("taken@example.com");
    await page.getByLabel("Password").fill("supersecret");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /\S/ }).first()).toContainText(/already in use/i);
  });
});

test.describe("home page", () => {
  test("links to login and signup", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    await expect(page.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup");
  });
});
