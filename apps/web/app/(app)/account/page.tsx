"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import type { PublicUser } from "@looper/shared";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authClient
      .me()
      .then((d) => setUser(d.user))
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleLogout() {
    setLoading(true);
    try {
      await authClient.logout();
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Account</h1>

      {!user ? (
        <p className="text-sm text-[color:var(--color-text-dim)]">Loading…</p>
      ) : (
        <dl className="grid grid-cols-[8rem_1fr] gap-y-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 text-sm">
          <dt className="text-[color:var(--color-text-dim)]">Display name</dt>
          <dd>{user.displayName}</dd>
          <dt className="text-[color:var(--color-text-dim)]">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-[color:var(--color-text-dim)]">Joined</dt>
          <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
        </dl>
      )}

      <div className="mt-8">
        <Button variant="secondary" loading={loading} onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </main>
  );
}
