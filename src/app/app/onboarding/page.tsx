"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LocationFields,
  type LocationFormValue,
} from "@/components/location/location-fields";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidLocation } from "@/lib/locations";

export default function OnboardingPage() {
  const { currentUser, completeOnboarding } = useApp();
  const router = useRouter();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [instagram, setInstagram] = useState(currentUser?.instagram ?? "");
  const [tiktok, setTiktok] = useState(currentUser?.tiktok ?? "");
  const [location, setLocation] = useState<LocationFormValue>({
    country: currentUser?.country || "ES",
    province: currentUser?.province || "Madrid",
    city: currentUser?.city || "Madrid",
    neighborhood: currentUser?.neighborhood ?? "",
    addressLine: currentUser?.addressLine ?? "",
    floorUnit: currentUser?.floorUnit ?? "",
    postalCode: currentUser?.postalCode ?? "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!currentUser) return null;

  if (currentUser.profileComplete) {
    router.replace("/app");
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Poné tu nombre real.");
      return;
    }
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
    if (!location.addressLine.trim()) {
      setError("La dirección (calle y número) es obligatoria.");
      return;
    }

    setBusy(true);
    const result = await completeOnboarding({
      name,
      country: location.country,
      province: location.province,
      city: location.city,
      neighborhood: location.neighborhood,
      addressLine: location.addressLine,
      floorUnit: location.floorUnit,
      postalCode: location.postalCode,
      phone: phone || undefined,
      instagram: instagram || undefined,
      tiktok: tiktok || undefined,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error || "No se pudo guardar.");
      return;
    }
    router.replace("/app");
  }

  return (
    <main className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="type-display text-2xl text-[var(--ink)] sm:text-3xl">
          Completá tu perfil
        </h1>
        <p className="mt-2 text-sm text-[var(--mute)]">
          {currentUser.username ? (
            <>
              Tu usuario es <strong>@{currentUser.username}</strong>.{" "}
            </>
          ) : null}
          Necesitamos tu nombre y dirección para recomendarte planes cerca.
          Teléfono y redes son opcionales.
        </p>
      </div>

      <form onSubmit={onSubmit} className="surface-panel space-y-4 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="realName">Nombre real</Label>
          <Input
            id="realName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input"
            required
          />
        </div>

        <LocationFields value={location} onChange={setLocation} />

        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono (opcional)</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+34 600 000 000"
            className="field-input"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ig">Instagram (opcional)</Label>
            <Input
              id="ig"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@usuario"
              className="field-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tt">TikTok (opcional)</Label>
            <Input
              id="tt"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="@usuario"
              className="field-input"
            />
          </div>
        </div>

        {error ? <p className="text-sm text-[var(--pop)]">{error}</p> : null}

        <Button type="submit" disabled={busy} className="h-10 w-full">
          {busy ? "Guardando…" : "Continuar a Juntada"}
        </Button>
      </form>
    </main>
  );
}
