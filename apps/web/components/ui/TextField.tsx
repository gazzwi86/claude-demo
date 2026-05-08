"use client";

import { clsx } from "clsx";
import { forwardRef, type InputHTMLAttributes } from "react";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, className, id, ...rest },
  ref,
) {
  const reactId = id ?? `tf-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={reactId} className="text-xs font-medium text-[color:var(--color-text-dim)]">
        {label}
      </label>
      <input
        {...rest}
        id={reactId}
        ref={ref}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${reactId}-error` : hint ? `${reactId}-hint` : undefined}
        className={clsx(
          "h-10 w-full rounded-md bg-[color:var(--color-surface)] px-3 text-sm",
          "text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-dim)]/60",
          "ring-1 ring-[color:var(--color-border)]",
          "focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]",
          error && "ring-[color:var(--color-danger)] focus:ring-[color:var(--color-danger)]",
          className,
        )}
      />
      {error ? (
        <p id={`${reactId}-error`} className="text-xs text-[color:var(--color-danger)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${reactId}-hint`} className="text-xs text-[color:var(--color-text-dim)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
