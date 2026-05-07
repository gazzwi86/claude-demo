const { ValidationError } = require("../errors");
const { sanitizeInput } = require("../utils/validate");

function validateCommentInput(input) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("comment payload must be an object");
  }
  if (typeof input.body !== "string" || input.body.trim().length < 1) {
    throw new ValidationError("comment body is required");
  }
  if (input.body.length > 2000) {
    throw new ValidationError("comment body too long (max 2000)");
  }
}

function createComment(input, postId, authorId) {
  validateCommentInput(input);
  return {
    body: sanitizeInput(input.body.trim()),
    postId,
    authorId,
    createdAt: new Date().toISOString(),
  };
}

module.exports = { createComment, validateCommentInput };
