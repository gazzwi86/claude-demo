const { AuthError } = require("../errors");
const sessionsService = require("../services/auth");

function extractBearer(req) {
  const header = req.headers["authorization"] || req.headers["Authorization"];
  if (!header || typeof header !== "string") return null;
  const [scheme, token] = header.split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

function requireSession(req) {
  const token = extractBearer(req);
  if (!token) throw new AuthError("missing bearer token");
  const session = sessionsService.me(token);
  if (!session) throw new AuthError("invalid or expired session");
  req.user = session.user;
  req.session = session.session;
  return session;
}

function optionalSession(req) {
  const token = extractBearer(req);
  if (!token) return null;
  const session = sessionsService.me(token);
  if (session) {
    req.user = session.user;
    req.session = session.session;
  }
  return session;
}

module.exports = { requireSession, optionalSession, extractBearer };
