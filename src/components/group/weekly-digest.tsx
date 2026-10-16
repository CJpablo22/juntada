"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Newspaper } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { buildWeeklyDigest, formatEur } from "@/lib/weekly-digest";
import { IDEA_TYPE_LABELS } from "@/lib/types";

type Props = { groupId: string };

/** Resumen semanal in-app del grupo (planes, gastos, ranking). */
export function WeeklyDigestCard({ groupId }: Props) {
  const { state } = useApp();

  const digest = useMemo(
    () => buildWeeklyDigest(state, groupId, state.users),
    [state, groupId],
  );

  const empty =
    digest.doneIdeas.length === 0 &&
    digest.expenses.length === 0 &&
    digest.pointsThisWeek.length === 0;

  return (
    <section className="border border-[var(--line)] bg-[var(--mesa-foam)] p-4">
      <div className="flex items-start gap-2">
        <Newspaper className="mt-0.5 size-5 shrink-0 text-[var(--pop)]" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pop)]">
            Digest semanal
          </p>
          <h2 className="mt-0.5 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
            {digest.weekLabel}
          </h2>
          <p className="mt-1 text-sm text-[var(--mute)]">
            Qué pasó en el grupo esta semana — solo acá, sin mails.
          </p>
        </div>
      </div>

      {empty ? (
        <p className="mt-4 text-sm text-[var(--mute)]">
          Todavía no hay movimiento esta semana. Cuando marquen hechos, gastos o
          sumen puntos, aparece acá.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--mute)]">
              Hechos
            </p>
            {digest.doneIdeas.length === 0 ? (
              <p className="mt-1 text-sm text-[var(--mute)]">Ninguno aún</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {digest.doneIdeas.map((idea) => (
                  <li key={idea.id}>
                    <Link
                      href={`/app/group/${groupId}/idea/${idea.id}`}
                      className="text-sm font-medium text-[var(--ink)] underline-offset-2 hover:underline"
                    >
                      {IDEA_TYPE_LABELS[idea.type]} · {idea.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--mute)]">
              Gastos
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
              {formatEur(digest.spentCents)}
            </p>
            <p className="text-xs text-[var(--mute)]">
              {digest.expenses.length}{" "}
              {digest.expenses.length === 1 ? "gasto" : "gastos"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--mute)]">
              Ranking
            </p>
            <ol className="mt-1 space-y-0.5">
              {digest.topRank.map((row, i) => (
                <li key={row.userId} className="text-sm text-[var(--ink)]">
                  {i + 1}. {row.name}{" "}
                  <span className="text-[var(--mute)]">{row.points} pts</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
