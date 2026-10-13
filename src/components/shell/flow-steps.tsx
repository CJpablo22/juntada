import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, title: "Grupo", blurb: "Entrá al de tu gente" },
  { n: 2, title: "Catálogo", blurb: "Guardá ideas" },
  { n: 3, title: "Pronto", blurb: "Votá o azar" },
] as const;

export function FlowSteps({
  active,
  className,
}: {
  active?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <ol
      className={cn("h-scroll sm:grid sm:grid-cols-3 sm:gap-2 sm:overflow-visible", className)}
      aria-label="Cómo funciona"
    >
      {STEPS.map((step) => {
        const on = active === step.n;
        return (
          <li
            key={step.n}
            className={cn(
              "flex min-w-[9.5rem] items-start gap-2 border bg-white px-3 py-2.5 sm:min-w-0",
              on ? "border-[var(--ink)] shadow-[0_2px_0_0_var(--pop)]" : "border-[var(--line)]",
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid size-6 shrink-0 place-items-center text-xs font-bold",
                on
                  ? "bg-[var(--ink)] text-white"
                  : "bg-[var(--wash)] text-[var(--mute)]",
              )}
            >
              {step.n}
            </span>
            <span>
              <span className="block text-sm font-semibold text-[var(--ink)]">
                {step.title}
              </span>
              <span className="block text-xs text-[var(--mute)]">
                {step.blurb}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
