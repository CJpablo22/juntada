import type { GroupNameVisibility, User } from "@/lib/types";

export function getGroupNameVisibility(
  user: Pick<User, "groupNameVisibility">,
  groupId: string,
): GroupNameVisibility {
  return user.groupNameVisibility?.[groupId] ?? "real_name";
}

/** Cómo te ven en UN grupo concreto */
export function displayNameInGroup(
  user: Pick<User, "name" | "username" | "groupNameVisibility">,
  groupId: string,
): string {
  const mode = getGroupNameVisibility(user, groupId);
  if (mode === "username" && user.username?.trim()) {
    return `@${user.username.trim()}`;
  }
  return user.name.trim() || (user.username ? `@${user.username}` : "Alguien");
}

export function displayNameOrUsername(
  user: Pick<User, "name" | "username">,
): string {
  return user.name.trim() || (user.username ? `@${user.username}` : "Alguien");
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, "");
}

export function isValidUsernameFormat(username: string): boolean {
  return /^[a-z0-9._]{3,20}$/.test(username);
}
