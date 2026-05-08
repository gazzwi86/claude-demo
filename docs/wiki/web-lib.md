# web-lib

_Area: `apps/web/lib/` (non-audio client utilities)_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/web/lib/api-client.ts

**Description:** Typed fetch wrapper targeting `NEXT_PUBLIC_API_BASE_URL`. Sends `credentials: "include"` on every request so the `looper_auth` httpOnly cookie is forwarded automatically. Each method returns the parsed JSON response and throws on non-2xx status.

### Exports

- **`apiClient`** — object with typed methods grouped by resource:
  - `auth.signup(body)`, `auth.login(body)`, `auth.logout()`, `auth.me()`
  - `loops.list()`, `loops.listPublic()`, `loops.get(id)`, `loops.create(body)`, `loops.update(id, body)`, `loops.delete(id)`, `loops.downloadUrl(id)`

---

## apps/web/lib/auth-client.ts

**Description:** Client-side session helpers. `getSession()` fetches the current user from `/auth/me` and returns null on 401 (used by the `(app)` layout to gate authed routes). `logout()` posts to `/auth/logout`.

### Exports

- **`getSession()`** — returns `PublicUser | null`
- **`logout()`** — calls `/auth/logout`, navigates to `/login`
