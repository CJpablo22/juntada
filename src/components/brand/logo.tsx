import { cn } from "@/lib/utils";

export function Logo({
  className,
  markOnly = false,
}: {
  className?: string;
  markOnly?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="relative grid size-8 place-items-center rounded-xl bg-[var(--brand-ink)] text-[var(--brand-foam)] shadow-[0_8px_20px_-12px_rgba(12,48,41,0.8)]"
      >
        <span className="font-[family-name:var(--font-display)] text-sm font-bold leading-none">
          J
        </span>
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[var(--brand-pop)]" />
      </span>
      {!markOnly && (
        <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--brand-ink)]">
          Juntada
        </span>
      )}
    </span>
  );
}
