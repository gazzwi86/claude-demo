const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");
const { resetAll } = require("../src/db/repository");
const authService = require("../src/services/auth");
const { ValidationError, AuthError } = require("../src/errors");

describe("auth service", () => {
  beforeEach(() => resetAll());

  it("registers a user and returns public fields only", () => {
    const user = authService.register({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    });
    assert.strictEqual(user.email, "alice@example.com");
    assert.strictEqual(user.name, "Alice");
    assert.strictEqual(user.role, "user");
    assert.strictEqual(user.passwordHash, undefined);
  });

  it("rejects duplicate email", () => {
    authService.register({ name: "A", email: "a@x.com", password: "password1" });
    assert.throws(
      () => authService.register({ name: "B", email: "a@x.com", password: "password1" }),
      ValidationError,
    );
  });

  it("rejects short passwords", () => {
    assert.throws(
      () => authService.register({ name: "A", email: "a@x.com", password: "short" }),
      ValidationError,
    );
  });

  it("rejects invalid email", () => {
    assert.throws(
      () => authService.register({ name: "A", email: "nope", password: "password1" }),
      ValidationError,
    );
  });

  it("logs in with correct credentials", () => {
    authService.register({ name: "A", email: "a@x.com", password: "password1" });
    const result = authService.login("a@x.com", "password1");
    assert.strictEqual(result.user.email, "a@x.com");
    assert.strictEqual(typeof result.token, "string");
    assert.ok(result.token.length >= 32);
  });

  it("rejects bad credentials", () => {
    authService.register({ name: "A", email: "a@x.com", password: "password1" });
    assert.throws(() => authService.login("a@x.com", "wrong"), AuthError);
    assert.throws(() => authService.login("nobody@x.com", "password1"), AuthError);
  });

  it("me() returns user for valid token", () => {
    authService.register({ name: "A", email: "a@x.com", password: "password1" });
    const { token } = authService.login("a@x.com", "password1");
    const result = authService.me(token);
    assert.strictEqual(result.user.email, "a@x.com");
  });

  it("logout invalidates the token", () => {
    authService.register({ name: "A", email: "a@x.com", password: "password1" });
    const { token } = authService.login("a@x.com", "password1");
    authService.logout(token);
    assert.strictEqual(authService.me(token), null);
  });
});
