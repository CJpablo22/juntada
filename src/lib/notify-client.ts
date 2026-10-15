/** Dispara aviso al grupo sin bloquear la UI. Falla en silencio. */
export function notifyGroup(input: {
  groupId: string;
  eventType:
    | "group_invite"
    | "idea_proposed"
    | "vote_needed"
    | "votes_revealed"
    | "idea_chosen"
    | "expense_added"
    | "generic";
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}): void {
  if (
    typeof window === "undefined" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return;
  }

  void fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).catch(() => {
    /* soft fail */
  });
}
