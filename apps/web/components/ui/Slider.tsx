"use client";

import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  valueDisplay?: string;
}

export function Slider({ label, valueDisplay, className, id, ...rest }: SliderProps) {
  const reactId = id ?? `slider-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <label htmlFor={reactId} className="font-medium text-[color:var(--color-text-dim)]">
          {label}
        </label>
        {valueDisplay ? (
          <span className="font-mono tabular-nums text-[color:var(--color-text)]">
            {valueDisplay}
          </span>
        ) : null}
      </div>
      <input
        {...rest}
        id={reactId}
        type="range"
        className={clsx(
          "h-1 w-full appearance-none rounded-full bg-[color:var(--color-border)]",
          "accent-[color:var(--color-accent)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]",
          className,
        )}
      />
    </div>
  );
}
