import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        Looper <span className="text-[color:var(--color-accent)]">·</span>
      </h1>
      <p className="max-w-md text-[color:var(--color-text-dim)]">
        Record a loop. Layer it. Speed it up. Bring sounds in and out on a 4×4 pad.
        All in your browser.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-[color:var(--color-surface)] px-4 py-2 text-sm font-medium ring-1 ring-[color:var(--color-border)] hover:bg-[color:var(--color-surface-2)]"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[color:var(--color-accent-dim)]"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
