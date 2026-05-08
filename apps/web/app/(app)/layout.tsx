import Link from "next/link";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/studio" className="flex items-baseline gap-2 text-base font-bold">
            Looper
            <span className="text-[color:var(--color-accent)]">·</span>
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
            <Link
              href="/studio"
              className="rounded-md px-3 py-1.5 text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-text)]"
            >
              Studio
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-1.5 text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-text)]"
            >
              Loops
            </Link>
            <Link
              href="/account"
              className="rounded-md px-3 py-1.5 text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-text)]"
            >
              Account
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>
    </div>
  );
}
