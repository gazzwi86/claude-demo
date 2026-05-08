// Loops integration tests via Fastify app.inject() + the in-process
// DynamoDB + S3 stubs.

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance, InjectOptions } from "fastify";
import { buildServer } from "../src/server.js";
import { _truncateUsers } from "../src/db/users.js";
import { _truncateLoops } from "../src/db/loops.js";
import { AUTH_COOKIE_NAME } from "../src/services/authService.js";

const FIXTURE_PWD = "supersecret";

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
  await _truncateLoops();
});

function authCookie(setCookieHeader: string | string[] | undefined): string | undefined {
  const headers = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  for (const header of headers) {
    if (header.startsWith(`${AUTH_COOKIE_NAME}=`)) return header.split(";")[0];
  }
  return undefined;
}

async function signupAndCookie(
  email: string,
  displayName = "Demo",
): Promise<string> {
  const app = await getApp();
  const res = await app.inject({
    method: "POST",
    url: "/auth/signup",
    payload: { email, displayName, password: FIXTURE_PWD },
  });
  expect(res.statusCode).toBe(200);
  const cookie = authCookie(res.headers["set-cookie"]);
  if (!cookie) throw new Error("no cookie set");
  return cookie;
}

const validCreate = (overrides: Partial<Record<string, unknown>> = {}) => ({
  name: "My loop",
  durationMs: 4_000,
  sampleRate: 48_000,
  bpm: 120,
  mimeType: "audio/webm",
  sizeBytes: 12_345,
  ...overrides,
});

function as(cookie: string, opts: InjectOptions): InjectOptions {
  const existing = (opts.headers ?? {}) as Record<string, string>;
  return { ...opts, headers: { ...existing, cookie } };
}

