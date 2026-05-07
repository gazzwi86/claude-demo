const { readJsonBody, sendJson } = require("../utils/json");
const { sanitizeInput } = require("../utils/validate");
const { ValidationError } = require("../errors");
const authService = require("../services/auth");
const { requireSession, extractBearer } = require("../middleware/auth");

async function register(req, res) {
  const body = await readJsonBody(req);
  const safe = {
    name: sanitizeInput(body.name),
    email: typeof body.email === "string" ? body.email.trim() : body.email,
    password: body.password,
    role: body.role,
  };
  const user = authService.register(safe);
  sendJson(res, 201, { user });
}

async function login(req, res) {
  const body = await readJsonBody(req);
  if (!body || typeof body !== "object") throw new ValidationError("payload required");
  const result = authService.login(body.email, body.password);
  sendJson(res, 200, result);
}

async function logout(req, res) {
  const token = extractBearer(req);
  if (!token) throw new ValidationError("missing bearer token");
  authService.logout(token);
  sendJson(res, 204, {});
}

async function getMe(req, res) {
  requireSession(req);
  sendJson(res, 200, { user: req.user });
}

module.exports = { register, login, logout, getMe };
