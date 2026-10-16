import webpush from "web-push";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  isPushConfigured,
  vapidPrivateKey,
  vapidPublicKey,
  vapidSubject,
} from "@/lib/push/vapid";
import { supabaseUrl } from "@/lib/supabase/env";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type SubRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function adminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createAdminClient(supabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Sends Web Push to all subscriptions of the given users.
 * Soft-fails if VAPID / service role missing (local / half-configured).
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number; skipped: string }> {
  if (!userIds.length) return { sent: 0, failed: 0, skipped: "no_users" };
  if (!isPushConfigured()) {
    return { sent: 0, failed: 0, skipped: "vapid_not_configured" };
  }

  const admin = adminClient();
  if (!admin) {
    return { sent: 0, failed: 0, skipped: "no_service_role" };
  }

  webpush.setVapidDetails(
    vapidSubject(),
    vapidPublicKey(),
    vapidPrivateKey(),
  );

  const { data, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (error) {
    console.error("[push] load subs", error.message);
    return { sent: 0, failed: 0, skipped: "load_error" };
  }

  const rows = (data ?? []) as SubRow[];
  if (!rows.length) return { sent: 0, failed: 0, skipped: "no_subscriptions" };

  let sent = 0;
  let failed = 0;
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/app/notifications",
    tag: payload.tag ?? "juntada",
  });

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          body,
          { TTL: 60 * 60 * 12, urgency: "normal" },
        );
        sent += 1;
      } catch (e) {
        failed += 1;
        const status =
          e && typeof e === "object" && "statusCode" in e
            ? Number((e as { statusCode: number }).statusCode)
            : 0;
        // Gone / expired subscription → drop
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", row.id);
        } else {
          console.error("[push] send", status || e);
        }
      }
    }),
  );

  return { sent, failed, skipped: "" };
}
