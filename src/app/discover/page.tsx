"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui/badge";
import { IDEA_TYPE_LABELS, type IdeaType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function DiscoverPage() {
  const { ready, state } = useApp();
  const [type, setType] = useState<"all" | IdeaType>("all");

  const entries = useMemo(() => {
    const done = state.ideas.filter((i) => i.status === "done");
    return done
      .map((idea) => {
        const reviews = state.reviews.filter(
          (r) => r.ideaId === idea.id && r.publicVisible,
        );
        if (reviews.length === 0) return null;
        const avg =
          reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;
        return { idea, reviews, avg };
      })
      .filter(Boolean)
      .filter((row) =>
        type === "all" ? true : row!.idea.type === type,
      )
      .sort((a, b) => b!.avg - a!.avg || b!.reviews.length - a!.reviews.length);
  }, [state.ideas, state.reviews, type]);

  return (
    <main className="mx-auto min-h-[100svh] w-full max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/">
          <Logo />
        </Link>
        <Link
          href="/enter"
          className="text-sm font-medium text-[var(--brand-ink)]"
        >
          Entrar
        </Link>
      </div>

      <Reveal className="mt-10">
        <p className="text-sm font-medium text-[var(--brand-mute)]">
          Abierto para todo el mundo
        </p>
        <h1 className="type-display mt-1 text-3xl font-bold text-[var(--brand-ink)] sm:text-4xl">
          Descubrir
        </h1>
        <p className="mt-2 max-w-xl text-[var(--brand-mute)]">
          Pelis, series, sitios y planes que la gente ya hizo — con valoración y
          comentarios públicos. Ideal si estás pensando “¿vale la pena?”.
        </p>
      </Reveal>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip
          active={type === "all"}
          onClick={() => setType("all")}
          label="Todo"
        />
        {(Object.keys(IDEA_TYPE_LABELS) as IdeaType[]).map((t) => (
          <FilterChip
            key={t}
            active={type === t}
            onClick={() => setType(t)}
            label={IDEA_TYPE_LABELS[t]}
          />
        ))}
      </div>

      {!ready ? (
        <p className="mt-8 text-[var(--brand-mute)]">Cargando…</p>
      ) : entries.length === 0 ? (
        <div className="surface-panel mt-8 rounded-3xl p-6 text-[var(--brand-mute)]">
          Todavía no hay valoraciones públicas. Cuando marques algo como hecho y
          lo publiques, aparece acá.
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {entries.map((row, idx) => {
            if (!row) return null;
            return (
              <Reveal key={row.idea.id} delayMs={40 + idx * 30}>
                <Link
                  href={`/discover/${row.idea.id}`}
                  className="surface-panel block rounded-3xl p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {IDEA_TYPE_LABELS[row.idea.type]}
                    </Badge>
                    <span className="text-sm font-semibold text-[var(--brand-pop)]">
                      {row.avg.toFixed(1)}/5
                    </span>
                    <span className="text-xs text-[var(--brand-mute)]">
                      {row.reviews.length}{" "}
                      {row.reviews.length === 1 ? "opinión" : "opiniones"}
                    </span>
                  </div>
                  <p className="type-display mt-2 text-2xl font-semibold text-[var(--brand-ink)]">
                    {row.idea.title}
                  </p>
                  {row.reviews[0]?.comment ? (
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--brand-mute)]">
                      “{row.reviews[0].comment}”
                    </p>
                  ) : null}
                </Link>
              </Reveal>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "bg-[var(--brand-ink)] text-white"
          : "bg-white/70 text-[var(--brand-mute)]",
      )}
    >
      {label}
    </button>
  );
}
