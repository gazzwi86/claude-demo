const { readJsonBody, sendJson } = require("../utils/json");
const { sanitizeInput } = require("../utils/validate");
const { ValidationError } = require("../errors");
const { requireSession } = require("../middleware/auth");
const tagsService = require("../services/tags");

async function listTags(req, res) {
  const tags = tagsService.listTags();
  sendJson(res, 200, { tags });
}

async function addTagToPost(req, res, ctx) {
  requireSession(req);
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError("invalid post id");
  const body = await readJsonBody(req);
  const name = sanitizeInput(body.name);
  if (typeof name !== "string" || name.trim().length < 2) {
    throw new ValidationError("tag name must be at least 2 characters");
  }
  const result = tagsService.addTagToPost(id, name);
  sendJson(res, result.created ? 201 : 200, { tag: result.tag, postId: id });
}

module.exports = { listTags, addTagToPost };
