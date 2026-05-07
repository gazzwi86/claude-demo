# Repository Anatomy

_Last incremental refresh: 2026-05-07T14:05:00Z_

## File tree

```
src/
├── CLAUDE.md
├── config.js
├── errors.js
├── index.js
├── router.js
├── server.js
├── cache/
│   ├── index.js
│   └── lru.js
├── db/
│   ├── repository.js
│   └── store.js
├── middleware/
│   ├── auth.js
│   ├── cors.js
│   ├── error-handler.js
│   ├── logger.js
│   └── rate-limit.js
├── models/
│   ├── comment.js
│   ├── post.js
│   ├── session.js
│   ├── tag.js
│   └── user.js
├── routes/
│   ├── auth.js
│   ├── comments.js
│   ├── feed.js
│   ├── health.js
│   ├── index.js
│   ├── posts.js
│   ├── search.js
│   ├── tags.js
│   └── users.js
├── services/
│   ├── auth.js
│   ├── comments.js
│   ├── feed.js
│   ├── posts.js
│   ├── search.js
│   └── tags.js
└── utils/
    ├── hash.js
    ├── json.js
    ├── pagination.js
    ├── slug.js
    └── validate.js
tests/
├── CLAUDE.md
├── auth.test.js
├── cache.test.js
├── posts.test.js
├── rate-limit.test.js
├── users.test.js
└── utils.test.js
```

## Areas

- [Core](docs/wiki/core.md) — 4 files documented (config, errors, router, server)
- [Cache](docs/wiki/cache.md) — 2 files
- [Db](docs/wiki/db.md) — 2 files
- [Middleware](docs/wiki/middleware.md) — 4 files documented (auth, cors, error-handler, rate-limit)
- [Models](docs/wiki/models.md) — 4 files documented (comment, post, session, tag)
- [Routes](docs/wiki/routes.md) — 6 files documented (auth, comments, feed, posts, search, tags)
- [Services](docs/wiki/services.md) — 6 files
- [Utils](docs/wiki/utils.md) — 5 files documented (hash, json, pagination, slug, validate)
- [Tests](docs/wiki/tests.md) — 5 files documented (auth, cache, posts, rate-limit, utils)

## Stale entries

_None._

## Undocumented files

The following tracked files have no wiki entry yet (run `/anatomy lint` for the full check):

- `src/index.js`
- `src/middleware/logger.js`
- `src/models/user.js`
- `src/routes/health.js`, `src/routes/index.js`, `src/routes/users.js`
- `tests/users.test.js`
