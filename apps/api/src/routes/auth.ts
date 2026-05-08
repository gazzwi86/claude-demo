import type { FastifyInstance, FastifyReply } from "fastify";
import { LoginSchema, SignupSchema } from "@looper/shared";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_TTL_SECONDS,
  getCurrentUser,
  login,
  signup,
  toPublicUser,
} from "../services/authService.js";
import { authGuard } from "../middleware/authGuard.js";
import { ValidationError } from "../errors.js";
import { config } from "../config.js";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: AUTH_COOKIE_TTL_SECONDS,
};

function setAuthCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(AUTH_COOKIE_NAME, token, { ...cookieOpts, secure: config.isProd });
}

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/signup", async (request, reply) => {
    const parsed = SignupSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.flatten());
    const { user, token } = await signup(parsed.data);
    setAuthCookie(reply, token);
    return { user: toPublicUser(user) };
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = LoginSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.flatten());
    const { user, token } = await login(parsed.data);
    setAuthCookie(reply, token);
    return { user: toPublicUser(user) };
  });

  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    return reply.code(204).send();
  });

  app.get("/auth/me", { preHandler: authGuard }, async (request) => {
    const user = await getCurrentUser(request.user!.id);
    return { user: toPublicUser(user) };
  });
}
