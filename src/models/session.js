const { randomToken, sha256Hex } = require("../utils/hash");
const { config } = require("../config");
const { repositories } = require("../db/repository");

function createSession(user, now = Date.now()) {
  const token = randomToken(32);
  const tokenHash = sha256Hex(token);
  const session = repositories.sessions.create({
    userId: user.id,
    tokenHash,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + config.session.ttlMs).toISOString(),
  });
  return { session, token };
}

function findSessionByToken(token, now = Date.now()) {
  if (typeof token !== "string" || !token) return null;
  const hash = sha256Hex(token);
  const session = repositories.sessions.findOne((s) => s.tokenHash === hash);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < now) {
    repositories.sessions.remove(session.id);
    return null;
  }
  return session;
}

function revokeSession(id) {
  return repositories.sessions.remove(id);
}

function revokeByToken(token) {
  const session = findSessionByToken(token);
  if (!session) return false;
  return revokeSession(session.id);
}

module.exports = { createSession, findSessionByToken, revokeSession, revokeByToken };
