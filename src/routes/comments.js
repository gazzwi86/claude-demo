const { readJsonBody, sendJson } = require("../utils/json");
const { sanitizeInput } = require("../utils/validate");
const { ValidationError } = require("../errors");
const { parsePageParams } = require("../utils/pagination");
const { requireSession } = require("../middleware/auth");
const commentsService = require("../services/comments");

function parseId(params, key, label) {
  const id = Number(params[key]);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError(`invalid ${label}`);
  return id;
}

async function createComment(req, res, ctx) {
  requireSession(req);
  const postId = parseId(ctx.params, "id", "post id");
  const body = await readJsonBody(req);
  const safe = { body: sanitizeInput(body.body) };
  const comment = commentsService.createComment(postId, safe, req.user.id);
  sendJson(res, 201, { comment });
}

async function listComments(req, res, ctx) {
  const postId = parseId(ctx.params, "id", "post id");
  const { page, pageSize } = parsePageParams(ctx.query);
  const result = commentsService.listCommentsForPost(postId, { page, pageSize });
  sendJson(res, 200, result);
}

async function deleteComment(req, res, ctx) {
  requireSession(req);
  const id = parseId(ctx.params, "id", "comment id");
  commentsService.deleteComment(id, req.user.id);
  sendJson(res, 204, {});
}

module.exports = { createComment, listComments, deleteComment };
