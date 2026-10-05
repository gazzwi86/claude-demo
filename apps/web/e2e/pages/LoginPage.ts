import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: "Sign in" }).click();
  }

  async blockLoginApi() {
    await this.page.route("**/auth/login", (route) => route.abort("failed"));
  }

  get heading() {
    return this.page.getByRole("heading", { level: 1 });
  }

  get emailField() {
    return this.page.getByLabel("Email");
  }

  get passwordField() {
    return this.page.getByLabel("Password");
  }

  get signInButton() {
    return this.page.getByRole("button", { name: "Sign in" });
  }

  get createAccountLink() {
    return this.page.getByRole("link", { name: /Create an account/ });
  }

  get errorAlert() {
    return this.page.getByRole("alert").filter({ hasText: /\S/ }).first();
  }
}
