// Schema smoke tests. Lock in the cross-package contracts that web + api
// both rely on so a careless change here surfaces locally rather than
// in a Playwright run.

import { describe, expect, it } from "vitest";
import {
  CreateLoopSchema,
  LoginSchema,
  PAD_GRID_SIZE,
  SignupSchema,
  UpdateLoopSchema,
} from "./index.js";

const VALID_PWD = "supersecret";
const SHORT_PWD = "tooshrt";

describe("SignupSchema", () => {
  it("accepts a valid signup", () => {
    const result = SignupSchema.safeParse({
      email: "demo@example.com",
      password: VALID_PWD,
      displayName: "Demo",
    });
    expect(result.success).toBe(true);
  });

  it("normalises email to lowercase + trimmed", () => {
    const result = SignupSchema.parse({
      email: "  Demo@EXAMPLE.com ",
      password: VALID_PWD,
      displayName: "Demo",
    });
    expect(result.email).toBe("demo@example.com");
  });

  it("rejects a 7-char password", () => {
    const result = SignupSchema.safeParse({
      email: "demo@example.com",
      password: SHORT_PWD,
      displayName: "Demo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty display name", () => {
    const result = SignupSchema.safeParse({
      email: "demo@example.com",
      password: VALID_PWD,
      displayName: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("LoginSchema", () => {
  it("accepts the same credentials as signup minus displayName", () => {
    const result = LoginSchema.safeParse({
      email: "demo@example.com",
      password: VALID_PWD,
    });
    expect(result.success).toBe(true);
  });
});

describe("CreateLoopSchema", () => {
  const valid = {
    name: "test",
    durationMs: 4000,
    sampleRate: 48_000,
    bpm: 120,
    mimeType: "audio/webm" as const,
    sizeBytes: 12_345,
  };

  it("accepts a valid create-loop payload", () => {
    expect(CreateLoopSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts bpm = null (unmeasured loops are allowed)", () => {
    expect(CreateLoopSchema.safeParse({ ...valid, bpm: null }).success).toBe(true);
  });

  it("rejects unknown mime types", () => {
    expect(
      CreateLoopSchema.safeParse({ ...valid, mimeType: "audio/aac" }).success,
    ).toBe(false);
  });

  it("rejects loops longer than the configured maximum", () => {
    expect(
      CreateLoopSchema.safeParse({ ...valid, durationMs: 60 * 60 * 1000 }).success,
    ).toBe(false);
  });
});

describe("UpdateLoopSchema", () => {
  it("accepts a partial update with just isPublic", () => {
    expect(UpdateLoopSchema.safeParse({ isPublic: true }).success).toBe(true);
  });

  it("accepts the empty object (no-op patch)", () => {
    expect(UpdateLoopSchema.safeParse({}).success).toBe(true);
  });
});

describe("PAD_GRID_SIZE", () => {
  it("is 16 — the studio is built around this constant", () => {
    expect(PAD_GRID_SIZE).toBe(16);
  });
});
