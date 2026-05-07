const { ValidationError } = require("../errors");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeInput(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[<>"'&]/g, "");
}

function parseIntParam(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError(`invalid ${label}`);
  return id;
}

module.exports = { isValidEmail, sanitizeInput, parseIntParam };
