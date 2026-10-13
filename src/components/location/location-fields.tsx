"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  getCities,
  getNeighborhoods,
  getProvinces,
  LOCATIONS,
} from "@/lib/locations";
import type { AddressDetailLevel } from "@/lib/types";

export type LocationFormValue = {
  country: string;
  province: string;
  city: string;
  neighborhood: string;
  addressLine: string;
  postalCode: string;
  shareAddressInGroups: boolean;
  addressDetailLevel: AddressDetailLevel;
};

export function LocationFields({
  value,
  onChange,
  showAddress = true,
}: {
  value: LocationFormValue;
  onChange: (next: LocationFormValue) => void;
  showAddress?: boolean;
}) {
  const provinces = getProvinces(value.country);
  const cities = getCities(value.country, value.province);
  const neighborhoods = getNeighborhoods(
    value.country,
    value.province,
    value.city,
  );

  function patch(partial: Partial<LocationFormValue>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
          <select
            id="country"
            value={value.country}
            onChange={(e) => {
              const country = e.target.value;
              const firstProvince = getProvinces(country)[0];
              const firstCity = firstProvince?.cities[0];
              patch({
                country,
                province: firstProvince?.name ?? "",
                city: firstCity?.name ?? "",
                neighborhood: firstCity?.neighborhoods[0] ?? "",
              });
            }}
            className="field-select"
          >
            {LOCATIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="province">Provincia</Label>
          <select
            id="province"
            value={value.province}
            onChange={(e) => {
              const province = e.target.value;
              const firstCity = getCities(value.country, province)[0];
              patch({
                province,
                city: firstCity?.name ?? "",
                neighborhood: firstCity?.neighborhoods[0] ?? "",
              });
            }}
            className="field-select"
          >
            {provinces.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <select
            id="city"
            value={value.city}
            onChange={(e) => {
              const city = e.target.value;
              const bars = getNeighborhoods(
                value.country,
                value.province,
                city,
              );
              patch({
                city,
                neighborhood: bars[0] ?? "",
              });
            }}
            className="field-select"
          >
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Barrio</Label>
          <select
            id="neighborhood"
            value={value.neighborhood}
            onChange={(e) => patch({ neighborhood: e.target.value })}
            className="field-select"
          >
            {neighborhoods.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showAddress ? (
        <div className="space-y-4 rounded-[var(--panel-radius)] border border-[var(--brand-line)] bg-white/50 p-4">
          <div>
            <p className="font-[family-name:var(--font-display-active)] text-lg font-semibold text-[var(--brand-ink)]">
              Dirección completa
            </p>
            <p className="mt-1 text-sm text-[var(--brand-mute)]">
              Sirve para recomendarte sitios cerca. Por defecto nadie la ve.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine">Calle y número</Label>
            <Input
              id="addressLine"
              value={value.addressLine}
              onChange={(e) => patch({ addressLine: e.target.value })}
              placeholder="Ej. Calle de la Palma 16"
              className="field-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Código postal</Label>
            <Input
              id="postalCode"
              value={value.postalCode}
              onChange={(e) => patch({ postalCode: e.target.value })}
              placeholder="28004"
              className="field-input"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-[var(--brand-ink)]">
            <input
              type="checkbox"
              checked={value.shareAddressInGroups}
              onChange={(e) =>
                patch({ shareAddressInGroups: e.target.checked })
              }
              className="mt-1 size-4 accent-[var(--brand-pop)]"
            />
            <span>
              En mis grupos, permitir que vean mi ubicación
              <span className="mt-0.5 block text-xs text-[var(--brand-mute)]">
                Si no marcás esto, solo se ve ciudad/provincia. Nunca se muestra
                a gente de fuera del grupo.
              </span>
            </span>
          </label>

          {value.shareAddressInGroups ? (
            <div className="space-y-2">
              <Label>Qué pueden ver tus compañeros de grupo</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => patch({ addressDetailLevel: "neighborhood" })}
                  className={
                    value.addressDetailLevel === "neighborhood"
                      ? "choice-card choice-card-active"
                      : "choice-card"
                  }
                >
                  <span className="block font-semibold">Solo barrio</span>
                  <span className="mt-1 block text-xs opacity-80">
                    Ej. Malasaña, Madrid
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => patch({ addressDetailLevel: "exact" })}
                  className={
                    value.addressDetailLevel === "exact"
                      ? "choice-card choice-card-active"
                      : "choice-card"
                  }
                >
                  <span className="block font-semibold">Dirección exacta</span>
                  <span className="mt-1 block text-xs opacity-80">
                    Calle, número y CP
                  </span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
