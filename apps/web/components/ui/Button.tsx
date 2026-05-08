"use client";

import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[color:var(--color-accent)] text-black hover:bg-[color:var(--color-accent-dim)] focus-visible:ring-[color:var(--color-accent)]",
  secondary:
    "bg-[color:var(--color-surface)] text-[color:var(--color-text)] ring-1 ring-[color:var(--color-border)] hover:bg-[color:var(--color-surface-2)]",
  ghost:
    "bg-transparent text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-surface)]",
  danger:
    "bg-[color:var(--color-danger)] text-white hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium",
        "transition-colors duration-100",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading ? (
        <span
          aria-hidden
          className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}
