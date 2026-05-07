const { repositories } = require("../db/repository");
const { feedCache } = require("../cache");

function buildFeed(userId, { limit = 20 } = {}) {
  const cacheKey = `feed:${userId}:${limit}`;
  const cached = feedCache.get(cacheKey);
  if (cached) return cached;

  const posts = repositories.posts
    .findAll((p) => p.published === true)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);

  const feed = {
    userId,
    items: posts,
    generatedAt: new Date().toISOString(),
  };
  feedCache.set(cacheKey, feed);
  return feed;
}

function invalidateFeed(userId) {
  if (userId == null) {
    feedCache.clear();
    return;
  }
  for (const key of Array.from(feedCache.map.keys())) {
    if (typeof key === "string" && key.startsWith(`feed:${userId}:`)) {
      feedCache.delete(key);
    }
  }
}

module.exports = { buildFeed, invalidateFeed };
