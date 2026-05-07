const { readJsonBody, sendJson } = require("../utils/json");
const { parseIntParam } = require("../utils/validate");
const { parsePageParams } = require("../utils/pagination");
const { requireSession } = require("../middleware/auth");
const commentsService = require("../services/comments");

async function createComment(req, res, ctx) {
  requireSession(req);
  const postId = parseIntParam(ctx.params.id, "post id");
  const body = await readJsonBody(req);
  const comment = commentsService.createComment(postId, body, req.user.id);
  sendJson(res, 201, { comment });
}

async function listComments(req, res, ctx) {
  const postId = parseIntParam(ctx.params.id, "post id");
  const { page, pageSize } = parsePageParams(ctx.query);
  const result = commentsService.listCommentsForPost(postId, { page, pageSize });
  sendJson(res, 200, result);
}

async function deleteComment(req, res, ctx) {
  requireSession(req);
  const id = parseIntParam(ctx.params.id, "comment id");
  commentsService.deleteComment(id, req.user.id);
  sendJson(res, 204, {});
}

module.exports = { createComment, listComments, deleteComment };
