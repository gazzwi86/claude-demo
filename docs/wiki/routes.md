# routes

## src/routes/auth.js

**Description:** HTTP handlers for register, login, logout, and current-user endpoints. Reads JSON bodies, delegates to the auth service, and returns standard JSON envelopes.

### Functions

- **`register(req, res)`** — POSTs new user; responds 201 with `{ user }`.
- **`login(req, res)`** — exchanges credentials for `{ user, token }`; 200.
- **`logout(req, res)`** — revokes the bearer token; 204.
- **`getMe(req, res)`** — returns `{ user }` for the active session.

### Exports

`module.exports = { register, login, logout, getMe }`

### Depends on

- `../utils/json` (readJsonBody, sendJson)
- `../errors` (ValidationError)
- `../services/auth`
- `../middleware/auth` (requireSession, extractBearer)

---

## src/routes/comments.js

**Description:** Comment CRUD handlers scoped to a post id from the URL params. Enforces auth on create/delete and supports paginated list.

### Functions

- **`createComment(req, res, ctx)`** — auth required; 201 with `{ comment }`.
- **`listComments(req, res, ctx)`** — paginated list for a post.
- **`deleteComment(req, res, ctx)`** — auth required; 204 on success.

### Exports

`module.exports = { createComment, listComments, deleteComment }`

### Depends on

- `../utils/json` (readJsonBody, sendJson)
- `../utils/validate` (parseIntParam)
- `../utils/pagination` (parsePageParams)
- `../middleware/auth` (requireSession)
- `../services/comments`

---

## src/routes/feed.js

**Description:** Single handler that returns a personalised feed for the authenticated user, with `limit` clamped to `[1, 50]`.

### Functions

- **`getFeed(req, res, ctx)`** — auth required; returns the feed envelope.

### Exports

`module.exports = { getFeed }`

### Depends on

- `../utils/json` (sendJson)
- `../middleware/auth` (requireSession)
- `../services/feed`

---

## src/routes/posts.js

**Description:** REST handlers for posts (list, get, create, update, delete). Patches only the whitelisted fields (`title`, `body`, `published`).

### Functions

- **`listPosts(req, res, ctx)`** — paginated list.
- **`getPost(req, res, ctx)`** — fetch by id.
- **`createPost(req, res)`** — auth required; 201 with `{ post }`.
- **`updatePost(req, res, ctx)`** — auth required; 200 with `{ post }`.
- **`deletePost(req, res, ctx)`** — auth required; 204.

### Exports

`module.exports = { listPosts, getPost, createPost, updatePost, deletePost }`

### Depends on

- `../utils/json` (readJsonBody, sendJson)
- `../utils/validate` (parseIntParam)
- `../utils/pagination` (parsePageParams)
- `../middleware/auth` (requireSession)
- `../services/posts`

---

## src/routes/search.js

**Description:** Single handler exposing post search via the `q` query param with pagination.

### Functions

- **`search(req, res, ctx)`** — returns paginated matches.

### Exports

`module.exports = { search }`

### Depends on

- `../utils/json` (sendJson)
- `../utils/pagination` (parsePageParams)
- `../services/search`

---

## src/routes/tags.js

**Description:** Tag listing plus an authenticated endpoint to attach a tag to a post (creating the tag if needed).

### Functions

- **`listTags(req, res)`** — returns `{ tags }`.
- **`addTagToPost(req, res, ctx)`** — auth required; 201 if the link was created, otherwise 200.

### Exports

`module.exports = { listTags, addTagToPost }`

### Depends on

- `../utils/json` (readJsonBody, sendJson)
- `../utils/validate` (parseIntParam)
- `../middleware/auth` (requireSession)
- `../services/tags`
