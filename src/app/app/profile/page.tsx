"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { GroupPrivacySettings } from "@/components/location/group-privacy-settings";
import {
  LocationFields,
  type LocationFormValue,
} from "@/components/location/location-fields";
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
  const {
    currentUser,
    state,
    updateProfile,
    setGroupLocationVisibility,
    resetDemo,
    signOut,
  } = useApp();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [location, setLocation] = useState<LocationFormValue>({
    country: "ES",
    province: "Madrid",
    city: "Madrid",
    neighborhood: "Malasaña",
    addressLine: "",
    postalCode: "",
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
    () => (currentUser ? getExperienceFriends(state, currentUser.id) : []),
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
    updateProfile({
      name,
      country: location.country,
      province: location.province,
      city: location.city,
      neighborhood: location.neighborhood,
      addressLine: location.addressLine,
      postalCode: location.postalCode,
    });
    setError("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <UserAvatar user={currentUser} size="lg" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            {currentUser.name}
          </h1>
          <p className="text-sm text-[var(--mute)]">
            {currentUser.neighborhood ? `${currentUser.neighborhood}, ` : ""}
            {currentUser.city} · {currentUser.province}
          </p>
          <p className="mt-1 text-sm text-[var(--mute)]">
            Look {theme.label} · {total} puntos
          </p>
        </div>
      </div>

      <form onSubmit={onSave} className="surface-panel space-y-4 p-4">
        <div>
          <h2 className="text-base font-semibold">1 · Tu ubicación</h2>
          <p className="mt-1 text-sm text-[var(--mute)]">
            Primero cargá dónde estás. Después, en cada grupo, elegís cuánto
            ven los demás.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input"
          />
        </div>

        <LocationFields value={location} onChange={setLocation} />

        {error ? <p className="text-sm text-[var(--pop)]">{error}</p> : null}

        <Button
          type="submit"
          className="h-10 bg-[var(--ink)] text-white hover:bg-[var(--ink)]/90"
        >
          {saved ? "Guardado" : "Guardar ubicación"}
        </Button>
      </form>

      <section className="surface-panel p-4">
        <h2 className="text-base font-semibold">2 · Qué ven en cada grupo</h2>
        <p className="mt-1 text-sm text-[var(--mute)]">
          Se guarda al instante. En un grupo pueden ver tu calle; en otro solo
          el barrio, la provincia o el país.
        </p>
        <div className="mt-4">
          <GroupPrivacySettings
            user={currentUser}
            groups={state.groups}
            onChange={setGroupLocationVisibility}
          />
        </div>
      </section>

      <section className="surface-panel p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Amigos de experiencia</h2>
            <p className="mt-1 text-sm text-[var(--mute)]">
              {friends.length === 0
                ? "Se desbloquean al completar planes juntos."
                : `${friends.length} con experiencias compartidas.`}
            </p>
          </div>
          <Link
            href="/app/friends"
            className="text-sm font-semibold text-[var(--pop)]"
          >
            Ver
          </Link>
        </div>
      </section>

      <section className="surface-panel p-4">
        <h2 className="text-base font-semibold">Reputación</h2>
        <ul className="mt-3 space-y-2">
          {groupBadges.map((row) => (
            <li
              key={row.groupName}
              className="flex items-center justify-between text-sm"
            >
              <span>
                <span className="font-medium">{row.groupName}</span>
                <span className="ml-2 text-[var(--mute)]">{row.badge}</span>
              </span>
              <span className="font-semibold text-[var(--pop)]">
                {row.pts} pts
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={signOut}>
          Salir
        </Button>
        <Button
          variant="ghost"
          className="text-[var(--mute)]"
          onClick={() => {
            if (window.confirm("¿Resetear el demo local?")) {
              resetDemo();
              window.location.href = "/enter";
            }
          }}
        >
          Resetear demo
        </Button>
      </div>
    </main>
  );
}
