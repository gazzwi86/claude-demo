// Auth orchestration. Wraps password hashing (bcryptjs) + JWT signing
// (jose, HS256) over the users table.

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { config } from "../config.js";
import { createUser, getUserByEmail, getUserById, type UserRow } from "../db/users.js";
import { UnauthorizedError } from "../errors.js";
import type { Login, PublicUser, Signup } from "@looper/shared";

const BCRYPT_ROUNDS = Number.parseInt(process.env.BCRYPT_ROUNDS ?? "10", 10);
const JWT_TTL_SECONDS = 7 * 24 * 60 * 60;
const JWT_ALG = "HS256";

const secretBytes = () => new TextEncoder().encode(config.jwtSecret);

export async function signup(input: Signup): Promise<{ user: UserRow; token: string }> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await createUser({
    email: input.email,
    displayName: input.displayName,
    passwordHash,
  });
  const token = await signToken(user);
  return { user, token };
}

export async function login(input: Login): Promise<{ user: UserRow; token: string }> {
  const user = await getUserByEmail(input.email);
  if (!user) throw new UnauthorizedError("Wrong email or password.");
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new UnauthorizedError("Wrong email or password.");
  const token = await signToken(user);
  return { user, token };
}

export async function verifyToken(token: string): Promise<{ id: string; email: string }> {
  try {
    const { payload } = await jwtVerify(token, secretBytes(), {
      algorithms: [JWT_ALG],
    });
    const sub = payload.sub;
    const email = payload.email;
    if (typeof sub !== "string" || typeof email !== "string") {
      throw new UnauthorizedError("Invalid token.");
    }
    return { id: sub, email };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError("Invalid or expired token.");
  }
}

export async function getCurrentUser(id: string): Promise<UserRow> {
  const user = await getUserById(id);
  if (!user) throw new UnauthorizedError("Account not found.");
  return user;
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    createdAt: row.createdAt,
  };
}

async function signToken(user: UserRow): Promise<string> {
  return await new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${JWT_TTL_SECONDS}s`)
    .sign(secretBytes());
}

export const AUTH_COOKIE_NAME = "looper_auth";
export const AUTH_COOKIE_TTL_SECONDS = JWT_TTL_SECONDS;
