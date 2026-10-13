"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Users } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { useApp } from "@/components/providers/app-provider";
import { UserAvatar } from "@/components/ui/user-chip";
import { getExperienceFriends } from "@/lib/friends";
import { resolveRegionTheme } from "@/lib/regions";

export default function FriendsPage() {
  const { currentUser, state } = useApp();

  const friends = useMemo(
    () =>
      currentUser ? getExperienceFriends(state, currentUser.id) : [],
    [currentUser, state],
  );

  if (!currentUser) return null;

  return (
    <main className="mx-auto max-w-2xl space-y-8">
      <Reveal>
        <p className="text-sm font-medium text-[var(--brand-mute)]">
          No es Instagram
        </p>
        <h1 className="type-display mt-1 text-3xl font-bold text-[var(--brand-ink)]">
          Amigos de experiencia
        </h1>
        <p className="mt-2 text-[var(--brand-mute)]">
          Acá solo aparecen personas con las que ya completaron algo juntos en
          un grupo. Sin follows abiertos: la amistad se gana viviendo planes.
        </p>
      </Reveal>

      <Reveal delayMs={70} className="surface-panel rounded-3xl p-5">
        <div className="flex items-center gap-2 text-[var(--brand-ink)]">
          <Users className="size-4 text-[var(--brand-pop)]" />
          <p className="type-display text-xl font-semibold">
            {friends.length}{" "}
            {friends.length === 1 ? "amigo/a" : "amigos/as"}
          </p>
        </div>
        {friends.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--brand-mute)]">
            Todavía no hay amigos de experiencia. Marquen un plan como hecho en
            un grupo compartido y aparecen acá.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {friends.map((friend) => {
              const theme = resolveRegionTheme({
                country: friend.user.country,
                province: friend.user.province,
                city: friend.user.city,
              });
              return (
                <li
                  key={friend.user.id}
                  className="rounded-2xl bg-white/70 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <UserAvatar user={friend.user} />
                      <span>
                        <span className="block text-sm font-semibold text-[var(--brand-ink)]">
                          {friend.user.name}
                        </span>
                        <span className="block text-xs text-[var(--brand-mute)]">
                          {friend.user.neighborhood
                            ? `${friend.user.neighborhood}, `
                            : ""}
                          {friend.user.city}
                          {friend.user.province
                            ? ` · ${friend.user.province}`
                            : ""}
                        </span>
                        <span className="region-chip mt-1.5">
                          Look {theme.label}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-xs font-semibold text-[var(--brand-pop)]">
                      {friend.sharedCount}{" "}
                      {friend.sharedCount === 1
                        ? "experiencia"
                        : "experiencias"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--brand-mute)]">
                    Juntos: {friend.sharedTitles.join(" · ")}
                    {friend.groupNames.length
                      ? ` · en ${friend.groupNames.join(", ")}`
                      : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Reveal>

      <Reveal delayMs={120} className="text-sm text-[var(--brand-mute)]">
        ¿Querés sumar a alguien? Invitálo a tu grupo, hagan un plan y márquenlo
        como hecho.{" "}
        <Link href="/app" className="font-medium text-[var(--brand-pop)]">
          Ir a grupos →
        </Link>
      </Reveal>
    </main>
  );
}
