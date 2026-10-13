"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { UserAvatar } from "@/components/ui/user-chip";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "Grupos", match: (p: string) => p === "/app" || p.startsWith("/app/group") },
  { href: "/discover", label: "Descubrir", match: (p: string) => p.startsWith("/discover") },
  { href: "/app/friends", label: "Amigos", match: (p: string) => p.startsWith("/app/friends") },
  { href: "/app/profile", label: "Perfil", match: (p: string) => p.startsWith("/app/profile") },
] as const;

export function AppHeader() {
  const { currentUser, signOut } = useApp();
  const pathname = usePathname() ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href={currentUser ? "/app" : "/"} className="shrink-0">
          <Logo />
        </Link>
        {currentUser ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <nav className="flex items-center gap-0.5" aria-label="Principal">
              {NAV.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "hidden rounded px-2.5 py-1.5 text-sm sm:inline",
                      active
                        ? "font-semibold text-[var(--ink)] underline decoration-2 underline-offset-4"
                        : "text-[var(--mute)] hover:text-[var(--ink)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Link
              href="/app/profile"
              className="inline-flex items-center gap-2 rounded px-1.5 py-1 text-sm sm:hidden"
              aria-label="Perfil"
            >
              <UserAvatar user={currentUser} size="sm" />
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-[var(--mute)]">
              Salir
            </Button>
          </div>
        ) : null}
      </div>
      {currentUser ? (
        <nav
          className="flex border-t border-[var(--line)] sm:hidden"
          aria-label="Móvil"
        >
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 py-2.5 text-center text-xs font-semibold",
                  active
                    ? "border-t-2 border-[var(--ink)] text-[var(--ink)]"
                    : "text-[var(--mute)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
