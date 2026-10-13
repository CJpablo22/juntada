"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppHeader } from "@/components/shell/app-header";
import { useApp } from "@/components/providers/app-provider";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  const { ready, currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && !currentUser) router.replace("/enter");
  }, [ready, currentUser, router]);

  if (!ready || !currentUser) {
    return (
      <div className="grid min-h-[100svh] place-items-center px-4 text-[var(--mute)]">
        Cargando tu Juntada…
      </div>
    );
  }

  return (
    <div className="flex min-h-[100svh] flex-col">
      <AppHeader />
      <div className="page-shell flex-1">{children}</div>
    </div>
  );
}
