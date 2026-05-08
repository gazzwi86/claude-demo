import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError } from "../errors.js";
import { AUTH_COOKIE_NAME, verifyToken } from "../services/authService.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: { id: string; email: string };
  }
}

export async function authGuard(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const token = request.cookies[AUTH_COOKIE_NAME];
  if (!token) throw new UnauthorizedError();
  const claims = await verifyToken(token);
  request.user = claims;
}
