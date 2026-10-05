import type { Page } from "@playwright/test";

export class SignupPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/signup");
  }

  async signup(name: string, email: string, password: string) {
    await this.page.getByLabel("Display name").fill(name);
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: "Create account" }).click();
  }

  async interceptSignup(onCall: () => void) {
    await this.page.route("**/auth/signup", (route) => {
      onCall();
      return route.abort();
    });
  }

  async stubSignupError(status: number, body: object) {
    await this.page.route("**/auth/signup", (route) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      }),
    );
  }

  get passwordField() {
    return this.page.getByLabel("Password");
  }

  get errorAlert() {
    return this.page.getByRole("alert").filter({ hasText: /\S/ }).first();
  }
}
