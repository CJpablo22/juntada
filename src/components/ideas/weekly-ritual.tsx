"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ideaAverage } from "@/lib/captain";
import {
  isRitualWeekend,
  pickWeeklyFinalists,
  RITUAL_MOOD_LABELS,
  type RitualMood,
} from "@/lib/weekly-ritual";
import type { Idea } from "@/lib/types";
import { IDEA_TYPE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  groupId: string;
  ideas: Idea[];
  onLottery: (candidateIds: string[]) => void;
  lotteryDisabled?: boolean;
};

/** Weekly “¿qué hacemos?” ritual: mood chips + up to 3 Pronto finalists. */
export function WeeklyRitual({
  groupId,
  ideas,
  onLottery,
  lotteryDisabled,
}: Props) {
  const router = useRouter();
  const [mood, setMood] = useState<RitualMood>("any");
  const weekend = isRitualWeekend();

  const finalists = useMemo(
    () => pickWeeklyFinalists(ideas, groupId, mood, 3),
    [ideas, groupId, mood],
  );

  if (!weekend && finalists.length === 0) return null;

  return (
    <section className="border border-[var(--ink)] bg-[color-mix(in_oklab,var(--mesa-gold)_12%,var(--mesa-foam))] p-4">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-[var(--pop)]" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pop)]">
            Ritual semanal
          </p>
          <h2 className="mt-0.5 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
            ¿Qué hacemos?
          </h2>
          <p className="mt-1 text-sm text-[var(--mute)]">
            {weekend
              ? "Es finde (o casi): tres finalistas de Pronto según votos y mood."
              : "Cuando haya ideas en Pronto, acá aparecen finalistas para decidir."}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(RITUAL_MOOD_LABELS) as RitualMood[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setMood(key)}
            className={cn(
              "border px-2.5 py-1.5 text-xs font-semibold transition-colors",
              mood === key
                ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                : "border-[var(--line)] bg-[var(--mesa-foam)] text-[var(--mute)] hover:border-[var(--ink)] hover:text-[var(--ink)]",
            )}
          >
            {RITUAL_MOOD_LABELS[key]}
          </button>
        ))}
      </div>

      {finalists.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--mute)]">
          No hay finalistas con este mood. Pasá ideas a Pronto o probá otro filtro.
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {finalists.map((idea, index) => {
            const avg = ideaAverage(idea);
            return (
              <li key={idea.id}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/app/group/${groupId}/idea/${idea.id}`)
                  }
                  className="flex w-full items-center gap-3 border border-[var(--line)] bg-[var(--mesa-foam)] px-3 py-2.5 text-left hover:border-[var(--ink)]"
                >
                  <span className="grid size-7 shrink-0 place-items-center border border-[var(--ink)] bg-[var(--ink)] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-[var(--mute)]">
                      {IDEA_TYPE_LABELS[idea.type]}
                      {avg != null ? ` · ${avg.toFixed(1)}/5` : ""}
                      {!idea.revealed && Object.keys(idea.votes).length
                        ? " · votos secretos"
                        : ""}
                    </span>
                    <span className="block font-semibold text-[var(--ink)]">
                      {idea.title}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={lotteryDisabled || finalists.length === 0}
          onClick={() => onLottery(finalists.map((f) => f.id))}
        >
          Azar entre estos
        </Button>
      </div>
    </section>
  );
}
