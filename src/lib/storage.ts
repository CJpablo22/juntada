import { createSeedState } from "@/lib/seed";
import type { AppState } from "@/lib/types";

export const STORAGE_KEY = "juntada.app.v1";

export function loadState(): AppState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed?.version !== 1) return createSeedState();
    return parsed;
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
