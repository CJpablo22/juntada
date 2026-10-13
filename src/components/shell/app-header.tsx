"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { UserAvatar } from "@/components/ui/user-chip";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { currentUser, signOut } = useApp();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--brand-line)]/70 bg-[color-mix(in_oklab,var(--brand-foam)_82%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href={currentUser ? "/app" : "/"} className="shrink-0">
          <Logo />
        </Link>
        {currentUser ? (
          <div className="flex items-center gap-2">
            <Link
              href="/discover"
              className="hidden text-sm font-medium text-[var(--brand-mute)] transition hover:text-[var(--brand-ink)] sm:inline"
            >
              Descubrir
            </Link>
            <Link
              href="/app/friends"
              className="hidden text-sm font-medium text-[var(--brand-mute)] transition hover:text-[var(--brand-ink)] md:inline"
            >
              Amigos
            </Link>
            <Link
              href="/app/profile"
              className="inline-flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-black/5"
            >
              <UserAvatar user={currentUser} size="sm" />
              <span className="hidden text-sm font-medium text-[var(--brand-ink)] sm:inline">
                {currentUser.name}
              </span>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Salir
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
