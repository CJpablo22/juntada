"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-chip";
import { getExperienceFriends } from "@/lib/friends";
import {
  badgeForRank,
  rankMembers,
  totalPointsForUser,
} from "@/lib/points";
import { REGION_OPTIONS, resolveRegionTheme } from "@/lib/regions";

export default function ProfilePage() {
  const { currentUser, state, updateProfile, resetDemo, signOut } = useApp();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [country, setCountry] = useState(currentUser?.country ?? "ES");
  const [province, setProvince] = useState(currentUser?.province ?? "Madrid");
  const [city, setCity] = useState(currentUser?.city ?? "");
  const [neighborhood, setNeighborhood] = useState(
    currentUser?.neighborhood ?? "",
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name);
    setCountry(currentUser.country || "ES");
    setProvince(currentUser.province || "Madrid");
    setCity(currentUser.city);
    setNeighborhood(currentUser.neighborhood ?? "");
  }, [currentUser]);

  const total = currentUser
    ? totalPointsForUser(state.points, currentUser.id)
    : 0;

  const theme = resolveRegionTheme({ country, province, city });
  const countryBlock = REGION_OPTIONS.find((c) => c.country === country);
  const provinceBlock = countryBlock?.provinces.find(
    (p) => p.value === province,
  );

  const friends = useMemo(
    () =>
      currentUser ? getExperienceFriends(state, currentUser.id) : [],
    [currentUser, state],
  );

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

  function onCountryChange(next: string) {
    setCountry(next);
    const first = REGION_OPTIONS.find((c) => c.country === next)?.provinces[0];
    if (first) {
      setProvince(first.value);
      setCity(first.cities[0] ?? "");
    }
  }

  function onProvinceChange(next: string) {
    setProvince(next);
    const block = countryBlock?.provinces.find((p) => p.value === next);
    if (block?.cities[0]) setCity(block.cities[0]);
  }

  function onSave(e: FormEvent) {
    e.preventDefault();
    updateProfile({ name, country, province, city, neighborhood });
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
              ? `${currentUser.neighborhood}, `
              : ""}
            {currentUser.city}
            {currentUser.province ? ` · ${currentUser.province}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="region-chip">Look {theme.label}</span>
            <span className="text-sm font-semibold text-[var(--brand-pop)]">
              {total} puntos
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--brand-mute)]">
            {theme.tagline}
          </p>
        </div>
      </Reveal>

      <Reveal delayMs={60} className="surface-panel rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="type-display text-xl font-semibold">
              Amigos de experiencia
            </p>
            <p className="mt-1 text-sm text-[var(--brand-mute)]">
              {friends.length === 0
                ? "Aún ninguno. Se desbloquean al completar planes juntos."
                : `${friends.length} persona${friends.length === 1 ? "" : "s"} con las que ya vivieron algo.`}
            </p>
          </div>
          <Link
            href="/app/friends"
            className="text-sm font-medium text-[var(--brand-pop)]"
          >
            Ver →
          </Link>
        </div>
        {friends.length > 0 ? (
          <div className="mt-4 flex -space-x-2">
            {friends.slice(0, 6).map((f) => (
              <UserAvatar key={f.user.id} user={f.user} size="sm" />
            ))}
          </div>
        ) : null}
      </Reveal>

      <Reveal delayMs={90} className="surface-panel rounded-3xl p-5">
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
                    {row.rank === 0
                      ? " · beneficio: romper empates con estilo"
                      : ""}
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
          <p className="type-display text-xl font-semibold">
            Perfil y apariencia local
          </p>
          <p className="text-sm text-[var(--brand-mute)]">
            Según país y provincia, la app cambia colores y atmósfera. Probá
            Sevilla vs Madrid y vas a notarlo al toque.
          </p>
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
              <Label htmlFor="country">País</Label>
              <select
                id="country"
                value={country}
                onChange={(e) => onCountryChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--brand-line)] bg-white px-3 text-sm"
              >
                {REGION_OPTIONS.map((c) => (
                  <option key={c.country} value={c.country}>
                    {c.countryLabel}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <select
                id="province"
                value={province}
                onChange={(e) => onProvinceChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--brand-line)] bg-white px-3 text-sm"
              >
                {(countryBlock?.provinces ?? []).map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              {provinceBlock?.cities?.length ? (
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--brand-line)] bg-white px-3 text-sm"
                >
                  {provinceBlock.cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  {!provinceBlock.cities.includes(city) && city ? (
                    <option value={city}>{city}</option>
                  ) : null}
                </select>
              ) : (
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11 rounded-xl"
                />
              )}
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
          <div className="rounded-2xl bg-white/70 px-3 py-3 text-sm">
            Vista previa:{" "}
            <strong className="text-[var(--brand-ink)]">{theme.label}</strong>
            {" — "}
            <span className="text-[var(--brand-mute)]">{theme.tagline}</span>
          </div>
          <Button
            type="submit"
            className="h-11 rounded-xl bg-[var(--brand-ink)]"
          >
            {saved ? "Guardado · look aplicado" : "Guardar"}
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
