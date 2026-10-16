import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { sendPushToUsers } from "@/lib/push/send";

type Body = {
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
  excludeSelf?: boolean;
};

/**
 * Encola avisos in-app para el grupo y, si hay VAPID + suscripciones, Web Push.
 */
export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (!body.groupId || !body.eventType || !body.title?.trim()) {
    return NextResponse.json({ ok: false, error: "missing fields" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, detail: "local_mode" });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const title = body.title.trim();
    const text = body.body ?? "";

    const { data, error } = await supabase.rpc("enqueue_group_notifications", {
      p_group_id: body.groupId,
      p_event_type: body.eventType,
      p_title: title,
      p_body: text,
      p_payload: body.payload ?? {},
      p_exclude_self: body.excludeSelf ?? true,
    });

    if (error) {
      console.info("[notify:rpc]", error.message);
      return NextResponse.json({
        ok: true,
        detail: "rpc_unavailable",
        error: error.message,
      });
    }

    const rows = (data ?? []) as { id?: string; user_id?: string }[];
    const userIds = [
      ...new Set(
        rows
          .map((r) => r.user_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0),
      ),
    ];

    let push = { sent: 0, failed: 0, skipped: "not_attempted" };
    if (userIds.length) {
      const ideaId =
        typeof body.payload?.ideaId === "string" ? body.payload.ideaId : "";
      const url = ideaId
        ? `/app/group/${body.groupId}/idea/${ideaId}`
        : "/app/notifications";
      push = await sendPushToUsers(userIds, {
        title,
        body: text,
        url,
        tag: `juntada-${body.eventType}`,
      });
    }

    return NextResponse.json({
      ok: true,
      queued: rows.length,
      channel: "in_app",
      push,
    });
  } catch (e) {
    console.error("[notify]", e);
    return NextResponse.json({ ok: true, detail: "notify_soft_fail" });
  }
}
