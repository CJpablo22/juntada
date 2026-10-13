"use client";

import { cn } from "@/lib/utils";

export function ScorePicker({
  value,
  onChange,
  disabled,
}: {
  value?: number;
  onChange: (score: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap"
      role="group"
      aria-label="Puntuación"
    >
      {[1, 2, 3, 4, 5].map((score) => {
        const active = value === score;
        return (
          <button
            key={score}
            type="button"
            disabled={disabled}
            onClick={() => onChange(score)}
            className={cn(
              "min-h-12 border text-sm font-semibold transition-[transform,box-shadow,background-color] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 sm:min-w-11 sm:px-0",
              active
                ? "border-[var(--ink)] bg-[var(--ink)] text-white shadow-[0_3px_0_0_var(--pop)]"
                : "border-[var(--ink)] bg-white text-[var(--ink)] shadow-[0_3px_0_0_var(--line)] hover:bg-[var(--wash)] active:translate-y-px active:shadow-none",
            )}
          >
            {score}
          </button>
        );
      })}
    </div>
  );
}
