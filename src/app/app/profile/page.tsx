"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-chip";
import {
  badgeForRank,
  rankMembers,
  totalPointsForUser,
} from "@/lib/points";

export default function ProfilePage() {
  const { currentUser, state, updateProfile, resetDemo, signOut } = useApp();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [city, setCity] = useState(currentUser?.city ?? "");
  const [neighborhood, setNeighborhood] = useState(
    currentUser?.neighborhood ?? "",
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name);
    setCity(currentUser.city);
    setNeighborhood(currentUser.neighborhood ?? "");
  }, [currentUser]);

  const total = currentUser
    ? totalPointsForUser(state.points, currentUser.id)
    : 0;

  const groupBadges = useMemo(() => {
    if (!currentUser) return [];
    return state.groups
      .filter((g) => g.memberIds.includes(currentUser.id))
      .map((group) => {
        const ranking = rankMembers(group.memberIds, state.points, group.id);
        const rank = ranking.findIndex((r) => r.userId === currentUser.id);
        const pts = ranking[rank]?.points ?? 0;
        return {
          groupName: group.name,
          rank,
          pts,
          badge: badgeForRank(rank < 0 ? 99 : rank, pts),
        };
      });
  }, [currentUser, state.groups, state.points]);

  if (!currentUser) return null;

  function onSave(e: FormEvent) {
    e.preventDefault();
    updateProfile({ name, city, neighborhood });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8">
      <Reveal className="flex items-center gap-4">
        <UserAvatar user={currentUser} size="lg" />
        <div>
          <h1 className="type-display text-3xl font-bold text-[var(--brand-ink)]">
            {currentUser.name}
          </h1>
          <p className="text-[var(--brand-mute)]">
            {currentUser.neighborhood
              ? `${currentUser.neighborhood}, ${currentUser.city}`
              : currentUser.city}
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--brand-pop)]">
            {total} puntos en total
          </p>
        </div>
      </Reveal>

      <Reveal delayMs={70} className="surface-panel rounded-3xl p-5">
        <p className="type-display text-xl font-semibold">Tu reputación</p>
        <ul className="mt-4 space-y-3">
          {groupBadges.length === 0 ? (
            <li className="text-sm text-[var(--brand-mute)]">
              Entrá a un grupo para empezar a sumar.
            </li>
          ) : (
            groupBadges.map((row) => (
              <li
                key={row.groupName}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2"
              >
                <span>
                  <span className="block text-sm font-medium">
                    {row.groupName}
                  </span>
                  <span className="block text-xs text-[var(--brand-mute)]">
                    {row.badge}
                    {row.rank === 0 ? " · beneficio: romper empates con estilo" : ""}
                  </span>
                </span>
                <span className="text-sm font-semibold text-[var(--brand-pop)]">
                  {row.pts} pts
                </span>
              </li>
            ))
          )}
        </ul>
      </Reveal>

      <Reveal delayMs={120}>
        <form
          onSubmit={onSave}
          className="surface-panel space-y-4 rounded-3xl p-5"
        >
          <p className="type-display text-xl font-semibold">Editar perfil</p>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Barrio</Label>
              <Input
                id="neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="h-11 rounded-xl bg-[var(--brand-ink)]"
          >
            {saved ? "Guardado" : "Guardar"}
          </Button>
        </form>
      </Reveal>

      <Reveal delayMs={160} className="flex flex-wrap gap-2">
        <Button variant="outline" className="rounded-xl" onClick={signOut}>
          Salir
        </Button>
        <Button
          variant="ghost"
          className="rounded-xl text-[var(--brand-mute)]"
          onClick={() => {
            if (
              window.confirm(
                "Esto resetea el demo local de este navegador. ¿Seguro?",
              )
            ) {
              resetDemo();
              window.location.href = "/enter";
            }
          }}
        >
          Resetear demo local
        </Button>
      </Reveal>
    </main>
  );
}
