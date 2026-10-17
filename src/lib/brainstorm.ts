/** Lluvia de ideas: modo del grupo (local). Fuera de lluvia, las alternativas van en la misma idea. */

const key = (groupId: string) => `juntada.brainstorm.${groupId}`;

export function loadBrainstorm(groupId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key(groupId)) === "1";
  } catch {
    return false;
  }
}

export function saveBrainstorm(groupId: string, on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(groupId), on ? "1" : "0");
  } catch {
    /* ignore */
  }
}
