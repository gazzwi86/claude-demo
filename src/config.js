const config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || "0.0.0.0",
  env: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
  rateLimit: {
    windowMs: Number(process.env.RATE_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_MAX) || 100,
  },
  cache: {
    posts: { maxSize: Number(process.env.POSTS_CACHE) || 200 },
    feed: { maxSize: Number(process.env.FEED_CACHE) || 100 },
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  },
  session: {
    ttlMs: Number(process.env.SESSION_TTL_MS) || 24 * 60 * 60 * 1000,
  },
};

module.exports = { config };
