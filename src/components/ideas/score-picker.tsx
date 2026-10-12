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
    <div className="flex flex-wrap gap-2" role="group" aria-label="Puntuación">
      {[1, 2, 3, 4, 5].map((score) => {
        const active = value === score;
        return (
          <button
            key={score}
            type="button"
            disabled={disabled}
            onClick={() => onChange(score)}
            className={cn(
              "score-dot size-11 rounded-2xl border text-sm font-semibold transition",
              "disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "border-transparent bg-[var(--brand-pop)] text-white scale-105"
                : "border-[var(--brand-line)] bg-white/70 text-[var(--brand-ink)] hover:border-[var(--brand-ink)]/30 hover:-translate-y-0.5",
            )}
          >
            {score}
          </button>
        );
      })}
    </div>
  );
}
