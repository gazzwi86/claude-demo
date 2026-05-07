const { NotFoundError, AuthError } = require("../errors");
const { repositories } = require("../db/repository");
const { createComment: makeComment } = require("../models/comment");
const { paginate, buildPaginatedResponse } = require("../utils/pagination");

function createComment(postId, input, authorId) {
  const post = repositories.posts.findById(postId);
  if (!post) throw new NotFoundError("post");
  return repositories.comments.create(makeComment(input, postId, authorId));
}

function listCommentsForPost(postId, { page, pageSize } = {}) {
  const all = repositories.comments
    .findAll((c) => c.postId === postId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const total = all.length;
  const items = paginate(all, page, pageSize);
  return buildPaginatedResponse(items, page, total, pageSize);
}

function deleteComment(id, userId) {
  const existing = repositories.comments.findById(id);
  if (!existing) throw new NotFoundError("comment");
  if (existing.authorId !== userId) throw new AuthError("not your comment");
  repositories.comments.remove(id);
  return true;
}

module.exports = { createComment, listCommentsForPost, deleteComment };
