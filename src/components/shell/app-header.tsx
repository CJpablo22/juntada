"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { UserAvatar } from "@/components/ui/user-chip";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { currentUser, signOut } = useApp();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-13 max-w-5xl items-center justify-between px-4 py-3">
        <Link href={currentUser ? "/app" : "/"} className="shrink-0">
          <Logo />
        </Link>
        {currentUser ? (
          <div className="flex items-center gap-3">
            <Link
              href="/discover"
              className="hidden text-sm text-[var(--mute)] hover:text-[var(--ink)] sm:inline"
            >
              Descubrir
            </Link>
            <Link
              href="/app/friends"
              className="hidden text-sm text-[var(--mute)] hover:text-[var(--ink)] md:inline"
            >
              Amigos
            </Link>
            <Link
              href="/app/profile"
              className="inline-flex items-center gap-2 text-sm"
            >
              <UserAvatar user={currentUser} size="sm" />
              <span className="hidden font-medium sm:inline">
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
