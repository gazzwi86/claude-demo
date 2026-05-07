const { sendJson } = require("../utils/json");
const { requireSession } = require("../middleware/auth");
const feedService = require("../services/feed");

async function getFeed(req, res, ctx) {
  requireSession(req);
  const limit = Math.min(50, Math.max(1, Number(ctx.query.limit) || 20));
  const feed = feedService.buildFeed(req.user.id, { limit });
  sendJson(res, 200, feed);
}

module.exports = { getFeed };
