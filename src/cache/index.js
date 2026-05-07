const { LRUCache } = require("./lru");
const { config } = require("../config");

const postsCache = new LRUCache(config.cache.posts.maxSize);
const feedCache = new LRUCache(config.cache.feed.maxSize);

function clearAll() {
  postsCache.clear();
  feedCache.clear();
}

module.exports = { postsCache, feedCache, clearAll };
