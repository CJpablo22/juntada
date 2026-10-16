"use client";

function publicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export type PushSupport = {
  supported: boolean;
  reason?: string;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
};

export async function getPushSupport(): Promise<PushSupport> {
  if (typeof window === "undefined") {
    return { supported: false, reason: "ssr", permission: "unsupported", subscribed: false };
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return {
      supported: false,
      reason: "browser",
      permission: "unsupported",
      subscribed: false,
    };
  }
  if (!publicKey()) {
    return {
      supported: false,
      reason: "vapid",
      permission: Notification.permission,
      subscribed: false,
    };
  }
  // iOS: Web Push only when added to home screen (standalone)
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(
      (navigator as Navigator & { standalone?: boolean }).standalone,
    );
  if (isIos && !standalone) {
    return {
      supported: false,
      reason: "ios_home_screen",
      permission: Notification.permission,
      subscribed: false,
    };
  }

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return {
    supported: true,
    permission: Notification.permission,
    subscribed: Boolean(sub),
  };
}

export async function subscribeToPush(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const support = await getPushSupport();
  if (!support.supported) {
    if (support.reason === "ios_home_screen") {
      return {
        ok: false,
        error:
          "En iPhone: primero «Añadir a pantalla de inicio» y abrí Juntada desde el icono.",
      };
    }
    if (support.reason === "vapid") {
      return {
        ok: false,
        error: "Push no configurado en el servidor (faltan claves VAPID).",
      };
    }
    return { ok: false, error: "Este navegador no soporta avisos push." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "No diste permiso para avisos." };
  }

  const reg = await navigator.serviceWorker.ready;
  // Si cambió el VAPID (redeploy / claves nuevas), hay que re-suscribir.
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    try {
      await existing.unsubscribe();
    } catch {
      /* ignore */
    }
  }

  let sub: PushSubscription;
  try {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey()),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "subscribe_failed";
    return {
      ok: false,
      error: `No se pudo suscribir al push (${msg}). En iPhone usá iOS 16.4+ y abrí desde el icono.`,
    };
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, error: "El navegador no devolvió una suscripción válida." };
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      userAgent: navigator.userAgent,
    }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    return {
      ok: false,
      error:
        data.error ||
        "No se pudo guardar la suscripción (¿migración 016 en Supabase?).",
    };
  }
  return { ok: true };
}

export async function sendTestPush(): Promise<
  { ok: true; detail: string } | { ok: false; error: string }
> {
  const res = await fetch("/api/push/test", { method: "POST" });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    hint?: string;
    sent?: number;
    failed?: number;
    skipped?: string;
    subscriptions?: number;
  };
  if (!res.ok || !data.ok) {
    return {
      ok: false,
      error:
        data.hint ||
        data.error ||
        data.skipped ||
        "No se pudo enviar el aviso de prueba.",
    };
  }
  return {
    ok: true,
    detail: `Enviado (${data.sent ?? 0}). Deberías verlo ya en la pantalla.`,
  };
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    }).catch(() => {});
  }
}
