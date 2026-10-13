import { cn } from "@/lib/utils";

export function Logo({
  className,
  invert = false,
}: {
  className?: string;
  invert?: boolean;
  markOnly?: boolean;
}) {
  return (
    <span
      className={cn(
        "text-[1.15rem] font-bold tracking-tight",
        invert ? "text-white" : "text-[var(--ink)]",
        className,
      )}
    >
      Juntada
    </span>
  );
}