describe("POST /loops", () => {
  it("creates a loop and returns a presigned upload URL", async () => {
    const app = await getApp();
    const cookie = await signupAndCookie("a@example.com");
    const res = await app.inject(
      as(cookie, { method: "POST", url: "/loops", payload: validCreate() }),
    );
    expect(res.statusCode).toBe(201);
    const body = res.json() as {
      loop: { id: string; name: string; s3Key: string; isPublic: boolean };
      uploadUrl: string;
    };
    expect(body.loop.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.loop.name).toBe("My loop");
    expect(body.loop.isPublic).toBe(false);
    expect(body.loop.s3Key).toMatch(/^users\/[0-9a-f-]{36}\/loops\/[0-9a-f-]{36}\.webm$/);
    expect(body.uploadUrl).toMatch(/^http:\/\/stub\.local\//);
    expect(body.uploadUrl).toMatch(/op=put/);
  });

  it("requires auth (401)", async () => {
    const app = await getApp();
    const res = await app.inject({ method: "POST", url: "/loops", payload: validCreate() });
    expect(res.statusCode).toBe(401);
  });

  it("rejects an invalid mime type with 422", async () => {
    const app = await getApp();
    const cookie = await signupAndCookie("a@example.com");
    const res = await app.inject(
      as(cookie, {
        method: "POST",
        url: "/loops",
        payload: validCreate({ mimeType: "audio/aac" }),
      }),
    );
    expect(res.statusCode).toBe(422);
  });

  it("rejects oversized loops with 422", async () => {
    const app = await getApp();
    const cookie = await signupAndCookie("a@example.com");
    const res = await app.inject(
      as(cookie, {
        method: "POST",
        url: "/loops",
        payload: validCreate({ sizeBytes: 1024 * 1024 * 1024 }),
      }),
    );
    expect(res.statusCode).toBe(422);
  });
});

describe("GET /loops", () => {
  it("returns only the user's own loops", async () => {
    const app = await getApp();
    const aliceCookie = await signupAndCookie("alice@example.com", "Alice");
    const bobCookie = await signupAndCookie("bob@example.com", "Bob");

    await app.inject(as(aliceCookie, { method: "POST", url: "/loops", payload: validCreate({ name: "alice-loop" }) }));
    await app.inject(as(bobCookie, { method: "POST", url: "/loops", payload: validCreate({ name: "bob-loop" }) }));

    const aliceList = await app.inject(as(aliceCookie, { method: "GET", url: "/loops" }));
    const aliceBody = aliceList.json() as { loops: { name: string }[] };
    expect(aliceBody.loops.map((l) => l.name)).toEqual(["alice-loop"]);

    const bobList = await app.inject(as(bobCookie, { method: "GET", url: "/loops" }));
    const bobBody = bobList.json() as { loops: { name: string }[] };
    expect(bobBody.loops.map((l) => l.name)).toEqual(["bob-loop"]);
  });

  it("requires auth (401)", async () => {
    const app = await getApp();
    const res = await app.inject({ method: "GET", url: "/loops" });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /loops/:id", () => {
  it("returns the loop for its owner", async () => {
    const app = await getApp();
    const cookie = await signupAndCookie("a@example.com");
    const create = await app.inject(as(cookie, { method: "POST", url: "/loops", payload: validCreate() }));
    const id = (create.json() as { loop: { id: string } }).loop.id;

    const res = await app.inject(as(cookie, { method: "GET", url: `/loops/${id}` }));
    expect(res.statusCode).toBe(200);
    expect((res.json() as { loop: { id: string } }).loop.id).toBe(id);
  });

  it("returns 404 when the loop is owned by someone else (no cross-user enumeration)", async () => {
    const app = await getApp();
    const aliceCookie = await signupAndCookie("alice@example.com");
    const bobCookie = await signupAndCookie("bob@example.com");
    const create = await app.inject(
      as(aliceCookie, { method: "POST", url: "/loops", payload: validCreate() }),
    );
    const id = (create.json() as { loop: { id: string } }).loop.id;

    // Bob asks for Alice's loop. The route looks up by Bob's pk, so it's
    // a 404 (treats other users' loops as if they don't exist).
    const res = await app.inject(as(bobCookie, { method: "GET", url: `/loops/${id}` }));
    expect(res.statusCode).toBe(404);
  });
});

describe("PATCH /loops/:id", () => {
  it("renames a loop", async () => {
    const app = await getApp();
    const cookie = await signupAndCookie("a@example.com");
    const create = await app.inject(as(cookie, { method: "POST", url: "/loops", payload: validCreate() }));
    const id = (create.json() as { loop: { id: string } }).loop.id;

    const res = await app.inject(
      as(cookie, { method: "PATCH", url: `/loops/${id}`, payload: { name: "Renamed" } }),
    );
    expect(res.statusCode).toBe(200);
    expect((res.json() as { loop: { name: string } }).loop.name).toBe("Renamed");
  });

  it("returns 404 when patching a missing loop", async () => {
    const app = await getApp();
    const cookie = await signupAndCookie("a@example.com");
    const res = await app.inject(
      as(cookie, {
        method: "PATCH",
        url: "/loops/00000000-0000-0000-0000-000000000000",
        payload: { name: "x" },
      }),
    );
    expect(res.statusCode).toBe(404);
  });
});

describe("GET /loops/:id/download-url", () => {
  it("returns a presigned GET URL", async () => {
    const app = await getApp();
    const cookie = await signupAndCookie("a@example.com");
    const create = await app.inject(as(cookie, { method: "POST", url: "/loops", payload: validCreate() }));
    const id = (create.json() as { loop: { id: string } }).loop.id;

    const res = await app.inject(as(cookie, { method: "GET", url: `/loops/${id}/download-url` }));
    expect(res.statusCode).toBe(200);
    const body = res.json() as { downloadUrl: string };
    expect(body.downloadUrl).toMatch(/^http:\/\/stub\.local\//);
    expect(body.downloadUrl).toMatch(/op=get/);
  });
});

describe("DELETE /loops/:id", () => {
  it("deletes the loop and is idempotent", async () => {
    const app = await getApp();
    const cookie = await signupAndCookie("a@example.com");
    const create = await app.inject(as(cookie, { method: "POST", url: "/loops", payload: validCreate() }));
    const id = (create.json() as { loop: { id: string } }).loop.id;

    const first = await app.inject(as(cookie, { method: "DELETE", url: `/loops/${id}` }));
    expect(first.statusCode).toBe(204);

    // Second delete: idempotent (also 204; service swallows NotFound).
    const second = await app.inject(as(cookie, { method: "DELETE", url: `/loops/${id}` }));
    expect(second.statusCode).toBe(204);

    const after = await app.inject(as(cookie, { method: "GET", url: `/loops/${id}` }));
    expect(after.statusCode).toBe(404);
  });
});

describe("GET /loops/public", () => {
  it("is open (no auth required) and lists isPublic=true loops only", async () => {
    const app = await getApp();
    const cookie = await signupAndCookie("a@example.com");
    const created = await app.inject(as(cookie, { method: "POST", url: "/loops", payload: validCreate({ name: "private" }) }));
    const idPrivate = (created.json() as { loop: { id: string } }).loop.id;

    // Mark a second one public.
    const create2 = await app.inject(as(cookie, { method: "POST", url: "/loops", payload: validCreate({ name: "public" }) }));
    const idPublic = (create2.json() as { loop: { id: string } }).loop.id;
    await app.inject(
      as(cookie, { method: "PATCH", url: `/loops/${idPublic}`, payload: { isPublic: true } }),
    );

    const res = await app.inject({ method: "GET", url: "/loops/public" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { loops: { id: string; name: string; isPublic: boolean }[] };
    expect(body.loops.map((l) => l.id)).toEqual([idPublic]);
    expect(body.loops.every((l) => l.isPublic)).toBe(true);
    expect(body.loops.find((l) => l.id === idPrivate)).toBeUndefined();
  });
});
