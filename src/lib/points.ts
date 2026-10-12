import type { PointEvent } from "@/lib/types";

export const POINT_REASONS = {
  propose: { delta: 1, label: "Propusiste una idea" },
  chosen: { delta: 3, label: "Tu idea fue elegida" },
  doneWell: { delta: 5, label: "Tu idea salió genial" },
  voted: { delta: 1, label: "Votaste a tiempo" },
  expense: { delta: 2, label: "Cerraste un gasto" },
  memory: { delta: 2, label: "Dejaste un recuerdo" },
} as const;

export function totalPointsForUser(
  points: PointEvent[],
  userId: string,
  groupId?: string,
): number {
  return points
    .filter(
      (p) => p.userId === userId && (groupId ? p.groupId === groupId : true),
    )
    .reduce((sum, p) => sum + p.delta, 0);
}

export function rankMembers(
  memberIds: string[],
  points: PointEvent[],
  groupId: string,
): { userId: string; points: number }[] {
  return memberIds
    .map((userId) => ({
      userId,
      points: totalPointsForUser(points, userId, groupId),
    }))
    .sort((a, b) => b.points - a.points);
}

export function badgeForRank(rank: number, points: number): string {
  if (points <= 0) return "Recién llegado";
  if (rank === 0) return "Capitán de planes";
  if (rank === 1) return "Brazo derecho";
  if (points >= 15) return "Confiable";
  return "En racha";
}
