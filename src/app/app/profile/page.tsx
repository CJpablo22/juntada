"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  LocationFields,
  type LocationFormValue,
} from "@/components/location/location-fields";
import { Reveal } from "@/components/motion/reveal";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-chip";
import { getExperienceFriends } from "@/lib/friends";
import { isValidLocation } from "@/lib/locations";
import {
  badgeForRank,
  rankMembers,
  totalPointsForUser,
} from "@/lib/points";
import { resolveRegionTheme } from "@/lib/regions";

export default function ProfilePage() {
  const { currentUser, state, updateProfile, resetDemo, signOut } = useApp();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [location, setLocation] = useState<LocationFormValue>({
    country: "ES",
    province: "Madrid",
    city: "Madrid",
    neighborhood: "Malasaña",
    addressLine: "",
    postalCode: "",
    shareAddressInGroups: false,
    addressDetailLevel: "neighborhood",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name);
    setLocation({
      country: currentUser.country || "ES",
      province: currentUser.province || "Madrid",
      city: currentUser.city,
      neighborhood: currentUser.neighborhood ?? "",
      addressLine: currentUser.addressLine ?? "",
      postalCode: currentUser.postalCode ?? "",
      shareAddressInGroups: currentUser.shareAddressInGroups,
      addressDetailLevel: currentUser.addressDetailLevel,
    });
  }, [currentUser]);

  const total = currentUser
    ? totalPointsForUser(state.points, currentUser.id)
    : 0;

  const theme = resolveRegionTheme({
    country: location.country,
    province: location.province,
    city: location.city,
  });

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

  function onSave(e: FormEvent) {
    e.preventDefault();
    if (
      !isValidLocation({
        country: location.country,
        province: location.province,
        city: location.city,
        neighborhood: location.neighborhood,
      })
    ) {
      setError("Elegí país, provincia, ciudad y barrio de la lista.");
      return;
    }
    if (location.shareAddressInGroups && location.addressDetailLevel === "exact") {
      if (!location.addressLine.trim()) {
        setError("Si compartís dirección exacta, completá calle y número.");
        return;
      }
    }
    updateProfile({
      name,
      country: location.country,
      province: location.province,
      city: location.city,
      neighborhood: location.neighborhood,
      addressLine: location.addressLine,
      postalCode: location.postalCode,
      shareAddressInGroups: location.shareAddressInGroups,
      addressDetailLevel: location.addressDetailLevel,
    });
    setError("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8">
      <Reveal className="flex items-center gap-4 border-b border-[var(--brand-line)] pb-6">
        <UserAvatar user={currentUser} size="lg" />
        <div>
          <h1 className="type-display text-3xl font-semibold text-[var(--brand-ink)]">
            {currentUser.name}
          </h1>
          <p className="text-[var(--brand-mute)]">
            {currentUser.neighborhood
              ? `${currentUser.neighborhood}, `
              : ""}
            {currentUser.city} · {currentUser.province}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="region-chip">Look {theme.label}</span>
            <span className="text-sm font-semibold text-[var(--brand-pop)]">
              {total} puntos
            </span>
          </div>
          <p className="mt-2 text-sm italic text-[var(--brand-mute)]">
            {theme.tagline}
          </p>
        </div>
      </Reveal>

      <Reveal delayMs={60} className="surface-panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="type-display text-xl font-semibold">
              Amigos de experiencia
            </p>
            <p className="mt-1 text-sm text-[var(--brand-mute)]">
              {friends.length === 0
                ? "Se desbloquean al completar planes juntos."
                : `${friends.length} con experiencias compartidas.`}
            </p>
          </div>
          <Link
            href="/app/friends"
            className="text-sm font-semibold text-[var(--brand-pop)]"
          >
            Ver →
          </Link>
        </div>
      </Reveal>

      <Reveal delayMs={90} className="surface-panel p-5">
        <p className="type-display text-xl font-semibold">Tu reputación</p>
        <ul className="mt-4 space-y-3">
          {groupBadges.map((row) => (
            <li
              key={row.groupName}
              className="flex items-center justify-between gap-3 border border-[var(--brand-line)] bg-white/60 px-3 py-2"
              style={{ borderRadius: "var(--btn-radius)" }}
            >
              <span>
                <span className="block text-sm font-medium">{row.groupName}</span>
                <span className="block text-xs text-[var(--brand-mute)]">
                  {row.badge}
                </span>
              </span>
              <span className="text-sm font-semibold text-[var(--brand-pop)]">
                {row.pts} pts
              </span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delayMs={120}>
        <form onSubmit={onSave} className="surface-panel space-y-5 p-5">
          <div>
            <p className="type-display text-xl font-semibold">
              Perfil y apariencia
            </p>
            <p className="mt-1 text-sm text-[var(--brand-mute)]">
              País, provincia, ciudad y barrio solo desde listas reales. La
              dirección completa es privada salvo que la compartás en grupo.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-input"
            />
          </div>

          <LocationFields value={location} onChange={setLocation} />

          <div
            className="border border-[var(--brand-line)] bg-white/60 px-3 py-3 text-sm"
            style={{ borderRadius: "var(--btn-radius)" }}
          >
            Vista previa del look:{" "}
            <strong>{theme.label}</strong> — {theme.tagline}
          </div>

          {error ? (
            <p className="text-sm text-[var(--brand-pop)]">{error}</p>
          ) : null}

          <Button
            type="submit"
            className="h-11 bg-[var(--brand-ink)] text-[var(--brand-foam)]"
          >
            {saved ? "Guardado · look aplicado" : "Guardar cambios"}
          </Button>
        </form>
      </Reveal>

      <Reveal delayMs={160} className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={signOut}>
          Salir
        </Button>
        <Button
          variant="ghost"
          className="text-[var(--brand-mute)]"
          onClick={() => {
            if (window.confirm("¿Resetear el demo local?")) {
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
