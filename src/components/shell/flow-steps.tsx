import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, title: "Grupo", blurb: "Entrá al de tu gente" },
  { n: 2, title: "Catálogo", blurb: "Guardá ideas para no olvidar" },
  { n: 3, title: "Pronto", blurb: "Votá o tiren el azar" },
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
      className={cn(
        "grid gap-2 sm:grid-cols-3",
        className,
      )}
      aria-label="Cómo funciona"
    >
      {STEPS.map((step) => {
        const on = active === step.n;
        return (
          <li
            key={step.n}
            className={cn(
              "flex items-start gap-2 border border-[var(--line)] bg-white px-3 py-2.5",
              on && "border-[var(--ink)]",
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
