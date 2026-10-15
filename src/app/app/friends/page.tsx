"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "@/components/providers/app-provider";
import { UserAvatar } from "@/components/ui/user-chip";
import { getExperienceFriends } from "@/lib/friends";
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
      <div>
        <p className="text-sm text-[var(--mute)]">No es Instagram</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
          Amigos de experiencia
        </h1>
        <p className="mt-2 text-[var(--mute)]">
          Solo personas con las que ya completaron algo juntos. Sin follows:
          la amistad se gana viviendo planes.
        </p>
      </div>

      <section className="surface-panel p-4">
        <p className="font-semibold text-[var(--ink)]">
          {friends.length}{" "}
          {friends.length === 1 ? "amigo/a" : "amigos/as"}
        </p>
        {friends.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--mute)]">
            Todavía no hay. Marquen un plan como hecho en un grupo compartido y
            aparecen acá.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {friends.map((friend) => {
              return (
                <li key={friend.user.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <UserAvatar user={friend.user} />
                      <span>
                        <span className="block text-sm font-semibold text-[var(--ink)]">
                          {friend.user.name}
                        </span>
                        <span className="block text-xs text-[var(--mute)]">
                          {friend.user.city} · {friend.user.province}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-xs font-semibold text-[var(--pop)]">
                      {friend.sharedCount}{" "}
                      {friend.sharedCount === 1
                        ? "experiencia"
                        : "experiencias"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--mute)]">
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
      </section>

      <p className="text-sm text-[var(--mute)]">
        ¿Querés sumar a alguien? Invitálo a tu grupo, hagan un plan y márquenlo
        como hecho.{" "}
        <Link href="/app" className="font-semibold text-[var(--pop)]">
          Ir a grupos →
        </Link>
      </p>
    </main>
  );
}
