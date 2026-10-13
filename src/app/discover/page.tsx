"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { useApp } from "@/components/providers/app-provider";
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
        <Link href="/enter" className="text-sm font-semibold underline decoration-[var(--pop)] underline-offset-4">
          Entrar
        </Link>
      </div>

      <div className="mt-10">
        <p className="text-sm text-[var(--mute)]">Abierto para todo el mundo</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
          Descubrir
        </h1>
        <p className="mt-2 max-w-xl text-[var(--mute)]">
          Pelis, sitios y planes que la gente ya hizo — con valoración y
          comentarios públicos.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <FilterLink
          active={type === "all"}
          onClick={() => setType("all")}
          label="Todo"
        />
        {(Object.keys(IDEA_TYPE_LABELS) as IdeaType[]).map((t) => (
          <FilterLink
            key={t}
            active={type === t}
            onClick={() => setType(t)}
            label={IDEA_TYPE_LABELS[t]}
          />
        ))}
      </div>

      {!ready ? (
        <p className="mt-8 text-[var(--mute)]">Cargando…</p>
      ) : entries.length === 0 ? (
        <div className="surface-panel mt-8 p-5 text-[var(--mute)]">
          Todavía no hay valoraciones públicas. Cuando marques algo como hecho y
          lo publiques, aparece acá.
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {entries.map((row) => {
            if (!row) return null;
            return (
              <li key={row.idea.id}>
                <Link
                  href={`/discover/${row.idea.id}`}
                  className="block py-4 hover:bg-white/50"
                >
                  <div className="flex flex-wrap items-baseline gap-2 text-sm">
                    <span className="text-[var(--mute)]">
                      {IDEA_TYPE_LABELS[row.idea.type]}
                    </span>
                    <span className="font-semibold text-[var(--pop)]">
                      {row.avg.toFixed(1)}/5
                    </span>
                    <span className="text-xs text-[var(--mute)]">
                      {row.reviews.length}{" "}
                      {row.reviews.length === 1 ? "opinión" : "opiniones"}
                    </span>
                  </div>
                  <p className="mt-1 text-xl font-semibold text-[var(--ink)]">
                    {row.idea.title}
                  </p>
                  {row.reviews[0]?.comment ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--mute)]">
                      “{row.reviews[0].comment}”
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function FilterLink({
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
        "underline-offset-2",
        active
          ? "font-semibold text-[var(--ink)] underline"
          : "text-[var(--mute)]",
      )}
    >
      {label}
    </button>
  );
}
