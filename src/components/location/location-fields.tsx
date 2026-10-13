"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  filterCities,
  getCities,
  getNeighborhoods,
  getProvinces,
  LOCATIONS,
} from "@/lib/locations";

export type LocationFormValue = {
  country: string;
  province: string;
  city: string;
  neighborhood: string;
  addressLine: string;
  /** Piso, puerta, letra, depto — aparte de la calle */
  floorUnit: string;
  postalCode: string;
};

type AddressHit = {
  id: string;
  label: string;
  addressLine: string;
  postalCode: string;
  neighborhood: string;
  city: string;
  province: string;
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
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
                addressLine: "",
                postalCode: "",
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
        <div className="space-y-1.5">
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
                addressLine: "",
                postalCode: "",
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

      <div className="grid gap-3 sm:grid-cols-2">
        <CityCombobox
          country={value.country}
          province={value.province}
          value={value.city}
          onChange={(city) => {
            const bars = getNeighborhoods(
              value.country,
              value.province,
              city,
            );
            patch({
              city,
              neighborhood: bars[0] ?? "",
              addressLine: "",
              postalCode: "",
            });
          }}
        />
        <div className="space-y-1.5">
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
        <div className="space-y-3 border-t border-[var(--line)] pt-4">
          <div>
            <p className="text-[15px] font-semibold text-[var(--ink)]">
              Dirección (para recomendaciones)
            </p>
            <p className="mt-1 text-sm text-[var(--mute)]">
              Buscá la calle y elegí una opción: el código postal se completa
              solo. El piso o letra va aparte. Nada se guarda hasta que pulses
              Guardar.
            </p>
          </div>
          <AddressSearch
            country={value.country}
            province={value.province}
            city={value.city}
            value={value.addressLine}
            onChangeAddress={(addressLine) => patch({ addressLine })}
            onPick={(hit) => {
              const next: Partial<LocationFormValue> = {
                addressLine: hit.addressLine,
                postalCode: hit.postalCode || value.postalCode,
              };
              if (
                hit.neighborhood &&
                neighborhoods.includes(hit.neighborhood)
              ) {
                next.neighborhood = hit.neighborhood;
              }
              patch(next);
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="floorUnit">Piso / puerta / letra</Label>
              <Input
                id="floorUnit"
                value={value.floorUnit}
                onChange={(e) => patch({ floorUnit: e.target.value })}
                placeholder="3º B · Depto 8"
                className="field-input"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">Código postal</Label>
              <Input
                id="postalCode"
                value={value.postalCode}
                onChange={(e) => patch({ postalCode: e.target.value })}
                placeholder="Se completa al elegir la calle"
                className="field-input"
                inputMode="numeric"
                autoComplete="postal-code"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CityCombobox({
  country,
  province,
  value,
  onChange,
}: {
  country: string;
  province: string;
  value: string;
  onChange: (city: string) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const total = getCities(country, province).length;

  useEffect(() => {
    setQuery(value);
  }, [value, province, country]);

  const options = useMemo(
    () => filterCities(country, province, query, 100),
    [country, province, query],
  );

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative space-y-1.5" ref={rootRef}>
      <Label htmlFor="city-search">
        Localidad{" "}
        <span className="font-normal text-[var(--mute)]">({total})</span>
      </Label>
      <Input
        id="city-search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Escribí para buscar…"
        className="field-input"
        autoComplete="off"
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto border border-[var(--ink)] bg-white shadow-[3px_3px_0_0_var(--line)]"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--mute)]">
              Sin coincidencias en {province}
            </li>
          ) : (
            options.map((c) => (
              <li key={c.name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.name === value}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--wash)]"
                  onClick={() => {
                    onChange(c.name);
                    setQuery(c.name);
                    setOpen(false);
                  }}
                >
                  {c.name}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

function AddressSearch({
  country,
  province,
  city,
  value,
  onChangeAddress,
  onPick,
}: {
  country: string;
  province: string;
  city: string;
  value: string;
  onChangeAddress: (addressLine: string) => void;
  onPick: (hit: AddressHit) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<AddressHit[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) {
      setHits([]);
      setLoading(false);
      setError("");
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          q,
          country,
          city,
          province,
        });
        const res = await fetch(`/api/address-search?${params}`);
        const data = (await res.json()) as {
          results?: AddressHit[];
          error?: string;
        };
        if (cancelled) return;
        setHits(data.results ?? []);
        if (data.error && !(data.results?.length)) {
          setError("No se pudo buscar ahora. Podés escribir la calle a mano.");
        }
        setOpen(true);
      } catch {
        if (!cancelled) {
          setHits([]);
          setError("No se pudo buscar ahora. Podés escribir la calle a mano.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [value, country, city, province]);

  return (
    <div className="relative space-y-1.5" ref={rootRef}>
      <Label htmlFor="addressLine">Calle y número</Label>
      <Input
        id="addressLine"
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        value={value}
        onChange={(e) => {
          onChangeAddress(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (hits.length) setOpen(true);
        }}
        placeholder="Empezá a escribir la calle…"
        className="field-input"
        autoComplete="street-address"
      />
      {loading ? (
        <p className="text-xs text-[var(--mute)]">Buscando calles…</p>
      ) : null}
      {error ? <p className="text-xs text-[var(--mute)]">{error}</p> : null}
      {open && hits.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto border border-[var(--ink)] bg-white shadow-[3px_3px_0_0_var(--line)]"
        >
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                role="option"
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--wash)]"
                onClick={() => {
                  onPick(hit);
                  setOpen(false);
                }}
              >
                <span className="block font-medium text-[var(--ink)]">
                  {hit.addressLine}
                  {hit.postalCode ? (
                    <span className="ml-2 font-normal text-[var(--pop)]">
                      CP {hit.postalCode}
                    </span>
                  ) : null}
                </span>
                <span className="block text-xs text-[var(--mute)]">
                  {hit.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
