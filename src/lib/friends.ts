import type { AppState, User } from "@/lib/types";

export type ExperienceFriend = {
  user: User;
  sharedCount: number;
  sharedTitles: string[];
  groupNames: string[];
};

/**
 * Amigos de experiencia: solo quienes compartieron al menos una idea
 * marcada como hecha en un grupo en común. No es follow abierto tipo Instagram.
 */
export function getExperienceFriends(
  state: AppState,
  userId: string,
): ExperienceFriend[] {
  const doneIdeas = state.ideas.filter((i) => i.status === "done");
  const byFriend = new Map<
    string,
    { titles: Set<string>; groups: Set<string>; count: number }
  >();

  for (const idea of doneIdeas) {
    const group = state.groups.find((g) => g.id === idea.groupId);
    if (!group || !group.memberIds.includes(userId)) continue;

    for (const otherId of group.memberIds) {
      if (otherId === userId) continue;
      const entry = byFriend.get(otherId) ?? {
        titles: new Set<string>(),
        groups: new Set<string>(),
        count: 0,
      };
      if (!entry.titles.has(idea.title)) {
        entry.count += 1;
        entry.titles.add(idea.title);
      }
      entry.groups.add(group.name);
      byFriend.set(otherId, entry);
    }
  }

  return [...byFriend.entries()]
    .map(([friendId, data]) => {
      const user = state.users.find((u) => u.id === friendId);
      if (!user) return null;
      return {
        user,
        sharedCount: data.count,
        sharedTitles: [...data.titles].slice(0, 4),
        groupNames: [...data.groups],
      } satisfies ExperienceFriend;
    })
    .filter((row): row is ExperienceFriend => row != null)
    .sort((a, b) => b.sharedCount - a.sharedCount);
}
