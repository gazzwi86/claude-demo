# Source Code Guidelines

This file is only loaded when Claude works inside `src/`.

## Architecture

The app is a vanilla Node.js HTTP server with manual routing.
There is no Express or other framework — just `http.createServer`.

- `index.js` — entry point, creates server, wires middleware + router
- `routes/` — route handlers grouped by resource
- `models/` — data layer (in-memory stores for this demo)
- `middleware/` — request middleware (logger, auth, etc.)
- `utils/` — shared helper functions

## Patterns

- Route handlers receive `(req, res)` and are responsible for sending responses
- Models are class-based stores with `add()`, `list()`, `findById()` methods
- All middleware functions take `(req)` or `(req, res, next)` signatures
