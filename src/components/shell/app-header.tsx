"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Compass,
  LogOut,
  Users,
  UserRound,
  Layers,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { UserAvatar } from "@/components/ui/user-chip";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { displayNameOrUsername } from "@/lib/display-name";
import { cn } from "@/lib/utils";

const NAV = [
  {
    href: "/app",
    label: "Grupos",
    icon: Layers,
    match: (p: string) => p === "/app" || p.startsWith("/app/group"),
  },
  {
    href: "/discover",
    label: "Descubrir",
    icon: Compass,
    match: (p: string) => p.startsWith("/discover"),
  },
  {
    href: "/app/notifications",
    label: "Avisos",
    icon: Bell,
    match: (p: string) => p.startsWith("/app/notifications"),
  },
  {
    href: "/app/friends",
    label: "Amigos",
    icon: Users,
    match: (p: string) => p.startsWith("/app/friends"),
  },
  {
    href: "/app/profile",
    label: "Perfil",
    icon: UserRound,
    match: (p: string) => p.startsWith("/app/profile"),
  },
] as const;

export function AppHeader() {
  const { currentUser, signOut } = useApp();
  const pathname = usePathname() ?? "";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link href={currentUser ? "/app" : "/"} className="shrink-0">
              <Logo />
            </Link>
          </div>
          {currentUser ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <nav
                className="hidden items-center gap-0.5 lg:flex"
                aria-label="Principal"
              >
                {NAV.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "px-2.5 py-2 text-sm transition-colors xl:px-3",
                        active
                          ? "border-b-2 border-[var(--pop)] font-semibold text-[var(--ink)]"
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
                className="hidden items-center gap-2 px-1.5 py-1 text-sm sm:inline-flex lg:hidden"
                aria-label="Perfil"
              >
                <UserAvatar user={currentUser} size="sm" />
                <span className="font-medium">
                  {displayNameOrUsername(currentUser)}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="hidden text-[var(--mute)] sm:inline-flex"
              >
                <LogOut className="size-4" />
                <span className="hidden xl:inline">Salir</span>
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      {currentUser ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--paper)]/95 pb-safe backdrop-blur-sm lg:hidden"
          aria-label="Móvil"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {NAV.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-[3.4rem] flex-col items-center justify-center gap-0.5 px-0.5 pt-2 text-[10px] font-semibold sm:text-[11px]",
                    active ? "text-[var(--ink)]" : "text-[var(--mute)]",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 place-items-center border",
                      active
                        ? "border-[var(--ink)] bg-[var(--ink)] text-white shadow-[0_2px_0_0_var(--pop)]"
                        : "border-transparent bg-transparent",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </>
  );
}
