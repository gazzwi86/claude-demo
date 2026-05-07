const { sendJson } = require("../utils/json");
const { parsePageParams } = require("../utils/pagination");
const searchService = require("../services/search");

async function search(req, res, ctx) {
  const { page, pageSize } = parsePageParams(ctx.query);
  const query = ctx.query.q || "";
  const result = searchService.searchPosts(query, { page, pageSize });
  sendJson(res, 200, result);
}

module.exports = { search };
