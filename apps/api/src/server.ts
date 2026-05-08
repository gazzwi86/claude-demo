import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { registerErrorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import loopsRoutes from "./routes/loops.js";

export async function buildServer() {
  const app = Fastify({
    logger: config.isProd
      ? true
      : process.env.SILENT === "1"
        ? false
        : { transport: { target: "pino-pretty" } },
  });

  await app.register(cookie, { secret: config.jwtSecret });
  await app.register(cors, {
    origin: [config.webOrigin],
    credentials: true,
  });

  registerErrorHandler(app);

  app.get("/health", async () => ({ ok: true, ts: new Date().toISOString() }));

  await app.register(authRoutes);
  await app.register(loopsRoutes);

  return app;
}

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main();
}
