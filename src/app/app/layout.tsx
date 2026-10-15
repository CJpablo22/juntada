"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppHeader } from "@/components/shell/app-header";
import { useApp } from "@/components/providers/app-provider";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  const { ready, currentUser } = useApp();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const onOnboarding = pathname.startsWith("/app/onboarding");

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      router.replace("/enter");
      return;
    }
    if (!currentUser.profileComplete && !onOnboarding) {
      router.replace("/app/onboarding");
    }
  }, [ready, currentUser, router, onOnboarding]);

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
    </div>
  );
}
