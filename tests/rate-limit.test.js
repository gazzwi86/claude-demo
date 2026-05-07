const { describe, it } = require("node:test");
const assert = require("node:assert");
const { createRateLimiter } = require("../src/middleware/rate-limit");
const { RateLimitError } = require("../src/errors");

function makeReq(ip = "1.2.3.4") {
  return { headers: {}, socket: { remoteAddress: ip } };
}

describe("rate limiter", () => {
  it("allows requests under the limit", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 3 });
    const req = makeReq();
    const r1 = limiter.check(req, 1000);
    const r2 = limiter.check(req, 1100);
    assert.strictEqual(r1.remaining, 2);
    assert.strictEqual(r2.remaining, 1);
  });

  it("throws RateLimitError when exceeded", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
    const req = makeReq();
    limiter.check(req, 1000);
    limiter.check(req, 1100);
    assert.throws(() => limiter.check(req, 1200), RateLimitError);
  });

  it("expires entries outside the window", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
    const req = makeReq();
    limiter.check(req, 1000);
    limiter.check(req, 1100);
    // 2500 is well past the 1000ms window relative to first two
    const r3 = limiter.check(req, 2500);
    assert.strictEqual(r3.remaining, 1);
  });

  it("isolates buckets per IP", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    limiter.check(makeReq("1.1.1.1"), 1000);
    // different IP — should not throw
    const r = limiter.check(makeReq("2.2.2.2"), 1000);
    assert.strictEqual(r.remaining, 0);
  });

  it("uses x-forwarded-for when present", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    const req = { headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1" }, socket: {} };
    assert.strictEqual(limiter.getClientKey(req), "9.9.9.9");
    limiter.check(req, 1000);
    assert.throws(() => limiter.check(req, 1100), RateLimitError);
  });
});
