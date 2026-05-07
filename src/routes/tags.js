const { readJsonBody, sendJson } = require("../utils/json");
const { parseIntParam } = require("../utils/validate");
const { requireSession } = require("../middleware/auth");
const tagsService = require("../services/tags");

async function listTags(req, res) {
  const tags = tagsService.listTags();
  sendJson(res, 200, { tags });
}

async function addTagToPost(req, res, ctx) {
  requireSession(req);
  const id = parseIntParam(ctx.params.id, "post id");
  const body = await readJsonBody(req);
  const result = tagsService.addTagToPost(id, body.name);
  sendJson(res, result.created ? 201 : 200, { tag: result.tag, postId: id });
}

module.exports = { listTags, addTagToPost };
