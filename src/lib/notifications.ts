/**
 * Notificaciones in-app + Web Push (PWA, gratis).
 * Mails de eventos cancelados de momento (ver LAUNCH.md).
 * WhatsApp = pendiente de coste.
 */

export type NotificationChannel = "in_app" | "email" | "whatsapp" | "push";

export type NotificationEventType =
  | "group_invite"
  | "idea_proposed"
  | "vote_needed"
  | "votes_revealed"
  | "idea_chosen"
  | "expense_added"
  | "generic";

export type AppNotification = {
  id: string;
  userId: string;
  channel: NotificationChannel;
  eventType: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  status: string;
  createdAt: string;
  readAt?: string;
};

/** Canales listos hoy vs pendientes */
export const NOTIFICATION_CHANNELS = {
  ready: ["in_app", "push"] as const,
  pending: ["email", "whatsapp"] as const,
};

/** Ya no enviamos correo: todo queda en la bandeja in-app. */
export async function enqueueNotification(_input: {
  userId: string;
  email?: string | null;
  channel?: NotificationChannel;
  eventType: NotificationEventType;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}): Promise<{ ok: boolean; detail: string }> {
  return { ok: true, detail: "in_app_only" };
}
