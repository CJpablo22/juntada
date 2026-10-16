import type { createClient } from "@/lib/supabase/client";
import type {
  AppState,
  Expense,
  Group,
  GroupKind,
  Idea,
  BirthdayKind,
  IdeaPlace,
  IdeaStatus,
  IdeaTiming,
  IdeaType,
  MovieVenue,
  PointEvent,
  Review,
  RsvpStatus,
  User,
} from "@/lib/types";
import { rowToUser, type ProfileRow } from "@/lib/supabase/profile";

type Supabase = ReturnType<typeof createClient>;

type GroupRow = {
  id: string;
  name: string;
  kind: string;
  invite_code: string;
  created_by: string | null;
  created_at: string;
  last_captain_tie_break_week?: string | null;
};

type MemberRow = { group_id: string; user_id: string };
type IdeaRow = {
  id: string;
  group_id: string;
  type: string;
  title: string;
  notes: string;
  movie_venue: string | null;
  celebrant_name: string | null;
  celebrant_member_id: string | null;
  birthday_kind: string | null;
  places: IdeaPlace[] | null;
  address: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  date_flexible: boolean | null;
  link: string | null;
  budget_note: string | null;
  proposed_by: string;
  status: string;
  timing: string;
  tags: string[] | null;
  votes: Record<string, number> | null;
  revealed: boolean;
  soft_veto_user_ids: string[] | null;
  rsvps: Record<string, string> | null;
  done_rating: number | null;
  done_note: string | null;
  done_photo_url: string | null;
  created_at: string;
};
type ReviewRow = {
  id: string;
  idea_id: string;
  user_id: string;
  rating: number;
  comment: string;
  public_visible: boolean;
  photo_url: string | null;
  created_at: string;
};
type ExpenseRow = {
  id: string;
  group_id: string;
  idea_id: string | null;
  title: string;
  amount_cents: number;
  paid_by: string;
  split_between: string[] | null;
  split_shares: Record<string, number> | null;
  created_at: string;
};
type PointRow = {
  id: string;
  group_id: string;
  user_id: string;
  delta: number;
  reason: string;
  at: string;
};

function mapGroup(row: GroupRow, memberIds: string[]): Group {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as GroupKind,
    inviteCode: row.invite_code,
    memberIds,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    lastCaptainTieBreakWeek: row.last_captain_tie_break_week ?? undefined,
  };
}

