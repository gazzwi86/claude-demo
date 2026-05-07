const crypto = require("node:crypto");

function sha256Hex(str) {
  return crypto.createHash("sha256").update(String(str)).digest("hex");
}

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function hashPassword(password, salt) {
  const useSalt = salt || crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(String(password), useSalt, 64).toString("hex");
  return `${useSalt}:${derived}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== "string" || !stored.includes(":")) return false;
  const [salt, expected] = stored.split(":");
  const candidate = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return constantTimeEqual(candidate, expected);
}

module.exports = { sha256Hex, constantTimeEqual, randomToken, hashPassword, verifyPassword };
