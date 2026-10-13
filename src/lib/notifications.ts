/**
 * Cola de notificaciones.
 * Ahora: canal `email` (gratis vía Resend o log en dev).
 * Pendiente (LAUNCH.md): whatsapp, push nativo.
 */

export type NotificationChannel = "email" | "whatsapp" | "push";

export type NotificationEventType =
  | "group_invite"
  | "idea_proposed"
  | "vote_needed"
  | "votes_revealed"
  | "idea_chosen"
  | "expense_added"
  | "generic";

export type NotificationInput = {
  userId: string;
  email?: string | null;
  channel?: NotificationChannel;
  eventType: NotificationEventType;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
};

/** Canales listos hoy vs pendientes de coste/config */
export const NOTIFICATION_CHANNELS = {
  ready: ["email"] as const,
  pending: ["whatsapp", "push"] as const,
};

export async function enqueueNotification(
  input: NotificationInput,
): Promise<{ ok: boolean; detail: string }> {
  const channel = input.channel ?? "email";

  if (channel !== "email") {
    return {
      ok: false,
      detail: `Canal ${channel} pendiente (ver LAUNCH.md). Solo email es gratis ahora.`,
    };
  }

  if (!input.email) {
    return { ok: false, detail: "Sin email de destino" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM ?? "Juntada <onboarding@resend.dev>";

  if (!apiKey) {
    // Dev / sin Resend: no falla el flujo de la app
    console.info("[notify:email:skipped]", {
      to: input.email,
      title: input.title,
      body: input.body,
    });
    return {
      ok: true,
      detail: "skipped_no_resend_key",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.email],
        subject: input.title,
        text: input.body,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, detail: text.slice(0, 200) };
    }
    return { ok: true, detail: "sent" };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}
