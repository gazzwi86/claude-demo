import type { FastifyInstance } from "fastify";
import { CreateLoopSchema, UpdateLoopSchema } from "@looper/shared";
import { authGuard } from "../middleware/authGuard.js";
import { ValidationError } from "../errors.js";
import {
  createLoopWithUploadUrl,
  deleteLoopAndObject,
  getLoopForViewer,
  getLoopWithDownloadUrl,
  listLoopsForUser,
  listPublicLoopsView,
  updateLoopMeta,
} from "../services/loopService.js";

export default async function loopsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/loops/public", async () => {
    const loops = await listPublicLoopsView();
    return { loops };
  });

  app.get("/loops", { preHandler: authGuard }, async (request) => {
    const userId = request.user!.id;
    const loops = await listLoopsForUser(userId);
    return { loops };
  });

  app.get<{ Params: { id: string } }>(
    "/loops/:id",
    { preHandler: authGuard },
    async (request) => {
      const userId = request.user!.id;
      const loop = await getLoopForViewer(userId, userId, request.params.id);
      return { loop };
    },
  );

  app.post("/loops", { preHandler: authGuard }, async (request, reply) => {
    const parsed = CreateLoopSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.flatten());
    const userId = request.user!.id;
    const result = await createLoopWithUploadUrl(userId, parsed.data);
    reply.code(201);
    return result;
  });

  app.patch<{ Params: { id: string } }>(
    "/loops/:id",
    { preHandler: authGuard },
    async (request) => {
      const parsed = UpdateLoopSchema.safeParse(request.body);
      if (!parsed.success) throw new ValidationError(parsed.error.flatten());
      const userId = request.user!.id;
      const loop = await updateLoopMeta(userId, request.params.id, parsed.data);
      return { loop };
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/loops/:id",
    { preHandler: authGuard },
    async (request, reply) => {
      const userId = request.user!.id;
      await deleteLoopAndObject(userId, request.params.id);
      return reply.code(204).send();
    },
  );

  app.get<{ Params: { id: string } }>(
    "/loops/:id/download-url",
    { preHandler: authGuard },
    async (request) => {
      const userId = request.user!.id;
      const result = await getLoopWithDownloadUrl(userId, request.params.id);
      return result;
    },
  );
}
