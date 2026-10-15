import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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
 * Encola avisos in-app para el grupo. No manda correo.
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

    const { data, error } = await supabase.rpc("enqueue_group_notifications", {
      p_group_id: body.groupId,
      p_event_type: body.eventType,
      p_title: body.title.trim(),
      p_body: body.body ?? "",
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

    const rows = (data ?? []) as unknown[];
    return NextResponse.json({
      ok: true,
      queued: rows.length,
      channel: "in_app",
    });
  } catch (e) {
    console.error("[notify]", e);
    return NextResponse.json({ ok: true, detail: "notify_soft_fail" });
  }
}
