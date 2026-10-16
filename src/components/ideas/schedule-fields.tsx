"use client";

import { CalendarClock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isMapsLink } from "@/lib/maps";
import {
  DURATION_OPTIONS,
  type IdeaScheduleInput,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function ScheduleFields({
  value,
  onChange,
  className,
  compact = false,
  /** Si el plan es en casa de alguien: no pedir link de Maps (se abre la dirección). */
  omitMapsLink = false,
}: {
  value: IdeaScheduleInput;
  onChange: (next: IdeaScheduleInput) => void;
  className?: string;
  compact?: boolean;
  omitMapsLink?: boolean;
}) {
  const durationValue =
    value.durationMinutes &&
    DURATION_OPTIONS.some((o) => o.value === value.durationMinutes)
      ? String(value.durationMinutes)
      : value.durationMinutes
        ? "custom"
        : "";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <CalendarClock className="size-4 text-[var(--pop)]" aria-hidden />
        <p className="text-sm font-semibold text-[var(--ink)]">
          ¿Cuándo?
          <span className="ml-1 font-normal text-[var(--mute)]">(opcional)</span>
        </p>
      </div>

      <div className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
        <div className="space-y-1.5">
          <Label htmlFor="idea-date">Fecha</Label>
          <Input
            id="idea-date"
            type="date"
            value={value.scheduledDate ?? ""}
            onChange={(e) =>
              onChange({ ...value, scheduledDate: e.target.value || undefined })
            }
            className="field-input"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="idea-time">Hora</Label>
          <Input
            id="idea-time"
            type="time"
            value={value.scheduledTime ?? ""}
            onChange={(e) =>
              onChange({ ...value, scheduledTime: e.target.value || undefined })
            }
            className="field-input"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="idea-duration">Duración aprox.</Label>
        <select
          id="idea-duration"
          className="field-select"
          value={durationValue}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) {
              onChange({ ...value, durationMinutes: undefined });
              return;
            }
            if (v === "custom") {
              onChange({
                ...value,
                durationMinutes: value.durationMinutes && value.durationMinutes > 0
                  ? value.durationMinutes
                  : 45,
              });
              return;
            }
            onChange({ ...value, durationMinutes: Number(v) });
          }}
        >
          <option value="">Sin definir</option>
          {DURATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value="custom">Otra…</option>
        </select>
        {durationValue === "custom" ? (
          <Input
            type="number"
            min={5}
            step={5}
            inputMode="numeric"
            value={value.durationMinutes ?? ""}
            onChange={(e) => {
              const n = Number(e.target.value);
              onChange({
                ...value,
                durationMinutes: Number.isFinite(n) && n > 0 ? n : undefined,
              });
            }}
            placeholder="Minutos"
            className="field-input mt-2"
            aria-label="Duración en minutos"
          />
        ) : null}
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-[var(--ink)]">
        <input
          type="checkbox"
          checked={Boolean(value.dateFlexible)}
          onChange={(e) =>
            onChange({ ...value, dateFlexible: e.target.checked })
          }
          className="size-4 accent-[var(--pop)]"
        />
        Fecha u hora a confirmar (flexible)
      </label>

      <div className="space-y-1.5">
        <Label htmlFor="idea-link">
          {omitMapsLink ? "Link útil (sin Maps)" : "Link útil"}
        </Label>
        {omitMapsLink ? (
          <p className="text-xs text-[var(--mute)]">
            Maps abre solo la casa elegida. Acá podés poner trailer, reserva o
            entradas — no otro mapa.
          </p>
        ) : null}
        <Input
          id="idea-link"
          type="url"
          inputMode="url"
          value={omitMapsLink && isMapsLink(value.link) ? "" : (value.link ?? "")}
          onChange={(e) => {
            const next = e.target.value || undefined;
            if (omitMapsLink && isMapsLink(next)) return;
            onChange({ ...value, link: next });
          }}
          placeholder={
            omitMapsLink
              ? "Trailer, reserva, entradas…"
              : "Trailer, reserva, mapa, entradas…"
          }
          className="field-input"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="idea-budget">Presupuesto</Label>
        <Input
          id="idea-budget"
          value={value.budgetNote ?? ""}
          onChange={(e) =>
            onChange({ ...value, budgetNote: e.target.value || undefined })
          }
          placeholder="Gratis, 15€ c/u, traer algo…"
          className="field-input"
        />
      </div>
    </div>
  );
}
