import { rankMembers } from "@/lib/points";
import type { Idea, PointEvent } from "@/lib/types";

/** ISO week key YYYY-Www (UTC) for once-per-week captain privileges. */
export function isoWeekKey(date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Sole #1 by points in the group, or null if empty / tied for first. */
export function soleCaptainId(
  memberIds: string[],
  points: PointEvent[],
  groupId: string,
): string | null {
  const ranking = rankMembers(memberIds, points, groupId);
  if (!ranking.length || ranking[0].points <= 0) return null;
  if (ranking.length > 1 && ranking[1].points === ranking[0].points) {
    return null;
  }
  return ranking[0].userId;
}

export function ideaAverage(idea: Idea): number | null {
  const values = Object.values(idea.votes);
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Revealed Pronto ideas that share the top average (a real empate).
 * Ignores ideas with no votes or soft-vetoed by the current majority of voters.
 */
export function tiedTopSoonIdeas(ideas: Idea[], groupId: string): Idea[] {
  const candidates = ideas.filter(
    (i) =>
      i.groupId === groupId &&
      i.timing === "soon" &&
      (i.status === "pending" || i.status === "chosen") &&
      i.revealed &&
      Object.keys(i.votes).length > 0,
  );

  const scored = candidates
    .map((idea) => {
      const avg = ideaAverage(idea);
      if (avg == null) return null;
      // Soft veto: if ≥ half of voters vetoed, skip from tie pool
      const voters = Object.keys(idea.votes).length;
      const vetoes = idea.softVetoUserIds.length;
      if (voters > 0 && vetoes >= Math.ceil(voters / 2)) return null;
      return { idea, avg };
    })
    .filter(Boolean) as { idea: Idea; avg: number }[];

  if (scored.length < 2) return [];

  const top = Math.max(...scored.map((s) => s.avg));
  const tied = scored
    .filter((s) => Math.abs(s.avg - top) < 0.001)
    .map((s) => s.idea);

  return tied.length >= 2 ? tied : [];
}

export function captainCanBreakTie(opts: {
  memberIds: string[];
  points: PointEvent[];
  groupId: string;
  userId: string;
  lastTieBreakWeek?: string | null;
  ideas: Idea[];
}): { ok: true; tied: Idea[] } | { ok: false; reason: string } {
  const captain = soleCaptainId(opts.memberIds, opts.points, opts.groupId);
  if (!captain || captain !== opts.userId) {
    return { ok: false, reason: "Solo el Capitán de planes puede romper empates." };
  }
  const week = isoWeekKey();
  if (opts.lastTieBreakWeek === week) {
    return {
      ok: false,
      reason: "Ya usaste el privilegio de Capitán esta semana.",
    };
  }
  const tied = tiedTopSoonIdeas(opts.ideas, opts.groupId);
  if (tied.length < 2) {
    return {
      ok: false,
      reason: "No hay empate en Pronto para romper ahora.",
    };
  }
  return { ok: true, tied };
}
