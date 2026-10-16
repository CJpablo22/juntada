import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isPushConfigured } from "@/lib/push/vapid";
import { sendPushToUsers } from "@/lib/push/send";

/** Envía un push de prueba al usuario logueado (para diagnosticar iOS/Android). */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  if (!isPushConfigured()) {
    return NextResponse.json(
      { ok: false, error: "vapid_not_configured" },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { count, error: countError } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    return NextResponse.json(
      {
        ok: false,
        error: countError.message,
        hint: "¿Corriste el SQL 016_push_subscriptions.sql en Supabase?",
      },
      { status: 500 },
    );
  }

  if (!count) {
    return NextResponse.json(
      {
        ok: false,
        error: "no_subscription",
        hint: "Primero tocá «Activar avisos push» en este dispositivo.",
      },
      { status: 400 },
    );
  }

  const result = await sendPushToUsers([user.id], {
    title: "Juntada · prueba",
    body: "Si ves esto, los avisos push funcionan en este dispositivo.",
    url: "/app/notifications",
    tag: "juntada-test",
  });

  return NextResponse.json({
    ok: result.sent > 0,
    ...result,
    subscriptions: count,
  });
}
