import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { config } from "./config.js";

export async function buildServer() {
  const app = Fastify({
    logger: config.isProd ? true : { transport: { target: "pino-pretty" } },
  });

  await app.register(cookie, { secret: config.jwtSecret });
  await app.register(cors, {
    origin: [config.webOrigin],
    credentials: true,
  });

  app.get("/health", async () => ({ ok: true, ts: new Date().toISOString() }));

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
