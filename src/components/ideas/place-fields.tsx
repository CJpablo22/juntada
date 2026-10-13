"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ideaAllowsMultiplePlaces,
  type IdeaPlace,
  type IdeaType,
} from "@/lib/types";

const EMPTY: IdeaPlace = { name: "", address: "" };

export function PlaceFields({
  type,
  places,
  onChange,
  error,
}: {
  type: IdeaType;
  places: IdeaPlace[];
  onChange: (places: IdeaPlace[]) => void;
  error?: string;
}) {
  const multi = ideaAllowsMultiplePlaces(type);
  const rows = places.length ? places : [{ ...EMPTY }];

  function patch(index: number, partial: Partial<IdeaPlace>) {
    const next = rows.map((row, i) =>
      i === index ? { ...row, ...partial } : row,
    );
    onChange(next);
  }

  function addRow() {
    onChange([...rows, { ...EMPTY }]);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) {
      onChange([{ ...EMPTY }]);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-[var(--ink)]">
          {multi ? "Lugares del plan" : "Lugar"}{" "}
          <span className="font-normal text-[var(--pop)]">*</span>
        </p>
        <p className="mt-1 text-xs text-[var(--mute)]">
          {multi
            ? "Obligatorio: nombre del sitio y dirección. Podés sumar varios (ruta, paradas, etc.)."
            : "Obligatorio: nombre del sitio y su dirección."}
        </p>
      </div>

      <ul className="space-y-3">
        {rows.map((place, index) => (
          <li
            key={index}
            className="space-y-2 border border-[var(--line)] bg-white p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mute)]">
                {multi ? `Lugar ${index + 1}` : "Sitio"}
              </p>
              {multi && rows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="inline-flex items-center gap-1 text-xs text-[var(--mute)] hover:text-[var(--pop)]"
                >
                  <Trash2 className="size-3.5" />
                  Quitar
                </button>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`place-name-${index}`}>Nombre del lugar</Label>
              <Input
                id={`place-name-${index}`}
                value={place.name}
                onChange={(e) => patch(index, { name: e.target.value })}
                placeholder={
                  multi
                    ? "Ej. Escape room Tribunal"
                    : type === "food"
                      ? "Ej. Ramen Shifu"
                      : "Ej. Parque del Retiro"
                }
                className="field-input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`place-address-${index}`}>Dirección</Label>
              <Input
                id={`place-address-${index}`}
                value={place.address}
                onChange={(e) => patch(index, { address: e.target.value })}
                placeholder="Calle, número, ciudad"
                className="field-input"
                required
              />
            </div>
          </li>
        ))}
      </ul>

      {multi ? (
        <Button
          type="button"
          variant="outline"
          className="h-9 border-[var(--line)]"
          onClick={addRow}
        >
          <Plus className="size-4" />
          Añadir otro lugar
        </Button>
      ) : null}

      {error ? <p className="text-sm text-[var(--pop)]">{error}</p> : null}
    </div>
  );
}

export function validatePlaces(
  type: IdeaType,
  places: IdeaPlace[],
): string | null {
  const needs =
    type === "visit" || type === "food" || type === "plan";
  if (!needs) return null;
  const clean = places
    .map((p) => ({
      name: p.name.trim(),
      address: p.address.trim(),
    }))
    .filter((p) => p.name || p.address);
  if (clean.length === 0) {
    return "Poné al menos un lugar con nombre y dirección.";
  }
  for (const p of clean) {
    if (!p.name || !p.address) {
      return "Cada lugar necesita nombre y dirección.";
    }
  }
  return null;
}

export function cleanPlaces(places: IdeaPlace[]): IdeaPlace[] {
  return places
    .map((p) => ({
      name: p.name.trim(),
      address: p.address.trim(),
    }))
    .filter((p) => p.name && p.address);
}
