import { isoWeekKey } from "@/lib/captain";
import { rankMembers } from "@/lib/points";
import type { AppState, Expense, Idea, PointEvent, User } from "@/lib/types";

function startOfIsoWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay() || 7; // Mon=1 … Sun=7
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (day - 1));
  return d;
}

function inCurrentWeek(iso: string, weekStart: Date): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 7);
  return t >= weekStart.getTime() && t < end.getTime();
}

export type WeeklyDigest = {
  weekKey: string;
  weekLabel: string;
  doneIdeas: Idea[];
  expenses: Expense[];
  spentCents: number;
  topRank: { userId: string; points: number; name: string }[];
  pointsThisWeek: PointEvent[];
};

/** In-app weekly summary for one group (no email). */
export function buildWeeklyDigest(
  state: AppState,
  groupId: string,
  users: User[],
  now = new Date(),
): WeeklyDigest {
  const weekStart = startOfIsoWeek(now);
  const weekKey = isoWeekKey(now);
  const weekLabel = `Semana del ${weekStart.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })}`;

  const doneIdeas = state.ideas.filter(
    (i) =>
      i.groupId === groupId &&
      i.status === "done" &&
      // Prefer review/created as proxy for "done this week"
      (inCurrentWeek(i.createdAt, weekStart) ||
        state.reviews.some(
          (r) => r.ideaId === i.id && inCurrentWeek(r.createdAt, weekStart),
        )),
  );

  const expenses = state.expenses.filter(
    (e) => e.groupId === groupId && inCurrentWeek(e.createdAt, weekStart),
  );
  const spentCents = expenses.reduce((s, e) => s + e.amountCents, 0);

  const pointsThisWeek = state.points.filter(
    (p) => p.groupId === groupId && inCurrentWeek(p.at, weekStart),
  );

  const group = state.groups.find((g) => g.id === groupId);
  const ranking = group
    ? rankMembers(group.memberIds, state.points, groupId).slice(0, 3)
    : [];

  const topRank = ranking.map((r) => ({
    ...r,
    name: users.find((u) => u.id === r.userId)?.name ?? "Alguien",
  }));

  return {
    weekKey,
    weekLabel,
    doneIdeas,
    expenses,
    spentCents,
    topRank,
    pointsThisWeek,
  };
}

export function formatEur(cents: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
