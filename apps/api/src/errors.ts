// Typed error hierarchy. errorHandler maps these to status codes.

export type AppErrorCode =
  | "bad_request"
  | "validation_failed"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "duplicate_email"
  | "conflict"
  | "internal";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: AppErrorCode;
  readonly details: unknown;

  constructor(code: AppErrorCode, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super("bad_request", message, 400, details);
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown, message = "Validation failed") {
    super("validation_failed", message, 422, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Not signed in") {
    super("unauthorized", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super("forbidden", message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super("not_found", message, 404);
  }
}

export class DuplicateEmailError extends AppError {
  constructor() {
    super("duplicate_email", "An account with that email already exists.", 409);
  }
}
