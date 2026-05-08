"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { authClient } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";
import { SignupSchema } from "@looper/shared";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = SignupSchema.safeParse({ displayName, email, password });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await authClient.signup(parsed.data);
      router.push("/studio");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("That email is already in use.");
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
        <p className="mt-2 text-sm text-[color:var(--color-text-dim)]">
          Make an account to save your loops.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" aria-label="Signup form" noValidate>
        <TextField
          label="Display name"
          name="displayName"
          autoComplete="name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={fieldErrors.displayName}
        />
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters."
          error={fieldErrors.password}
        />
        {error ? (
          <p role="alert" className="rounded-md bg-[color:var(--color-danger)]/10 px-3 py-2 text-xs text-[color:var(--color-danger)]">
            {error}
          </p>
        ) : null}
        <Button type="submit" loading={loading} className="mt-2">
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-[color:var(--color-text-dim)]">
        Already have one?{" "}
        <Link href="/login" className="text-[color:var(--color-accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
