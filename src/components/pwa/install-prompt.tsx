"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "juntada-pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || ios;
}

function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const chromeIos = /CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit && !chromeIos;
}

/** Banner + profile helper to install Juntada as a home-screen app. */
export function InstallPrompt({ variant = "banner" }: { variant?: "banner" | "card" }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    if (isIosSafari()) {
      setIosHint(true);
      if (variant === "card" || !dismissed) setVisible(true);
      return;
    }

    const onBip = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      if (variant === "card" || !dismissed) setVisible(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    if (variant === "card") setVisible(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [variant]);

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") {
      setVisible(false);
      setInstalled(true);
    } else {
      dismiss();
    }
  }

  if (installed) {
    if (variant !== "card") return null;
    return (
      <section className="border border-[var(--line)] bg-[var(--mesa-foam)] p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          App instalada
        </h2>
        <p className="mt-1 text-sm text-[var(--mute)]">
          Juntada está en tu pantalla de inicio. Abrila desde ahí como una app.
        </p>
      </section>
    );
  }

  if (!visible) return null;

  const canPrompt = Boolean(deferred);
  const showIos = iosHint && !canPrompt;

  if (variant === "card") {
    return (
      <section className="border border-[var(--line)] bg-[var(--mesa-foam)] p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Instalar en el móvil
        </h2>
        <p className="mt-1 text-sm text-[var(--mute)]">
          {showIos
            ? "En Safari: Compartir → «Añadir a pantalla de inicio»."
            : canPrompt
              ? "Instalá Juntada para abrirla sin el navegador."
              : "Cuando el navegador lo permita, vas a poder instalar Juntada aquí. En Chrome/Android suele aparecer tras usarla un rato."}
        </p>
        {canPrompt ? (
          <Button type="button" className="mt-3" onClick={() => void install()}>
            <Download className="size-4" />
            Instalar Juntada
          </Button>
        ) : null}
      </section>
    );
  }

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(3.6rem+var(--safe-bottom))] z-50 px-3 lg:bottom-4"
      role="status"
    >
      <div className="mx-auto flex max-w-lg items-start gap-3 border border-[var(--ink)] bg-[var(--mesa-foam)] p-3 shadow-[0_3px_0_0_var(--pop)]">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--ink)]">Llevate Juntada al móvil</p>
          <p className="mt-0.5 text-sm text-[var(--mute)]">
            {showIos
              ? "Safari → Compartir → Añadir a pantalla de inicio."
              : "Instalá la app para votar y decidir más rápido."}
          </p>
          {canPrompt ? (
            <Button type="button" size="sm" className="mt-2" onClick={() => void install()}>
              <Download className="size-4" />
              Instalar
            </Button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="grid size-8 shrink-0 place-items-center text-[var(--mute)] hover:text-[var(--ink)]"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
