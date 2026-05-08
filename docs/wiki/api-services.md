# api-services

_Area: `apps/api/src/services/` — business logic layer_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/api/src/services/authService.ts

**Description:** Auth orchestration layer. Handles password hashing (bcryptjs, rounds from `BCRYPT_ROUNDS` env), JWT signing/verification (jose HS256, 7-day TTL), and user lookup logic sitting between the routes and the users DynamoDB table.

### Exports

- **`signup(input)`** — hashes password, creates user via `createUser`, signs JWT, returns `{ user, token }`
- **`login(input)`** — looks up user by email, compares bcrypt hash, signs and returns JWT
- **`verifyToken(token)`** — verifies HS256 JWT and returns `{ id, email }` claims; throws UnauthorizedError on any failure
- **`getCurrentUser(id)`** — fetches user by ID; throws UnauthorizedError if not found
- **`toPublicUser(row)`** — strips `passwordHash`, pk, sk keys from a UserRow to produce a `PublicUser`
- **`AUTH_COOKIE_NAME`** — constant `"looper_auth"`
- **`AUTH_COOKIE_TTL_SECONDS`** — 7 × 24 × 60 × 60 (matches JWT TTL)

### Depends on

- `bcryptjs`
- `jose`
- `../config.js`
- `../db/users.js`
- `../errors.js` (UnauthorizedError)
- `@looper/shared` (Login, PublicUser, Signup types)

---

## apps/api/src/services/loopService.ts

**Description:** Orchestrates the loops DynamoDB table with S3 presigned URL generation. Converts raw `LoopRow` items (which include DynamoDB key fields) into the `LoopMeta` contract expected by API consumers, and enforces the owner/public access rules.

### Exports

- **`createLoopWithUploadUrl(ownerId, input)`** — creates a loop row and generates a presigned S3 PUT URL; returns `{ loop: LoopMeta, uploadUrl }`
- **`listLoopsForUser(ownerId)`** — returns all loops owned by a user as `LoopMeta[]`
- **`listPublicLoopsView()`** — returns all public loops across all owners
- **`getLoopForViewer(viewerId, ownerId, loopId)`** — returns loop if viewer is owner or loop is public; else throws ForbiddenError
- **`getLoopWithDownloadUrl(viewerId, loopId)`** — returns `{ loop, downloadUrl }` with a presigned S3 GET URL
- **`updateLoopMeta(ownerId, loopId, patch)`** — patches name/bpm/isPublic fields
- **`deleteLoopAndObject(ownerId, loopId)`** — deletes DynamoDB row and S3 object; idempotent on NotFound

### Depends on

- `../errors.js` (ForbiddenError, NotFoundError)
- `../db/loops.js`
- `./s3Service.js`
- `@looper/shared` (CreateLoop, LoopMeta, UpdateLoop types)

---

## apps/api/src/services/s3Service.ts

**Description:** S3 presigned URL service. The API never proxies audio bytes — it issues short-lived signed URLs that the client uses to PUT/GET directly from S3 (LocalStack in dev, real S3 in prod). Controlled by `S3_USE_STUB=1` for tests (returns deterministic stub URLs).

### Exports

- **`getPresignedPutUrl(key, mimeType, sizeBytes)`** — returns a PUT URL valid for 15 minutes
- **`getPresignedGetUrl(key)`** — returns a GET URL valid for 60 minutes
- **`deleteObject(key)`** — deletes an S3 object by key

### Depends on

- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `../config.js`
