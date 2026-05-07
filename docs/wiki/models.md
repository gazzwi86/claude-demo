# models

## src/models/comment.js

**Description:** Comment payload validation and shaping. Builds the persisted record from validated input and a `(postId, authorId)` pair.

### Functions

- **`validateCommentInput(input)`** — throws `ValidationError` if the body is missing, empty, or over 2000 chars.
- **`createComment(input, postId, authorId)`** — returns the sanitised, timestamped comment record.

### Exports

`module.exports = { createComment, validateCommentInput }`

### Depends on

- `../errors` (ValidationError)
- `../utils/validate` (sanitizeInput)

---

## src/models/post.js

**Description:** Post payload validation, creation, and update shaping. Sanitises text, slugifies titles, and stamps `createdAt`/`updatedAt`.

### Functions

- **`validatePostInput(input)`** — collects per-field errors and throws `ValidationError` with details.
- **`createPost(input, authorId)`** — returns a new post record with slug and timestamps.
- **`applyPostUpdate(existing, patch)`** — returns a new record with selected fields patched and `updatedAt` refreshed.

### Exports

`module.exports = { createPost, applyPostUpdate, validatePostInput }`

### Depends on

- `../errors` (ValidationError)
- `../utils/validate` (sanitizeInput)
- `../utils/slug` (slugify)

---

## src/models/session.js

**Description:** Session lifecycle helpers backed by the sessions repository. Stores only a sha256 hash of the token (never the token itself) and enforces TTL-based expiry on lookup.

### Functions

- **`createSession(user, now)`** — issues a random token, persists `{ tokenHash, userId, createdAt, expiresAt }`, returns `{ session, token }`.
- **`findSessionByToken(token, now)`** — returns the session record by hashed token; deletes and returns `null` if expired.
- **`revokeSession(id)`** — removes a session by id.
- **`revokeByToken(token)`** — looks up and removes by token; returns boolean.

### Exports

`module.exports = { createSession, findSessionByToken, revokeSession, revokeByToken }`

### Depends on

- `../utils/hash` (randomToken, sha256Hex)
- `../config` (config.session)
- `../db/repository` (repositories.sessions)

---

## src/models/tag.js

**Description:** Tag input validation and creation. Lowercases the name and derives a slug for uniqueness.

### Functions

- **`validateTagInput(input)`** — throws `ValidationError` if name is shorter than 2 chars.
- **`createTag(input)`** — returns `{ name, slug, createdAt }`.

### Exports

`module.exports = { createTag, validateTagInput }`

### Depends on

- `../errors` (ValidationError)
- `../utils/slug` (slugify)
