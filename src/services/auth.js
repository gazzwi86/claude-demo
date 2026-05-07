const { ValidationError, AuthError } = require("../errors");
const { isValidEmail, sanitizeInput } = require("../utils/validate");
const { hashPassword, verifyPassword } = require("../utils/hash");
const { repositories } = require("../db/repository");
const { createSession, findSessionByToken, revokeByToken } = require("../models/session");

function validateRegisterInput(input) {
  if (!input || typeof input !== "object") throw new ValidationError("payload required");
  const errors = [];
  if (typeof input.name !== "string" || input.name.trim().length < 1) {
    errors.push({ field: "name", message: "is required" });
  }
  if (typeof input.email !== "string" || !isValidEmail(input.email)) {
    errors.push({ field: "email", message: "must be a valid email" });
  }
  if (typeof input.password !== "string" || input.password.length < 8) {
    errors.push({ field: "password", message: "must be at least 8 characters" });
  }
  if (errors.length) throw new ValidationError("invalid registration", errors);
}

function register(input) {
  validateRegisterInput(input);
  const email = input.email.trim().toLowerCase();
  if (repositories.users.findOne((u) => u.email === email)) {
    throw new ValidationError("email already registered");
  }
  const user = repositories.users.create({
    name: sanitizeInput(input.name.trim()),
    email,
    role: input.role === "admin" ? "admin" : "user",
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  });
  return toPublicUser(user);
}

function login(email, password) {
  if (typeof email !== "string" || typeof password !== "string") {
    throw new ValidationError("email and password required");
  }
  const user = repositories.users.findOne((u) => u.email === email.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new AuthError("invalid credentials");
  }
  const { token } = createSession(user);
  return { user: toPublicUser(user), token };
}

function logout(token) {
  return revokeByToken(token);
}

function me(token) {
  const session = findSessionByToken(token);
  if (!session) return null;
  const user = repositories.users.findById(session.userId);
  if (!user) return null;
  return { user: toPublicUser(user), session };
}

function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

module.exports = { register, login, logout, me, toPublicUser };
