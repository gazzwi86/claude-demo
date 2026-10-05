import { test as base } from "playwright-bdd";
import { LoginPage } from "./pages/LoginPage.js";
import { SignupPage } from "./pages/SignupPage.js";
import { StudioPage } from "./pages/StudioPage.js";

// Seeded test user — defined in infra/docker/init/seed.sh, not a real secret.
export const TEST_EMAIL = "test@test.com";
export const TEST_PASS = "testtest"; // min 8 chars per PasswordSchema

type Fixtures = {
  loginPage: LoginPage;
  signupPage: SignupPage;
  studioPage: StudioPage;
  serverHit: { value: boolean };
  loggedIn: void;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  signupPage: async ({ page }, use) => {
    await use(new SignupPage(page));
  },

  studioPage: async ({ page }, use) => {
    await use(new StudioPage(page));
  },

  // Mutable tracker shared across steps within a test to assert no server call was made.
  serverHit: async ({}, use) => {
    await use({ value: false });
  },

  // Navigates to /login, authenticates with the seeded test user, and waits for redirect.
  // Requires pnpm localstack:up && pnpm localstack:seed && pnpm dev.
  loggedIn: async ({ page }, use) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill(TEST_PASS);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/(studio|dashboard)/, { timeout: 10_000 });
    await use();
  },
});

export { expect } from "@playwright/test";
