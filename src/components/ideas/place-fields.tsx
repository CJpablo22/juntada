"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  emptyPlace,
  memberHomePlace,
} from "@/lib/places";
import {
  ideaAllowsMultiplePlaces,
  type IdeaPlace,
  type IdeaType,
  type User,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export {
  cleanPlaces,
  ideaNeedsPlaces,
  validatePlaces,
} from "@/lib/places";

export function PlaceFields({
  type,
  places,
  onChange,
  members,
  error,
  mode = "places",
}: {
  type: IdeaType;
  places: IdeaPlace[];
  onChange: (places: IdeaPlace[]) => void;
  members: User[];
  error?: string;
  /** home = solo elegir casa de alguien; cinema = un cine; places = sitios/casas */
  mode?: "places" | "cinema" | "home";
}) {
  const multi = mode === "places" && ideaAllowsMultiplePlaces(type);
  const rows = places.length ? places : [emptyPlace()];

  function patch(index: number, next: IdeaPlace) {
    const copy = rows.map((row, i) => (i === index ? next : row));
    onChange(copy);
  }

  function setAsCustom(index: number) {
    const current = rows[index];
    patch(index, {
      kind: "custom",
      name: current?.kind === "member_home" ? "" : current?.name ?? "",
      address: current?.kind === "member_home" ? "" : current?.address ?? "",
    });
  }

  function setAsMemberHome(index: number, memberId: string) {
    const user = members.find((m) => m.id === memberId);
    if (!user) return;
    patch(index, memberHomePlace(user));
  }

  function addRow() {
    onChange([...rows, emptyPlace()]);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) {
      onChange([emptyPlace()]);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  }

  if (mode === "home") {
    const selected = rows.find((p) => p.kind === "member_home")?.memberId ?? "";
    return (
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">
            ¿Casa de quién? <span className="font-normal text-[var(--pop)]">*</span>
          </p>
          <p className="mt-1 text-xs text-[var(--mute)]">
            Se usa la dirección que esa persona tenga en su perfil.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="home-member">Persona del grupo</Label>
          <select
            id="home-member"
            value={selected}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) {
                onChange([emptyPlace()]);
                return;
              }
              const user = members.find((m) => m.id === id);
              onChange(user ? [memberHomePlace(user)] : [emptyPlace()]);
            }}
            className="field-select"
            required
          >
            <option value="">Elegí a alguien…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                Casa de {m.name}
              </option>
            ))}
          </select>
        </div>
        {selected ? (
          <p className="rounded bg-[var(--wash)] px-3 py-2 text-sm text-[var(--mute)]">
            {rows[0]?.address}
          </p>
        ) : null}
        {error ? <p className="text-sm text-[var(--pop)]">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-[var(--ink)]">
          {mode === "cinema"
            ? "Cine"
            : multi
              ? "Lugares del plan"
              : "Lugar"}{" "}
          <span className="font-normal text-[var(--pop)]">*</span>
        </p>
        <p className="mt-1 text-xs text-[var(--mute)]">
          {mode === "cinema"
            ? "Nombre del cine y su dirección."
            : multi
              ? "Sitio con dirección, o la casa de alguien del grupo. Podés sumar varios."
              : "Sitio con dirección, o la casa de alguien del grupo."}
        </p>
      </div>

      <ul className="space-y-3">
        {rows.map((place, index) => {
          const isHome = place.kind === "member_home";
          return (
            <li
              key={index}
              className="space-y-2 border border-[var(--line)] bg-white p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mute)]">
                  {mode === "cinema"
                    ? "Cine"
                    : multi
                      ? `Lugar ${index + 1}`
                      : "Sitio"}
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

              {mode !== "cinema" ? (
                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setAsCustom(index)}
                    className={cn(
                      "underline-offset-2",
                      !isHome
                        ? "font-semibold text-[var(--ink)] underline"
                        : "text-[var(--mute)]",
                    )}
                  >
                    Otro sitio
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const first = members[0];
                      if (first) setAsMemberHome(index, first.id);
                    }}
                    className={cn(
                      "underline-offset-2",
                      isHome
                        ? "font-semibold text-[var(--ink)] underline"
                        : "text-[var(--mute)]",
                    )}
                  >
                    Casa de alguien del grupo
                  </button>
                </div>
              ) : null}

              {isHome && mode !== "cinema" ? (
                <div className="space-y-1.5">
                  <Label htmlFor={`place-home-${index}`}>De quién</Label>
                  <select
                    id={`place-home-${index}`}
                    value={place.memberId ?? ""}
                    onChange={(e) => setAsMemberHome(index, e.target.value)}
                    className="field-select"
                    required
                  >
                    <option value="">Elegí a alguien…</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        Casa de {m.name}
                      </option>
                    ))}
                  </select>
                  {place.memberId ? (
                    <p className="text-xs text-[var(--mute)]">{place.address}</p>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor={`place-name-${index}`}>
                      {mode === "cinema" ? "Nombre del cine" : "Nombre del lugar"}
                    </Label>
                    <Input
                      id={`place-name-${index}`}
                      value={place.name}
                      onChange={(e) =>
                        patch(index, {
                          kind: "custom",
                          name: e.target.value,
                          address: place.address,
                        })
                      }
                      placeholder={
                        mode === "cinema"
                          ? "Ej. Cines Renoir Princesa"
                          : multi
                            ? "Ej. Escape room Tribunal"
                            : type === "food"
                              ? "Ej. Ramen Shifu"
                              : type === "birthday"
                                ? "Ej. Restó / salón"
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
                      onChange={(e) =>
                        patch(index, {
                          kind: "custom",
                          name: place.name,
                          address: e.target.value,
                        })
                      }
                      placeholder="Calle, número, ciudad"
                      className="field-input"
                      required
                    />
                  </div>
                </>
              )}
            </li>
          );
        })}
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
