function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeInput(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[<>"'&]/g, "");
}

module.exports = { isValidEmail, sanitizeInput };
