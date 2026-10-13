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
      <div className="grid min-h-[100svh] place-items-center text-[var(--mute)]">
        Cargando tu Juntada…
      </div>
    );
  }

  return (
    <div className="flex min-h-[100svh] flex-col">
      <AppHeader />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
