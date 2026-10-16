import { ideaAverage } from "@/lib/captain";
import type { Idea } from "@/lib/types";

export type RitualMood = "any" | "home" | "out" | "cheap" | "short";

export const RITUAL_MOOD_LABELS: Record<RitualMood, string> = {
  any: "Lo que sea",
  home: "Noche en casa",
  out: "Salir",
  cheap: "Barato",
  short: "Corto (<2 h)",
};

const HOME_TAGS = new Set(["casa", "noche", "sofa", "sofá", "serie", "peli"]);
const OUT_TAGS = new Set(["salir", "cerca", "noche", "terraza", "bar"]);
const CHEAP_TAGS = new Set(["barato", "gratis", "economico", "económico"]);

function matchesMood(idea: Idea, mood: RitualMood): boolean {
  if (mood === "any") return true;
  const tags = idea.tags.map((t) => t.toLowerCase());
  const budget = (idea.budgetNote ?? "").toLowerCase();
  const notes = (idea.notes ?? "").toLowerCase();
  const blob = `${tags.join(" ")} ${budget} ${notes}`;

  if (mood === "home") {
    if (idea.type === "series" || idea.type === "movie") {
      if (idea.movieVenue === "home" || !idea.movieVenue) return true;
    }
    return tags.some((t) => HOME_TAGS.has(t)) || /casa|sof[aá]/.test(blob);
  }
  if (mood === "out") {
    if (idea.type === "visit" || idea.type === "food" || idea.type === "birthday")
      return true;
    if (idea.type === "movie" && idea.movieVenue === "cinema") return true;
    return tags.some((t) => OUT_TAGS.has(t)) || Boolean(idea.places?.length);
  }
  if (mood === "cheap") {
    if (/gratis|0\s*€|barato/.test(budget) || tags.some((t) => CHEAP_TAGS.has(t)))
      return true;
    const euros = budget.match(/(\d+)\s*€/);
    if (euros && Number(euros[1]) <= 15) return true;
    return idea.type === "visit" || idea.type === "series";
  }
  if (mood === "short") {
    if (idea.durationMinutes != null && idea.durationMinutes <= 120) return true;
    return idea.type === "food" || idea.type === "movie";
  }
  return true;
}

function scoreIdea(idea: Idea): number {
  const avg = ideaAverage(idea) ?? 0;
  const votes = Object.keys(idea.votes).length;
  const vetoPenalty = idea.softVetoUserIds.length * 0.4;
  const revealedBoost = idea.revealed ? 0.3 : 0;
  return avg * 2 + votes * 0.5 + revealedBoost - vetoPenalty;
}

/**
 * Up to 3 Pronto finalists for the weekly “¿qué hacemos?” ritual.
 */
export function pickWeeklyFinalists(
  ideas: Idea[],
  groupId: string,
  mood: RitualMood = "any",
  limit = 3,
): Idea[] {
  const pool = ideas.filter(
    (i) =>
      i.groupId === groupId &&
      i.timing === "soon" &&
      (i.status === "pending" || i.status === "chosen") &&
      matchesMood(i, mood),
  );

  return [...pool]
    .sort((a, b) => scoreIdea(b) - scoreIdea(a))
    .slice(0, limit);
}

/** Thu–Sun local: ritual feels most relevant. */
export function isRitualWeekend(date = new Date()): boolean {
  const day = date.getDay(); // 0 Sun … 6 Sat
  return day === 0 || day === 4 || day === 5 || day === 6;
}
