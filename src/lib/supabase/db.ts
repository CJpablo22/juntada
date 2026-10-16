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
    doneRating: row.done_rating ?? undefined,
    doneNote: row.done_note ?? undefined,
    donePhotoUrl: row.done_photo_url ?? undefined,
    createdAt: row.created_at,
  };
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
): Promise<void> {
  const { error } = await supabase.from("ideas").insert({
    id: idea.id,
    group_id: idea.groupId,
    type: idea.type,
    title: idea.title,
    notes: idea.notes,
    movie_venue: idea.movieVenue ?? null,
    celebrant_name: idea.celebrantName ?? null,
    celebrant_member_id: idea.celebrantMemberId ?? null,
    birthday_kind: idea.birthdayKind ?? null,
    places: idea.places,
    address: idea.address ?? null,
    scheduled_date: idea.scheduledDate ?? null,
    scheduled_time: idea.scheduledTime ?? null,
    duration_minutes: idea.durationMinutes ?? null,
    date_flexible: idea.dateFlexible ?? false,
    link: idea.link ?? null,
    budget_note: idea.budgetNote ?? null,
    proposed_by: idea.proposedBy,
    status: idea.status,
    timing: idea.timing,
    tags: idea.tags,
    votes: idea.votes,
    revealed: idea.revealed,
    soft_veto_user_ids: idea.softVetoUserIds,
    created_at: idea.createdAt,
  });
  if (error) console.error("insert idea", error.message);
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
): Promise<void> {
  const { error } = await supabase.from("expenses").insert({
    id: expense.id,
    group_id: expense.groupId,
    idea_id: expense.ideaId ?? null,
    title: expense.title,
    amount_cents: expense.amountCents,
    paid_by: expense.paidBy,
    split_between: expense.splitBetween,
    created_at: expense.createdAt,
  });
  if (error) console.error("insert expense", error.message);
}

export async function cloudInsertPoint(
  supabase: Supabase,
  point: PointEvent,
): Promise<void> {
  const { error } = await supabase.from("point_events").insert({
    id: point.id,
    group_id: point.groupId,
    user_id: point.userId,
    delta: point.delta,
    reason: point.reason,
    at: point.at,
  });
  if (error) console.error("insert point", error.message);
}

export function newCloudId(): string {
  return crypto.randomUUID();
}
