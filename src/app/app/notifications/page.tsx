"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/notifications";

const cloudConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

type Row = {
  id: string;
  user_id: string;
  channel: string;
  event_type: string;
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
  status: string;
  created_at: string;
  read_at: string | null;
};

function mapRow(r: Row): AppNotification {
  return {
    id: r.id,
    userId: r.user_id,
    channel: (r.channel as AppNotification["channel"]) || "in_app",
    eventType: r.event_type,
    title: r.title,
    body: r.body,
    payload: r.payload ?? {},
    status: r.status,
    createdAt: r.created_at,
    readAt: r.read_at ?? undefined,
  };
}

export default function NotificationsPage() {
  const { currentUser } = useApp();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!currentUser || !cloudConfigured) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error: qErr } = await supabase
        .from("notification_events")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (qErr) {
        setError(qErr.message);
        setItems([]);
      } else {
        setItems(((data as Row[]) ?? []).map(mapRow));
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAllRead() {
    if (!cloudConfigured) return;
    const unread = items.filter((i) => i.status === "unread").map((i) => i.id);
    if (unread.length === 0) return;
    const supabase = createClient();
    await supabase.rpc("mark_notifications_read", { p_ids: unread });
    void load();
  }

  const unreadCount = items.filter((i) => i.status === "unread").length;

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="type-display text-2xl text-[var(--ink)] sm:text-3xl">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-[var(--mute)]">
            Solo en la app. No mandamos mails de eventos por ahora.
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
            Marcar leídas ({unreadCount})
          </Button>
        ) : null}
      </div>

      {!cloudConfigured ? (
        <p className="surface-panel p-4 text-sm text-[var(--mute)]">
          En modo local no hay bandeja compartida. Con Supabase aparecen acá los
          avisos del grupo.
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--mute)]">Cargando…</p>
      ) : null}
      {error ? <p className="text-sm text-[var(--pop)]">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <p className="surface-panel p-4 text-sm text-[var(--mute)]">
          Todavía no tenés notificaciones. Cuando alguien proponga un plan o
          sume un gasto, aparece acá.
        </p>
      ) : null}

      <ul className="space-y-2">
        {items.map((n) => {
          const ideaId =
            typeof n.payload.ideaId === "string" ? n.payload.ideaId : null;
          const groupId =
            typeof n.payload.groupId === "string" ? n.payload.groupId : null;
          const href = groupId
            ? `/app/group/${groupId}`
            : ideaId
              ? `/app`
              : "/app";
          return (
            <li
              key={n.id}
              className={`surface-panel p-4 ${
                n.status === "unread" ? "border-[var(--pop)]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {n.title}
                    {n.status === "unread" ? (
                      <span className="ml-2 text-xs font-medium text-[var(--pop)]">
                        nueva
                      </span>
                    ) : null}
                  </p>
                  {n.body ? (
                    <p className="mt-1 text-sm text-[var(--mute)]">{n.body}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[var(--mute)]">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={href}
                  className="shrink-0 text-sm font-semibold text-[var(--pop)]"
                >
                  Ver
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
