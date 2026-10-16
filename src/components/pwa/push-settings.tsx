"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getPushSupport,
  subscribeToPush,
  unsubscribeFromPush,
  type PushSupport,
} from "@/lib/push/client";

const cloudConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** Activar / desactivar Web Push (Android + iPhone PWA). */
export function PushSettings() {
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function refresh() {
    setSupport(await getPushSupport());
  }

  useEffect(() => {
    void refresh();
  }, []);

  if (!cloudConfigured) {
    return (
      <section className="border border-[var(--line)] bg-[var(--mesa-foam)] p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Avisos en el móvil
        </h2>
        <p className="mt-1 text-sm text-[var(--mute)]">
          En modo local no hay push. Con Supabase + VAPID en Vercel, Android e
          iPhone (PWA) pueden recibir avisos gratis.
        </p>
      </section>
    );
  }

  async function enable() {
    setBusy(true);
    setMsg("");
    const result = await subscribeToPush();
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error);
      await refresh();
      return;
    }
    setMsg("Listo. Vas a recibir avisos del grupo en este dispositivo.");
    await refresh();
  }

  async function disable() {
    setBusy(true);
    setMsg("");
    await unsubscribeFromPush();
    setBusy(false);
    setMsg("Avisos push desactivados en este dispositivo.");
    await refresh();
  }

  const reason = support?.reason;
  const subscribed = support?.subscribed;

  return (
    <section className="border border-[var(--line)] bg-[var(--mesa-foam)] p-4">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Avisos en el móvil
      </h2>
      <p className="mt-1 text-sm text-[var(--mute)]">
        Gratis con Web Push. En Android (Chrome) y en iPhone (añadida a
        pantalla de inicio, iOS 16.4+).
      </p>

      {reason === "ios_home_screen" ? (
        <p className="mt-3 text-sm text-[var(--ink)]">
          En Safari: Compartir → <strong>Añadir a pantalla de inicio</strong>,
          abrí Juntada desde el icono y volvé acá para activar.
        </p>
      ) : null}

      {reason === "vapid" ? (
        <p className="mt-3 text-sm text-[#7f1d1d]">
          Faltan las claves VAPID en el servidor. Mirá{" "}
          <code className="text-xs">.env.example</code> / SETUP.
        </p>
      ) : null}

      {reason === "browser" ? (
        <p className="mt-3 text-sm text-[var(--mute)]">
          Este navegador no soporta push. Probá Chrome/Android o Safari en
          iPhone con la PWA instalada.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {subscribed ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void disable()}
          >
            <BellOff className="size-4" />
            Desactivar avisos
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={busy || support?.supported === false}
            onClick={() => void enable()}
          >
            <Bell className="size-4" />
            Activar avisos push
          </Button>
        )}
      </div>

      {subscribed ? (
        <p className="mt-2 text-xs text-[var(--pop)]">
          Activos en este dispositivo.
        </p>
      ) : null}
      {msg ? <p className="mt-2 text-sm text-[var(--ink)]">{msg}</p> : null}
    </section>
  );
}
