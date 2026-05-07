const { ValidationError } = require("../errors");
const { sanitizeInput } = require("../utils/validate");
const { slugify } = require("../utils/slug");

function validatePostInput(input) {
  const errors = [];
  if (!input || typeof input !== "object") {
    throw new ValidationError("post payload must be an object");
  }
  if (typeof input.title !== "string" || input.title.trim().length < 3) {
    errors.push({ field: "title", message: "must be at least 3 characters" });
  }
  if (typeof input.body !== "string" || input.body.trim().length < 1) {
    errors.push({ field: "body", message: "is required" });
  }
  if (errors.length) throw new ValidationError("invalid post", errors);
}

function createPost(input, authorId) {
  validatePostInput(input);
  const title = sanitizeInput(input.title.trim());
  const body = sanitizeInput(input.body.trim());
  return {
    title,
    body,
    slug: slugify(title),
    authorId,
    published: Boolean(input.published),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function applyPostUpdate(existing, patch) {
  const next = { ...existing };
  if (typeof patch.title === "string") {
    if (patch.title.trim().length < 3) {
      throw new ValidationError("title must be at least 3 characters");
    }
    next.title = sanitizeInput(patch.title.trim());
    next.slug = slugify(next.title);
  }
  if (typeof patch.body === "string") {
    next.body = sanitizeInput(patch.body.trim());
  }
  if (typeof patch.published === "boolean") next.published = patch.published;
  next.updatedAt = new Date().toISOString();
  return next;
}

module.exports = { createPost, applyPostUpdate, validatePostInput };
