import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(handleError);
}

function handleError(err: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (err instanceof AppError) {
    reply.status(err.statusCode).send({
      error: { code: err.code, message: err.message, details: err.details ?? undefined },
    });
    return;
  }

  // Fastify validation errors
  if (err.statusCode === 400 && err.validation) {
    reply.status(400).send({
      error: { code: "validation_failed", message: err.message, details: err.validation },
    });
    return;
  }

  if (err.statusCode && err.statusCode < 500) {
    reply.status(err.statusCode).send({
      error: { code: "bad_request", message: err.message },
    });
    return;
  }

  request.log.error({ err }, "unhandled server error");
  reply.status(500).send({
    error: { code: "internal", message: "Something went wrong." },
  });
}
