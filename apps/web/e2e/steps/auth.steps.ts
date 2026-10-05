import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { test } from "../fixtures.js";

const { Given, When, Then } = createBdd(test);

// ── Navigation ────────────────────────────────────────────────────────────────

Given("I am on the login page", async ({ loginPage }) => {
  await loginPage.goto();
});

Given("I am on the signup page", async ({ signupPage }) => {
  await signupPage.goto();
});

Given("I am on the home page", async ({ page }) => {
  await page.goto("/");
});

Given("I navigate to {string}", async ({ page }, url: string) => {
  await page.goto(url);
});

When("I navigate to {string}", async ({ page }, url: string) => {
  await page.goto(url);
});

// ── Network stubs (behavioural tests) ─────────────────────────────────────────

Given("the login API is blocked", async ({ loginPage }) => {
  await loginPage.blockLoginApi();
});

Given("the signup endpoint is intercepted", async ({ signupPage, serverHit }) => {
  await signupPage.interceptSignup(() => {
    serverHit.value = true;
  });
});

Given("the signup endpoint returns a 409 {string} error", async ({ signupPage }, message: string) => {
  await signupPage.stubSignupError(409, {
    error: { code: "duplicate_email", message },
  });
});

// ── Form actions ──────────────────────────────────────────────────────────────

When("I enter {string} as the email", async ({ loginPage, signupPage, page }, value: string) => {
  await page.getByLabel("Email").fill(value);
});

When("I enter {string} as the password", async ({ page }, value: string) => {
  await page.getByLabel("Password").fill(value);
});

When("I enter {string} as the display name", async ({ page }, value: string) => {
  await page.getByLabel("Display name").fill(value);
});

When("I submit the login form", async ({ loginPage }) => {
  await loginPage.signInButton.click();
});

When("I submit the signup form", async ({ signupPage }) => {
  await signupPage.page.getByRole("button", { name: "Create account" }).click();
});

When("I log in as the test user", async ({ loginPage }, loggedIn: void) => {
  // loggedIn fixture handles navigation + credentials + redirect wait
});

When("I press Tab", async ({ page }) => {
  await page.keyboard.press("Tab");
});

// ── Live auth actions ─────────────────────────────────────────────────────────

Given("I am logged in as the test user", async ({ loggedIn }) => {
  // loggedIn fixture runs the full login flow
});

When("I sign out from the account page", async ({ page }) => {
  await page.goto("/account");
  await page.getByRole("button", { name: /sign.?out/i }).click();
});

// ── Assertions — login page ───────────────────────────────────────────────────

Then("the page heading contains {string}", async ({ loginPage }, text: string) => {
  await expect(loginPage.heading).toContainText(text);
});

Then("the Email field is visible", async ({ page }) => {
  await expect(page.getByLabel("Email")).toBeVisible();
});

Then("the Password field is visible", async ({ page }) => {
  await expect(page.getByLabel("Password")).toBeVisible();
});

Then("the Sign in button is enabled", async ({ loginPage }) => {
  await expect(loginPage.signInButton).toBeEnabled();
});

Then("there is a {string} link to {string}", async ({ page }, label: string, href: string) => {
  await expect(page.getByRole("link", { name: label })).toHaveAttribute("href", href);
});

Then("an error alert contains {string}", async ({ page }, text: string) => {
  const alert = page.getByRole("alert").filter({ hasText: /\S/ }).first();
  await expect(alert).toContainText(new RegExp(text, "i"));
});

Then("the Email field has focus", async ({ page }) => {
  await expect(page.getByLabel("Email")).toBeFocused();
});

// ── Assertions — signup page ──────────────────────────────────────────────────

Then("the Password field is marked invalid", async ({ signupPage }) => {
  await expect(signupPage.passwordField).toHaveAttribute("aria-invalid", "true");
});

Then("the signup endpoint was not called", async ({ serverHit }) => {
  expect(serverHit.value).toBe(false);
});

// ── Assertions — URL / redirect ───────────────────────────────────────────────

Then("I am redirected to the studio or dashboard", async ({ page }) => {
  await expect(page).toHaveURL(/\/(studio|dashboard)/, { timeout: 10_000 });
});

Then("I am not on the studio or dashboard", async ({ page }) => {
  await expect(page).not.toHaveURL(/\/(studio|dashboard)/);
});

Then("an error alert is visible", async ({ page }) => {
  const alert = page.getByRole("alert").filter({ hasText: /\S/ }).first();
  await expect(alert).toBeVisible({ timeout: 5_000 });
});

Then("I am on the studio page", async ({ page }) => {
  await expect(page).toHaveURL("/studio", { timeout: 5_000 });
  await expect(page.getByRole("main")).toBeVisible();
});

Then("I am redirected to {string}", async ({ page }, url: string) => {
  await expect(page).toHaveURL(new RegExp(url), { timeout: 5_000 });
});

Then("navigating to {string} redirects to {string}", async ({ page }, from: string, to: string) => {
  await page.goto(from);
  await expect(page).toHaveURL(new RegExp(to), { timeout: 5_000 });
});
