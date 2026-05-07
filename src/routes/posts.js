const { readJsonBody, sendJson } = require("../utils/json");
const { sanitizeInput } = require("../utils/validate");
const { ValidationError } = require("../errors");
const { parsePageParams } = require("../utils/pagination");
const { requireSession } = require("../middleware/auth");
const postsService = require("../services/posts");

function parsePostId(params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError("invalid post id");
  return id;
}

async function listPosts(req, res, ctx) {
  const { page, pageSize } = parsePageParams(ctx.query);
  const result = postsService.listPosts({ page, pageSize });
  sendJson(res, 200, result);
}

async function getPost(req, res, ctx) {
  const id = parsePostId(ctx.params);
  const post = postsService.getPost(id);
  sendJson(res, 200, { post });
}

async function createPost(req, res) {
  requireSession(req);
  const body = await readJsonBody(req);
  const safe = {
    title: sanitizeInput(body.title),
    body: sanitizeInput(body.body),
    published: Boolean(body.published),
  };
  const post = postsService.createPost(safe, req.user.id);
  sendJson(res, 201, { post });
}

async function updatePost(req, res, ctx) {
  requireSession(req);
  const id = parsePostId(ctx.params);
  const body = await readJsonBody(req);
  const patch = {};
  if (typeof body.title === "string") patch.title = sanitizeInput(body.title);
  if (typeof body.body === "string") patch.body = sanitizeInput(body.body);
  if (typeof body.published === "boolean") patch.published = body.published;
  const post = postsService.updatePost(id, patch, req.user.id);
  sendJson(res, 200, { post });
}

async function deletePost(req, res, ctx) {
  requireSession(req);
  const id = parsePostId(ctx.params);
  postsService.deletePost(id, req.user.id);
  sendJson(res, 204, {});
}

module.exports = { listPosts, getPost, createPost, updatePost, deletePost };
