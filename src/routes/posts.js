const { readJsonBody, sendJson } = require("../utils/json");
const { parseIntParam } = require("../utils/validate");
const { parsePageParams } = require("../utils/pagination");
const { requireSession } = require("../middleware/auth");
const postsService = require("../services/posts");

async function listPosts(req, res, ctx) {
  const { page, pageSize } = parsePageParams(ctx.query);
  const result = postsService.listPosts({ page, pageSize });
  sendJson(res, 200, result);
}

async function getPost(req, res, ctx) {
  const id = parseIntParam(ctx.params.id, "post id");
  const post = postsService.getPost(id);
  sendJson(res, 200, { post });
}

async function createPost(req, res) {
  requireSession(req);
  const body = await readJsonBody(req);
  const post = postsService.createPost(body, req.user.id);
  sendJson(res, 201, { post });
}

async function updatePost(req, res, ctx) {
  requireSession(req);
  const id = parseIntParam(ctx.params.id, "post id");
  const body = await readJsonBody(req);
  const patch = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.body === "string") patch.body = body.body;
  if (typeof body.published === "boolean") patch.published = body.published;
  const post = postsService.updatePost(id, patch, req.user.id);
  sendJson(res, 200, { post });
}

async function deletePost(req, res, ctx) {
  requireSession(req);
  const id = parseIntParam(ctx.params.id, "post id");
  postsService.deletePost(id, req.user.id);
  sendJson(res, 204, {});
}

module.exports = { listPosts, getPost, createPost, updatePost, deletePost };
