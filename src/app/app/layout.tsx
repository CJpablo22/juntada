"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { AppHeader } from "@/components/shell/app-header";
import { useApp } from "@/components/providers/app-provider";
import { createClient } from "@/lib/supabase/client";

const cloudConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function AppShellLayout({ children }: { children: ReactNode }) {
  const { ready, currentUser } = useApp();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const onOnboarding = pathname.startsWith("/app/onboarding");
  const [syncTried, setSyncTried] = useState(false);

  // Si hay cookies de sesión pero el provider aún no tiene user (login API),
  // forzá un reload una sola vez en vez de quedar en "Cargando…" eterno.
  useEffect(() => {
    if (!ready || currentUser || syncTried || !cloudConfigured) return;
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (user) {
          window.location.reload();
          return;
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setSyncTried(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, currentUser, syncTried]);

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      if (cloudConfigured && !syncTried) return;
      router.replace("/enter");
      return;
    }
    if (!currentUser.profileComplete && !onOnboarding) {
      router.replace("/app/onboarding");
    }
  }, [ready, currentUser, router, onOnboarding, syncTried]);

  if (!ready || !currentUser) {
    return (
      <div className="grid min-h-[100svh] place-items-center px-4 text-[var(--mute)]">
        Cargando tu Juntada…
      </div>
    );
  }

  if (!currentUser.profileComplete && !onOnboarding) {
    return (
      <div className="grid min-h-[100svh] place-items-center px-4 text-[var(--mute)]">
        Completando perfil…
      </div>
    );
  }

  return (
    <div className="flex min-h-[100svh] flex-col">
      {!onOnboarding ? <AppHeader /> : null}
      <div className="page-shell flex-1 pb-20 md:pb-8">{children}</div>
      {!onOnboarding ? <InstallPrompt variant="banner" /> : null}
    </div>
  );
}
