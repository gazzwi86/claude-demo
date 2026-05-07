const { NotFoundError } = require("../errors");
const { repositories } = require("../db/repository");
const { createTag: makeTag } = require("../models/tag");

function listTags() {
  return repositories.tags.findAll().sort((a, b) => a.name.localeCompare(b.name));
}

function findOrCreateTag(name) {
  const draft = makeTag({ name });
  const existing = repositories.tags.findOne((t) => t.slug === draft.slug);
  if (existing) return existing;
  return repositories.tags.create(draft);
}

function addTagToPost(postId, tagName) {
  const post = repositories.posts.findById(postId);
  if (!post) throw new NotFoundError("post");
  const tag = findOrCreateTag(tagName);
  const link = repositories.postTags.findOne(
    (pt) => pt.postId === postId && pt.tagId === tag.id,
  );
  if (link) return { post, tag, created: false };
  repositories.postTags.create({ postId, tagId: tag.id });
  return { post, tag, created: true };
}

function tagsForPost(postId) {
  const links = repositories.postTags.findAll((pt) => pt.postId === postId);
  return links
    .map((l) => repositories.tags.findById(l.tagId))
    .filter(Boolean);
}

module.exports = { listTags, findOrCreateTag, addTagToPost, tagsForPost };
