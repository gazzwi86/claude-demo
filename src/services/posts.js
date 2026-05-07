const { NotFoundError, AuthError } = require("../errors");
const { repositories } = require("../db/repository");
const { createPost: makePost, applyPostUpdate } = require("../models/post");
const { paginate, buildPaginatedResponse } = require("../utils/pagination");
const { postsCache, feedCache } = require("../cache");

function createPost(input, authorId) {
  const post = repositories.posts.create(makePost(input, authorId));
  postsCache.set(post.id, post);
  feedCache.clear();
  return post;
}

function listPosts({ page, pageSize, authorId, published } = {}) {
  const all = repositories.posts
    .findAll((p) => {
      if (authorId != null && p.authorId !== authorId) return false;
      if (published != null && p.published !== published) return false;
      return true;
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const total = all.length;
  const items = paginate(all, page, pageSize);
  return buildPaginatedResponse(items, page, total, pageSize);
}

function getPost(id) {
  const cached = postsCache.get(id);
  if (cached) return cached;
  const post = repositories.posts.findById(id);
  if (!post) throw new NotFoundError("post");
  postsCache.set(id, post);
  return post;
}

function updatePost(id, patch, userId) {
  const existing = repositories.posts.findById(id);
  if (!existing) throw new NotFoundError("post");
  if (existing.authorId !== userId) throw new AuthError("not your post");
  const next = applyPostUpdate(existing, patch);
  const saved = repositories.posts.update(id, next);
  postsCache.set(id, saved);
  feedCache.clear();
  return saved;
}

function deletePost(id, userId) {
  const existing = repositories.posts.findById(id);
  if (!existing) throw new NotFoundError("post");
  if (existing.authorId !== userId) throw new AuthError("not your post");
  repositories.posts.remove(id);
  postsCache.delete(id);
  feedCache.clear();
  return true;
}

module.exports = { createPost, listPosts, getPost, updatePost, deletePost };