/** Capitán rompe empate (RPC security definer). */
export async function cloudCaptainBreakTie(
  supabase: Supabase,
  groupId: string,
  ideaId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc("captain_break_tie", {
    p_group_id: groupId,
    p_idea_id: ideaId,
  });
  if (error) {
    console.error("captain_break_tie", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

function mapIdea(row: IdeaRow): Idea {
  return {
    id: row.id,
    groupId: row.group_id,
    type: row.type as IdeaType,
    title: row.title,
    notes: row.notes ?? "",
    movieVenue: (row.movie_venue as MovieVenue | null) ?? undefined,
    celebrantName: row.celebrant_name ?? undefined,
    celebrantMemberId: row.celebrant_member_id ?? undefined,
    birthdayKind: (row.birthday_kind as BirthdayKind | null) ?? undefined,
    places: row.places ?? [],
    address: row.address ?? undefined,
    scheduledDate: row.scheduled_date ?? undefined,
    scheduledTime: row.scheduled_time ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    dateFlexible: row.date_flexible || undefined,
    link: row.link ?? undefined,
    budgetNote: row.budget_note ?? undefined,
    proposedBy: row.proposed_by,
    status: row.status as IdeaStatus,
    timing: (row.timing as IdeaTiming) || "catalog",
    tags: row.tags ?? [],
    votes: row.votes ?? {},
    revealed: row.revealed,
    softVetoUserIds: row.soft_veto_user_ids ?? [],
    rsvps: normalizeRsvps(row.rsvps),
    doneRating: row.done_rating ?? undefined,
    doneNote: row.done_note ?? undefined,
    donePhotoUrl: row.done_photo_url ?? undefined,
    createdAt: row.created_at,
  };
}

function normalizeRsvps(
  raw: Record<string, string> | null | undefined,
): Record<string, RsvpStatus> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Record<string, RsvpStatus> = {};
  for (const [id, status] of Object.entries(raw)) {
    if (status === "yes" || status === "no") out[id] = status;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Carga el mundo del usuario autenticado desde Postgres. */
export async function loadCloudState(
  supabase: Supabase,
  currentUser: User,
): Promise<AppState> {
  // RPC security definer: no depende de RLS circular en group_members
  const { data: idRows, error: idsError } = await supabase.rpc("my_group_ids");
  if (idsError) {
    console.error("my_group_ids", idsError.message);
    // Fallback a select directo (por si aún no corrieron el 008)
    const { data: memberRows, error: membersError } = await supabase
      .from("group_members")
      .select("group_id, user_id")
      .eq("user_id", currentUser.id);
    if (membersError) console.error("group_members", membersError.message);
    const fallbackIds =
      (memberRows as MemberRow[] | null)?.map((m) => m.group_id) ?? [];
    if (fallbackIds.length === 0) {
      return emptyCloudState(currentUser);
    }
    return loadCloudStateWithIds(supabase, currentUser, fallbackIds);
  }

  const myGroupIds = ((idRows as string[] | null) ?? []).filter(Boolean);
  if (myGroupIds.length === 0) {
    return emptyCloudState(currentUser);
  }
  return loadCloudStateWithIds(supabase, currentUser, myGroupIds);
}

function emptyCloudState(currentUser: User): AppState {
  return {
    version: 2,
    currentUserId: currentUser.id,
    users: [currentUser],
    groups: [],
    ideas: [],
    reviews: [],
    expenses: [],
    points: [],
  };
}

async function loadCloudStateWithIds(
  supabase: Supabase,
  currentUser: User,
  myGroupIds: string[],
): Promise<AppState> {
  // Preferir RPC (evita RLS de SELECT en groups)
  let groupsData: GroupRow[] | null = null;
  const { data: rpcGroups, error: rpcGroupsError } =
    await supabase.rpc("get_my_groups");
  if (rpcGroupsError) {
    console.error("get_my_groups", rpcGroupsError.message);
    const { data, error: groupsError } = await supabase
      .from("groups")
      .select("*")
      .in("id", myGroupIds);
    if (groupsError) console.error("groups", groupsError.message);
    groupsData = (data as GroupRow[] | null) ?? null;
  } else {
    groupsData = (rpcGroups as GroupRow[] | null) ?? null;
  }

  const membersByGroup = new Map<string, string[]>();
  const memberUserIds = new Set<string>([currentUser.id]);

  await Promise.all(
    myGroupIds.map(async (gid) => {
      const { data: memberIds, error } = await supabase.rpc("group_member_ids", {
        p_group_id: gid,
      });
      if (error) {
        // Fallback tabla
        const { data: rows } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", gid);
        const ids = ((rows as { user_id: string }[] | null) ?? []).map(
          (r) => r.user_id,
        );
        membersByGroup.set(gid, ids);
        ids.forEach((id) => memberUserIds.add(id));
        return;
      }
      const ids = ((memberIds as string[] | null) ?? []).filter(Boolean);
      membersByGroup.set(gid, ids);
      ids.forEach((id) => memberUserIds.add(id));
    }),
  );

  const groups = ((groupsData as GroupRow[] | null) ?? []).map((g) =>
    mapGroup(g, membersByGroup.get(g.id) ?? []),
  );

  const otherIds = [...memberUserIds].filter((id) => id !== currentUser.id);
  let users: User[] = [currentUser];
  if (otherIds.length > 0) {
    // RPC: solo pares de grupo, sin email/teléfono
    const { data: peers, error: peersError } = await supabase.rpc(
      "get_peer_profiles",
      { p_ids: otherIds },
    );
    if (peersError) {
      console.error("peer profiles", peersError.message);
    } else {
      users = [
        currentUser,
        ...((peers as ProfileRow[] | null) ?? []).map((row) =>
          rowToUser({
            ...row,
            email: null,
            phone: null,
            instagram: null,
            tiktok: null,
          }),
        ),
      ];
    }
  }

  const [
    { data: ideasData, error: ideasError },
    { data: expensesData, error: expensesError },
    { data: pointsData, error: pointsError },
  ] = await Promise.all([
    supabase.from("ideas").select("*").in("group_id", myGroupIds),
    supabase.from("expenses").select("*").in("group_id", myGroupIds),
    supabase.from("point_events").select("*").in("group_id", myGroupIds),
  ]);

  if (ideasError) console.error("ideas", ideasError.message);
  if (expensesError) console.error("expenses", expensesError.message);
  if (pointsError) console.error("points", pointsError.message);

  const ideas = ((ideasData as IdeaRow[] | null) ?? []).map(mapIdea);
  const ideaIds = ideas.map((i) => i.id);

  let reviews: Review[] = [];
  if (ideaIds.length > 0) {
    const { data: reviewsData, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .in("idea_id", ideaIds);
    if (reviewsError) console.error("reviews", reviewsError.message);
    reviews = ((reviewsData as ReviewRow[] | null) ?? []).map((r) => ({
      id: r.id,
      ideaId: r.idea_id,
      userId: r.user_id,
      rating: r.rating,
      comment: r.comment,
      publicVisible: r.public_visible,
      photoUrl: r.photo_url ?? undefined,
      createdAt: r.created_at,
    }));
  }

  const expenses: Expense[] = ((expensesData as ExpenseRow[] | null) ?? []).map(
    (e) => ({
      id: e.id,
      groupId: e.group_id,
      ideaId: e.idea_id ?? undefined,
      title: e.title,
      amountCents: e.amount_cents,
      paidBy: e.paid_by,
      splitBetween: e.split_between ?? [],
      splitShares:
        e.split_shares && Object.keys(e.split_shares).length > 0
          ? e.split_shares
          : undefined,
      createdAt: e.created_at,
    }),
  );

  const points: PointEvent[] = ((pointsData as PointRow[] | null) ?? []).map(
    (p) => ({
      id: p.id,
      groupId: p.group_id,
      userId: p.user_id,
      delta: p.delta,
      reason: p.reason,
      at: p.at,
    }),
  );

  return {
    version: 2,
    currentUserId: currentUser.id,
    users,
    groups,
    ideas,
    reviews,
    expenses,
    points,
  };
}

export async function cloudCreateGroup(
  supabase: Supabase,
  input: { id: string; name: string; kind: GroupKind; inviteCode: string; userId: string },
): Promise<{ ok: boolean; error?: string }> {
  const { error: gErr } = await supabase.from("groups").insert({
    id: input.id,
    name: input.name,
    kind: input.kind,
    invite_code: input.inviteCode,
    created_by: input.userId,
  });
  if (gErr) {
    console.error("create group", gErr.message);
    return { ok: false, error: gErr.message };
  }
  const { error: mErr } = await supabase.from("group_members").insert({
    group_id: input.id,
    user_id: input.userId,
  });
  if (mErr) {
    console.error("create member", mErr.message);
    // Rollback best-effort
    await supabase.from("groups").delete().eq("id", input.id);
    return { ok: false, error: mErr.message };
  }
  return { ok: true };
}

export async function cloudJoinGroup(
  supabase: Supabase,
  code: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("join_group_by_code", { code });
  if (error) {
    console.error("join group", error.message);
    return null;
  }
  return typeof data === "string" ? data : null;
}

export async function cloudLeaveGroup(
  supabase: Supabase,
  groupId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("leave_group", { p_group_id: groupId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function cloudRenameGroup(
  supabase: Supabase,
  groupId: string,
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("rename_group", {
    p_group_id: groupId,
    p_name: name,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function cloudKickMember(
  supabase: Supabase,
  groupId: string,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("kick_group_member", {
    p_group_id: groupId,
    p_user_id: userId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function cloudDeleteGroup(
  supabase: Supabase,
  groupId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("delete_group", { p_group_id: groupId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function cloudInsertIdea(
  supabase: Supabase,
  idea: Idea,
): Promise<{ ok: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: "Sesión expirada. Cerrá sesión y volvé a entrar.",
    };
  }

  const row = {
    id: idea.id,
    group_id: idea.groupId,
    type: idea.type,
    title: idea.title,
    notes: idea.notes,
    movie_venue: idea.movieVenue ?? null,
    celebrant_name: idea.celebrantName ?? null,
    celebrant_member_id: idea.celebrantMemberId ?? null,
    birthday_kind: idea.birthdayKind ?? null,
    places: idea.places ?? [],
    address: idea.address ?? null,
    scheduled_date: idea.scheduledDate ?? null,
    scheduled_time: idea.scheduledTime ?? null,
    duration_minutes: idea.durationMinutes ?? null,
    date_flexible: idea.dateFlexible ?? false,
    link: idea.link ?? null,
    budget_note: idea.budgetNote ?? null,
    proposed_by: user.id,
    status: idea.status,
    timing: idea.timing,
    tags: idea.tags ?? [],
    votes: idea.votes ?? {},
    revealed: idea.revealed ?? false,
    soft_veto_user_ids: idea.softVetoUserIds ?? [],
    created_at: idea.createdAt,
  };

  // 1) RPC security definer (017/019)
  const { error: rpcError } = await supabase.rpc("insert_idea", {
    p_idea: row,
  });
  if (!rpcError) {
    return verifyIdeaSaved(supabase, idea.id);
  }

  const rpcMissing = /function|does not exist|schema cache/i.test(
    rpcError.message,
  );
  if (!rpcMissing) {
    console.error("insert idea rpc", rpcError.message, rpcError.code);
    // Seguir al fallback tabla por si el RPC falla por columnas opcionales
  }

  // 2) Upsert directo
  const { error } = await supabase
    .from("ideas")
    .upsert(row, { onConflict: "id" });
  if (!error) {
    return verifyIdeaSaved(supabase, idea.id);
  }

  // 3) Columnas mínimas (schema 001) si faltan migraciones de schedule/birthday
  if (/column|schema cache/i.test(error.message)) {
    const minimal = {
      id: row.id,
      group_id: row.group_id,
      type: row.type,
      title: row.title,
      notes: row.notes,
      movie_venue: row.movie_venue,
      places: row.places,
      address: row.address,
      proposed_by: row.proposed_by,
      status: row.status,
      timing: row.timing,
      tags: row.tags,
      votes: row.votes,
      revealed: row.revealed,
      soft_veto_user_ids: row.soft_veto_user_ids,
      created_at: row.created_at,
    };
    const { error: minErr } = await supabase
      .from("ideas")
      .upsert(minimal, { onConflict: "id" });
    if (!minErr) {
      return verifyIdeaSaved(supabase, idea.id);
    }
    console.error("insert idea minimal", minErr.message);
    return {
      ok: false,
      error: `${minErr.message}. Corré los SQL 017 y 019 en Supabase.`,
    };
  }

  console.error("insert idea", error.message, error.code, error.details);
  const hint = /row-level security|not a group member/i.test(error.message)
    ? " ¿Estás en el grupo? Probá salir y volver a entrar, o corré el SQL 019."
    : /function|does not exist/i.test(rpcError.message)
      ? " Corré supabase/migrations/019_insert_idea_expense_hardened.sql en el SQL Editor."
      : "";
  return { ok: false, error: `${error.message}.${hint}` };
}

async function verifyIdeaSaved(
  supabase: Supabase,
  ideaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase
    .from("ideas")
    .select("id")
    .eq("id", ideaId)
    .maybeSingle();
  if (error) {
    console.error("verify idea", error.message);
    // Insert pudo haber andado; SELECT falló por RLS — avisar
    return {
      ok: false,
      error: `Guardado dudoso (no se pudo verificar): ${error.message}`,
    };
  }
  if (!data) {
    return {
      ok: false,
      error:
        "La idea no quedó en la nube. Corré el SQL 019 en Supabase o revisá que seas miembro del grupo.",
    };
  }
  return { ok: true };
}

export async function cloudUpdateIdea(
  supabase: Supabase,
  ideaId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  // votos / revelado / veto van por RPC (trigger bloquea update directo)
  const {
    votes: _votes,
    revealed: _revealed,
    soft_veto_user_ids: _veto,
    ...safePatch
  } = patch;
  if (Object.keys(safePatch).length === 0) return;
  const { error } = await supabase
    .from("ideas")
    .update(safePatch)
    .eq("id", ideaId);
  if (error) console.error("update idea", error.message);
}

export async function cloudCastVote(
  supabase: Supabase,
  ideaId: string,
  score: number,
): Promise<void> {
  const { error } = await supabase.rpc("cast_vote", {
    p_idea_id: ideaId,
    p_score: score,
  });
  if (error) console.error("cast_vote", error.message);
}

export async function cloudSetRsvp(
  supabase: Supabase,
  ideaId: string,
  status: RsvpStatus,
): Promise<Record<string, RsvpStatus> | null> {
  const { data, error } = await supabase.rpc("set_rsvp", {
    p_idea_id: ideaId,
    p_status: status,
  });
  if (error) {
    console.error("set_rsvp", error.message);
    return null;
  }
  return normalizeRsvps(data as Record<string, string> | null) ?? {};
}

export async function cloudRevealVotes(
  supabase: Supabase,
  ideaId: string,
): Promise<void> {
  const { error } = await supabase.rpc("reveal_idea_votes", {
    p_idea_id: ideaId,
  });
  if (error) console.error("reveal_idea_votes", error.message);
}

export async function cloudToggleSoftVeto(
  supabase: Supabase,
  ideaId: string,
): Promise<string[] | null> {
  const { data, error } = await supabase.rpc("toggle_soft_veto", {
    p_idea_id: ideaId,
  });
  if (error) {
    console.error("toggle_soft_veto", error.message);
    return null;
  }
  return (data as string[] | null) ?? [];
}

export async function cloudInsertReview(
  supabase: Supabase,
  review: Review,
): Promise<void> {
  const { error } = await supabase.from("reviews").upsert(
    {
      id: review.id,
      idea_id: review.ideaId,
      user_id: review.userId,
      rating: review.rating,
      comment: review.comment,
      public_visible: review.publicVisible,
      photo_url: review.photoUrl ?? null,
      created_at: review.createdAt,
    },
    { onConflict: "id" },
  );
  if (error) console.error("insert review", error.message);
}

export async function cloudInsertExpense(
  supabase: Supabase,
  expense: Expense,
): Promise<{ ok: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: "Sesión expirada. Cerrá sesión y volvé a entrar.",
    };
  }

  const row = {
    id: expense.id,
    group_id: expense.groupId,
    idea_id: expense.ideaId ?? null,
    title: expense.title,
    amount_cents: expense.amountCents,
    paid_by: expense.paidBy,
    split_between: expense.splitBetween ?? [],
    split_shares: expense.splitShares ?? {},
    created_at: expense.createdAt,
  };

  const { error: rpcError } = await supabase.rpc("insert_expense", {
    p_expense: row,
  });
  if (!rpcError) {
    return verifyExpenseSaved(supabase, expense.id);
  }

  const rpcMissing = /function|does not exist|schema cache/i.test(
    rpcError.message,
  );
  if (!rpcMissing) {
    console.error("insert expense rpc", rpcError.message, rpcError.code);
  }

  const { error } = await supabase
    .from("expenses")
    .upsert(row, { onConflict: "id" });
  if (!error) {
    return verifyExpenseSaved(supabase, expense.id);
  }

  // Sin columna split_shares
  if (/split_shares|column|schema cache/i.test(error.message)) {
    const { split_shares: _s, ...withoutShares } = row;
    const { error: e2 } = await supabase
      .from("expenses")
      .upsert(withoutShares, { onConflict: "id" });
    if (!e2) return verifyExpenseSaved(supabase, expense.id);
    console.error("insert expense fallback", e2.message);
    return {
      ok: false,
      error: `${e2.message}. Corré los SQL 017–019 en Supabase.`,
    };
  }

  console.error("insert expense", error.message, error.code, error.details);
  const hint = /row-level security|not a group member/i.test(error.message)
    ? " ¿Estás en el grupo? Corré el SQL 019."
    : rpcMissing
      ? " Corré supabase/migrations/019_insert_idea_expense_hardened.sql."
      : "";
  return { ok: false, error: `${error.message}.${hint}` };
}

async function verifyExpenseSaved(
  supabase: Supabase,
  expenseId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase
    .from("expenses")
    .select("id")
    .eq("id", expenseId)
    .maybeSingle();
  if (error) {
    return {
      ok: false,
      error: `Guardado dudoso (no se pudo verificar): ${error.message}`,
    };
  }
  if (!data) {
    return {
      ok: false,
      error:
        "El gasto no quedó en la nube. Corré el SQL 019 o revisá membresía del grupo.",
    };
  }
  return { ok: true };
}

export async function cloudInsertPoint(
  supabase: Supabase,
  point: PointEvent,
): Promise<{ ok: boolean; error?: string }> {
  const row = {
    id: point.id,
    group_id: point.groupId,
    user_id: point.userId,
    delta: point.delta,
    reason: point.reason,
    at: point.at,
  };

  const { error: rpcError } = await supabase.rpc("insert_point_event", {
    p_point: row,
  });
  if (!rpcError) return { ok: true };

  if (
    !/function|does not exist|schema cache/i.test(rpcError.message)
  ) {
    console.error("insert point rpc", rpcError.message, rpcError.code);
    return { ok: false, error: rpcError.message };
  }

  const { error } = await supabase
    .from("point_events")
    .upsert(row, { onConflict: "id", ignoreDuplicates: true });
  if (error) {
    console.error("insert point", error.message, error.code, error.details);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export function newCloudId(): string {
  return crypto.randomUUID();
}
