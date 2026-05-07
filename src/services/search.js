const { ValidationError } = require("../errors");
const { repositories } = require("../db/repository");
const { paginate, buildPaginatedResponse } = require("../utils/pagination");

function searchPosts(query, { page = 1, pageSize = 20 } = {}) {
  if (typeof query !== "string" || query.trim().length < 2) {
    throw new ValidationError("search query must be at least 2 characters");
  }
  const needle = query.trim().toLowerCase();
  const matches = repositories.posts
    .findAll((p) => {
      const haystack = `${p.title} ${p.body}`.toLowerCase();
      return haystack.includes(needle);
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const total = matches.length;
  const items = paginate(matches, page, pageSize);
  return buildPaginatedResponse(items, page, total, pageSize);
}

module.exports = { searchPosts };
