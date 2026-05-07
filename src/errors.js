class AppError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
  }

  toJSON() {
    return { error: { message: this.message, code: this.code, status: this.status } };
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, "validation_error");
    this.details = details;
  }

  toJSON() {
    const base = super.toJSON();
    if (this.details) base.error.details = this.details;
    return base;
  }
}

class AuthError extends AppError {
  constructor(message = "unauthorized") {
    super(message, 401, "auth_error");
  }
}

class NotFoundError extends AppError {
  constructor(resource = "resource") {
    super(`${resource} not found`, 404, "not_found");
  }
}

class RateLimitError extends AppError {
  constructor(message = "rate limit exceeded") {
    super(message, 429, "rate_limited");
  }
}

module.exports = { AppError, ValidationError, AuthError, NotFoundError, RateLimitError };
