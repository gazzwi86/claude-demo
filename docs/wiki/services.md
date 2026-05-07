# services

## src/services/auth.js

**Description:** User registration, login, logout, and current-user resolution. Hashes passwords with `scrypt`, issues sessions, and strips `passwordHash` from any user surface.

### Functions

- **`validateRegisterInput(input)`** — collects field-level errors and throws `ValidationError`.
- **`register(input)`** — creates a user (rejecting duplicate emails) and returns the public projection.
- **`login(email, password)`** — verifies credentials and returns `{ user, token }`.
- **`logout(token)`** — revokes the session for the given token.
- **`me(token)`** — returns `{ user, session }` for a valid token, else `null`.
- **`toPublicUser(user)`** — returns the user without the password hash.

### Exports

`module.exports = { register, login, logout, me, toPublicUser }`

### Depends on

- `../errors` (ValidationError, AuthError)
- `../utils/validate` (isValidEmail, sanitizeInput)
- `../utils/hash` (hashPassword, verifyPassword)
- `../db/repository` (repositories.users)
- `../models/session` (createSession, findSessionByToken, revokeByToken)

---

## src/services/comments.js

**Description:** Comment creation, listing, and deletion. Listings are sorted oldest-first and paginated; deletes are limited to the comment's author.

### Functions

- **`createComment(postId, input, authorId)`** — throws `NotFoundError` if the post is missing.
- **`listCommentsForPost(postId, opts)`** — returns a paginated envelope.
- **`deleteComment(id, userId)`** — throws `AuthError` if the caller is not the author.

### Exports

`module.exports = { createComment, listCommentsForPost, deleteComment }`

### Depends on

- `../errors` (NotFoundError, AuthError)
- `../db/repository` (repositories.comments, .posts)
- `../models/comment` (createComment)
- `../utils/pagination` (paginate, buildPaginatedResponse)

---

## src/services/feed.js

**Description:** Builds a per-user feed of the most recent published posts and caches the result. `invalidateFeed` clears either a single user's keys or the entire cache.

### Functions

- **`buildFeed(userId, opts)`** — returns `{ userId, items, generatedAt }`, caching by `feed:<userId>:<limit>`.
- **`invalidateFeed(userId)`** — clears keys for one user, or the whole cache when `userId` is nullish.

### Exports

`module.exports = { buildFeed, invalidateFeed }`

### Depends on

- `../db/repository` (repositories.posts)
- `../cache` (feedCache)

---

## src/services/posts.js

**Description:** Post CRUD with cache integration. Reads/writes the posts cache and clears the feed cache on any mutation.

### Functions

- **`createPost(input, authorId)`** — persists a new post, caches it, and clears the feed cache.
- **`listPosts(opts)`** — paginated list, optionally filtered by `authorId`/`published`.
- **`getPost(id)`** — cache-first read; throws `NotFoundError` if missing.
- **`updatePost(id, patch, userId)`** — author-only update; refreshes the cache.
- **`deletePost(id, userId)`** — author-only delete; evicts the cache entry.

### Exports

`module.exports = { createPost, listPosts, getPost, updatePost, deletePost }`

### Depends on

- `../errors` (NotFoundError, AuthError)
- `../db/repository` (repositories.posts)
- `../models/post` (createPost, applyPostUpdate)
- `../utils/pagination` (paginate, buildPaginatedResponse)
- `../cache` (postsCache, feedCache)

---

## src/services/search.js

**Description:** Naive case-insensitive substring search across post title and body, sorted newest-first and paginated.

### Functions

- **`searchPosts(query, opts)`** — throws `ValidationError` for queries shorter than 2 chars; returns a paginated envelope.

### Exports

`module.exports = { searchPosts }`

### Depends on

- `../errors` (ValidationError)
- `../db/repository` (repositories.posts)
- `../utils/pagination` (paginate, buildPaginatedResponse)

---

## src/services/tags.js

**Description:** Tag listing and post-tag association. Tags are deduplicated by slug; linking a tag to a post is idempotent.

### Functions

- **`listTags()`** — returns all tags sorted by name.
- **`findOrCreateTag(name)`** — returns an existing tag (by slug) or creates a new one.
- **`addTagToPost(postId, tagName)`** — returns `{ post, tag, created }`; throws `NotFoundError` if the post is missing.
- **`tagsForPost(postId)`** — resolves the tag records for a post via `postTags` links.

### Exports

`module.exports = { listTags, findOrCreateTag, addTagToPost, tagsForPost }`

### Depends on

- `../errors` (NotFoundError)
- `../db/repository` (repositories.tags, .posts, .postTags)
- `../models/tag` (createTag)
