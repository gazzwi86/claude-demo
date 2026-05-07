const { ValidationError } = require("../errors");
const { slugify } = require("../utils/slug");

function validateTagInput(input) {
  if (!input || typeof input.name !== "string" || input.name.trim().length < 2) {
    throw new ValidationError("tag name must be at least 2 characters");
  }
}

function createTag(input) {
  validateTagInput(input);
  const name = input.name.trim().toLowerCase();
  return {
    name,
    slug: slugify(name),
    createdAt: new Date().toISOString(),
  };
}

module.exports = { createTag, validateTagInput };
