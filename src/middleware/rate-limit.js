const { RateLimitError } = require("../errors");
const { config } = require("../config");

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || config.rateLimit.windowMs;
  const max = options.max || config.rateLimit.max;
  const buckets = new Map();

  function getClientKey(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0].trim();
    }
    return (req.socket && req.socket.remoteAddress) || "unknown";
  }

  function check(req, now = Date.now()) {
    const key = getClientKey(req);
    const cutoff = now - windowMs;
    const timestamps = (buckets.get(key) || []).filter((t) => t > cutoff);
    if (timestamps.length >= max) {
      throw new RateLimitError(`rate limit exceeded (${max} per ${windowMs}ms)`);
    }
    timestamps.push(now);
    buckets.set(key, timestamps);
    return { remaining: max - timestamps.length, limit: max, windowMs };
  }

  function reset() {
    buckets.clear();
  }

  return { check, reset, getClientKey };
}

module.exports = { createRateLimiter };
