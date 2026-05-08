"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { authClient } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authClient.login({ email, password });
      router.push("/studio");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Wrong email or password.");
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Couldn't reach the server.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Looper <span className="text-[color:var(--color-accent)]">·</span>
        </h1>
        <p className="mt-2 text-sm text-[color:var(--color-text-dim)]">Sign in to your studio.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" aria-label="Login form" noValidate>
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? (
          <p role="alert" className="rounded-md bg-[color:var(--color-danger)]/10 px-3 py-2 text-xs text-[color:var(--color-danger)]">
            {error}
          </p>
        ) : null}
        <Button type="submit" loading={loading} className="mt-2">
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-[color:var(--color-text-dim)]">
        New here?{" "}
        <Link href="/signup" className="text-[color:var(--color-accent)] hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
