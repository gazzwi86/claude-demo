# web-pages

_Area: `apps/web/app/` — Next.js App Router pages_

_Last full refresh: 2026-05-08T14:00:00Z_

## apps/web/app/layout.tsx

**Description:** Root Next.js layout. Sets `<html lang="en">`, imports `globals.css` (Tailwind 4 theme tokens and dark background), and renders `{children}`. No auth logic — gating is handled at route-group level.

---

## apps/web/app/page.tsx

**Description:** Public home page at `/`. Displays the app name and tagline with links to `/login` and `/signup`. Unauthenticated landing page; accessible without a session.

---

## apps/web/app/(auth)/login/page.tsx

**Description:** Login form. Validates email and password with `LoginSchema` client-side (`noValidate` on the form so Zod runs before browser validation). On success, calls `/auth/login`, sets cookie, and navigates to `/studio`.

---

## apps/web/app/(auth)/signup/page.tsx

**Description:** Signup form. Validates with `SignupSchema` (email, password, displayName). On success, calls `/auth/signup` and navigates to `/studio`.

---

## apps/web/app/(app)/layout.tsx

**Description:** Layout for all authenticated routes in the `(app)` route group. Calls `getSession()` on every render; redirects to `/login` if no active session. Renders shared navigation header above `{children}`.

---

## apps/web/app/(app)/studio/page.tsx

**Description:** Main looper studio page. Composes `TransportBar`, `PadGrid`, `EffectsRack`, `LoopRecorder`, and `LibraryDrawer`. Initialises `useAudioEngine` and passes the engine down to each sub-component.

---

## apps/web/app/(app)/dashboard/page.tsx

**Description:** Loop library page. Fetches the user's loops from `/loops` and renders a list with metadata (name, duration, BPM) and upload status. Links to the studio for loading a loop onto a pad.

---

## apps/web/app/(app)/account/page.tsx

**Description:** Account settings page. Displays current user email and displayName. Contains a logout button that calls `auth.logout()` and redirects to `/`.

---

## apps/web/middleware.ts

**Description:** Next.js Edge middleware that enforces authentication on protected routes (`/studio`, `/dashboard`, `/account`). Checks for the `looper_auth` cookie; redirects to `/login?next=<pathname>` if absent. The `config.matcher` restricts execution to those three path trees so public routes are unaffected.
