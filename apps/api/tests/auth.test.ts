// Auth integration tests using Fastify's app.inject() (no real network).
// Backed by the in-process DynamoDB stub via DDB_USE_STUB=1 (set in
// tests/setup.ts). Deterministic, no Docker required.

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../src/server.js";
import { _truncateUsers } from "../src/db/users.js";
import { AUTH_COOKIE_NAME } from "../src/services/authService.js";

const FIXTURE_PWD = "supersecret";
const FIXTURE_BAD_PWD = "definitely-not-it";
const FIXTURE_EMAIL = "demo@example.com";
const FIXTURE_NAME = "Demo";

let app: FastifyInstance;

async function getApp(): Promise<FastifyInstance> {
  if (!app) {
    app = await buildServer();
    await app.ready();
  }
  return app;
}

afterAll(async () => {
  if (app) await app.close();
});

beforeEach(async () => {
  await _truncateUsers();
});

const validSignup = () => ({
  email: FIXTURE_EMAIL,
  displayName: FIXTURE_NAME,
  password: FIXTURE_PWD,
});

function authCookie(setCookieHeader: string | string[] | undefined): string | undefined {
  const headers = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  for (const header of headers) {
    if (header.startsWith(`${AUTH_COOKIE_NAME}=`)) {
      return header.split(";")[0];
    }
  }
  return undefined;
}

describe("POST /auth/signup", () => {
  it("creates a user, sets the auth cookie, returns the public user", async () => {
    const app = await getApp();
    const res = await app.inject({ method: "POST", url: "/auth/signup", payload: validSignup() });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { user: { id: string; email: string; displayName: string } };
    expect(body.user.email).toBe(FIXTURE_EMAIL);
    expect(body.user.displayName).toBe(FIXTURE_NAME);
    expect(body.user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(authCookie(res.headers["set-cookie"])).toMatch(/^looper_auth=/);
    expect(JSON.stringify(body)).not.toMatch(/passwordHash/);
  });

  it("rejects a duplicate email with 409", async () => {
    const app = await getApp();
    await app.inject({ method: "POST", url: "/auth/signup", payload: validSignup() });
    const res = await app.inject({ method: "POST", url: "/auth/signup", payload: validSignup() });
    expect(res.statusCode).toBe(409);
    const body = res.json() as { error: { code: string } };
    expect(body.error.code).toBe("duplicate_email");
  });

  it("rejects a short password with 422", async () => {
    const app = await getApp();
    const payload = { ...validSignup(), password: "tooshrt" };
    const res = await app.inject({ method: "POST", url: "/auth/signup", payload });
    expect(res.statusCode).toBe(422);
    const body = res.json() as { error: { code: string } };
    expect(body.error.code).toBe("validation_failed");
  });

  it("rejects malformed email with 422", async () => {
    const app = await getApp();
    const payload = { ...validSignup(), email: "not-an-email" };
    const res = await app.inject({ method: "POST", url: "/auth/signup", payload });
    expect(res.statusCode).toBe(422);
  });
});

describe("POST /auth/login", () => {
  it("logs in an existing user and sets a fresh cookie", async () => {
    const app = await getApp();
    await app.inject({ method: "POST", url: "/auth/signup", payload: validSignup() });

    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: FIXTURE_EMAIL, password: FIXTURE_PWD },
    });
    expect(res.statusCode).toBe(200);
    expect(authCookie(res.headers["set-cookie"])).toMatch(/^looper_auth=/);
  });

  it("rejects a wrong password with 401", async () => {
    const app = await getApp();
    await app.inject({ method: "POST", url: "/auth/signup", payload: validSignup() });
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: FIXTURE_EMAIL, password: FIXTURE_BAD_PWD },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects an unknown email with 401", async () => {
    const app = await getApp();
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "ghost@example.com", password: FIXTURE_PWD },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /auth/me", () => {
  it("requires the auth cookie (401 without)", async () => {
    const app = await getApp();
    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);
  });

  it("returns the current user when the cookie is valid", async () => {
    const app = await getApp();
    const signup = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: validSignup(),
    });
    const cookie = authCookie(signup.headers["set-cookie"]);
    expect(cookie).toBeDefined();

    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { cookie: cookie! },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { user: { email: string } };
    expect(body.user.email).toBe(FIXTURE_EMAIL);
  });

  it("rejects a tampered cookie (401)", async () => {
    const app = await getApp();
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { cookie: `${AUTH_COOKIE_NAME}=not.a.valid.token` },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  it("clears the cookie", async () => {
    const app = await getApp();
    const res = await app.inject({ method: "POST", url: "/auth/logout" });
    expect(res.statusCode).toBe(204);
    const setCookie = res.headers["set-cookie"];
    const headers = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
    expect(headers.join("\n")).toMatch(/looper_auth=/);
    expect(headers.join("\n")).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);
  });
});
