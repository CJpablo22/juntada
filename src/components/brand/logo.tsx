import { cn } from "@/lib/utils";

export function Logo({
  className,
  markOnly = false,
  invert = false,
}: {
  className?: string;
  markOnly?: boolean;
  invert?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className={cn(
          "relative grid size-8 place-items-center border text-sm font-bold leading-none",
          invert
            ? "border-white/50 bg-white/10 text-white"
            : "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-foam)]",
        )}
        style={{ borderRadius: "var(--btn-radius)" }}
      >
        <span className="font-[family-name:var(--font-display-active)]">J</span>
      </span>
      {!markOnly && (
        <span
          className={cn(
            "font-[family-name:var(--font-display-active)] text-xl font-semibold tracking-tight",
            invert ? "text-white" : "text-[var(--brand-ink)]",
          )}
        >
          Juntada
        </span>
      )}
    </span>
  );
}
