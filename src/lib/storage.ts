import { createSeedState } from "@/lib/seed";
import type { AppState, Idea, Review, User } from "@/lib/types";

export const STORAGE_KEY = "juntada.app.v2";
const LEGACY_KEY = "juntada.app.v1";

export function loadState(): AppState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed?.version === 2) return migrateLoose(parsed);
    }

    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Record<string, unknown>;
      const migrated = migrateFromV1(parsed);
      saveState(migrated);
      return migrated;
    }

    return createSeedState();
  } catch {
    return createSeedState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): AppState {
  const fresh = createSeedState();
  saveState(fresh);
  return fresh;
}

function migrateLoose(state: AppState): AppState {
  return {
    ...state,
    version: 2,
    reviews: state.reviews ?? [],
    users: state.users.map(normalizeUser),
    ideas: state.ideas.map(normalizeIdea),
  };
}

function migrateFromV1(raw: Record<string, unknown>): AppState {
  const users = ((raw.users as User[]) ?? []).map(normalizeUser);
  const ideas = ((raw.ideas as Idea[]) ?? []).map(normalizeIdea);
  const reviews: Review[] = [];

  for (const idea of ideas) {
    if (idea.status === "done" && idea.doneRating) {
      reviews.push({
        id: `rev_mig_${idea.id}`,
        ideaId: idea.id,
        userId: idea.proposedBy,
        rating: idea.doneRating,
        comment: idea.doneNote ?? "",
        publicVisible: true,
        createdAt: idea.createdAt,
      });
    }
  }

  return {
    version: 2,
    currentUserId: (raw.currentUserId as string | null) ?? null,
    users,
    groups: (raw.groups as AppState["groups"]) ?? [],
    ideas,
    reviews,
    expenses: (raw.expenses as AppState["expenses"]) ?? [],
    points: (raw.points as AppState["points"]) ?? [],
  };
}

function normalizeUser(user: Partial<User> & { id: string; name: string }): User {
  const city = user.city ?? "Madrid";
  return {
    id: user.id,
    name: user.name,
    country: user.country ?? "ES",
    province: user.province ?? guessProvince(city),
    city,
    neighborhood: user.neighborhood,
    email: user.email,
    phone: user.phone,
    authProvider: user.authProvider ?? "demo",
    avatarHue: user.avatarHue ?? 180,
    createdAt: user.createdAt ?? new Date().toISOString(),
  };
}

function guessProvince(city: string): string {
  const c = city.toLowerCase();
  if (c.includes("sevilla")) return "Sevilla";
  if (c.includes("barcelona")) return "Barcelona";
  if (c.includes("valencia")) return "Valencia";
  if (c.includes("bilbao")) return "Bizkaia";
  if (c.includes("coru") || c.includes("santiago") || c.includes("vigo"))
    return "A Coruña";
  if (c.includes("málaga") || c.includes("malaga")) return "Málaga";
  if (c.includes("zaragoza")) return "Zaragoza";
  if (c.includes("buenos") || c.includes("palermo")) return "CABA";
  return "Madrid";
}

function normalizeIdea(idea: Partial<Idea> & { id: string; title: string }): Idea {
  return {
    id: idea.id,
    groupId: idea.groupId ?? "",
    type: idea.type ?? "plan",
    title: idea.title,
    notes: idea.notes ?? "",
    address: idea.address,
    proposedBy: idea.proposedBy ?? "",
    status: idea.status ?? "pending",
    timing: idea.timing ?? "catalog",
    tags: idea.tags ?? [],
    votes: idea.votes ?? {},
    revealed: idea.revealed ?? false,
    softVetoUserIds: idea.softVetoUserIds ?? [],
    doneRating: idea.doneRating,
    doneNote: idea.doneNote,
    createdAt: idea.createdAt ?? new Date().toISOString(),
  };
}
