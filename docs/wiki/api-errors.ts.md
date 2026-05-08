# api-errors.ts

_Area: `apps/api/src/errors.ts` — typed error hierarchy for the Fastify API_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/api/src/errors.ts

**Description:** Defines the typed error hierarchy used throughout the API. `AppError` is the base class; concrete subclasses map directly to HTTP status codes. The `errorHandler` middleware (`src/middleware/errorHandler.ts`) catches any thrown `AppError` and serialises it into the JSON error response.

### Exports

- **`type AppErrorCode`** — union of string error codes: `"bad_request"` | `"validation_failed"` | `"unauthorized"` | `"forbidden"` | `"not_found"` | `"duplicate_email"` | `"conflict"` | `"internal"`
- **`class AppError extends Error`** — base error class with `statusCode: number`, `code: AppErrorCode`, `details: unknown`
- **`class BadRequestError extends AppError`** — 400; arbitrary message + optional details
- **`class ValidationError extends AppError`** — 422; details holds Zod issues; default message `"Validation failed"`
- **`class UnauthorizedError extends AppError`** — 401; default message `"Not signed in"`
- **`class ForbiddenError extends AppError`** — 403; default message `"Forbidden"`
- **`class NotFoundError extends AppError`** — 404; default message `"Not found"`
- **`class DuplicateEmailError extends AppError`** — 409; fixed message `"An account with that email already exists."`

### Depends on

- Nothing (no imports)
