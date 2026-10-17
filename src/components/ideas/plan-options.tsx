"use client";

import { FormEvent, useMemo, useState } from "react";
import { Heart, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-chip";
import {
  formatOptionPlace,
  formatOptionWhen,
  myPreferredOptionId,
} from "@/lib/plan-options";
import { memberHomePlace } from "@/lib/places";
import {
  IDEA_TYPE_LABELS,
  MAX_PLAN_OPTIONS,
  type IdeaType,
  type PlanOption,
  type User,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Draft = {
  title: string;
  placeName: string;
  placeAddress: string;
  memberHomeId: string;
  scheduledDate: string;
  scheduledTime: string;
};

const emptyDraft = (): Draft => ({
  title: "",
  placeName: "",
  placeAddress: "",
  memberHomeId: "",
  scheduledDate: "",
  scheduledTime: "",
});

function titlePlaceholder(type: IdeaType): string {
  switch (type) {
    case "series":
      return "Otra serie…";
    case "movie":
      return "Otra película…";
    case "food":
      return "Otro sitio / plan de comida…";
    case "visit":
      return "Otro lugar a visitar…";
    case "birthday":
      return "Otra forma de festejar…";
    default:
      return "Otra propuesta…";
  }
}

/** Alternativas dentro de la misma idea (qué / dónde / cuándo) + Me gusta. */
export function PlanOptionsSection({
  options,
  members,
  currentUserId,
  ideaProposerId,
  ideaType,
  canEdit,
  currentPlaceHint,
  onAdd,
  onVote,
  onRemove,
}: {
  options: PlanOption[];
  members: User[];
  currentUserId: string;
  ideaProposerId: string;
  ideaType: IdeaType;
  canEdit: boolean;
  currentPlaceHint?: string | null;
  onAdd: (input: {
    title?: string;
    placeName?: string;
    placeAddress?: string;
    memberHomeId?: string;
    scheduledDate?: string;
    scheduledTime?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onVote: (optionId: string) => Promise<{ ok: boolean; error?: string }>;
  onRemove: (optionId: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [openForm, setOpenForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [flashId, setFlashId] = useState<string | null>(null);

  const myOption = useMemo(
    () => options.find((o) => o.proposedBy === currentUserId),
    [options, currentUserId],
  );
  const preferredId = myPreferredOptionId(options, currentUserId);
  const atCap = options.length >= MAX_PLAN_OPTIONS;
  const canPropose = canEdit && !myOption && !atCap;
  const typeLabel = IDEA_TYPE_LABELS[ideaType].toLowerCase();

  const sorted = useMemo(() => {
    return [...options].sort((a, b) => {
      const dv = b.preferVotes.length - a.preferVotes.length;
      if (dv !== 0) return dv;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [options]);

  function nameOf(userId: string) {
    return members.find((m) => m.id === userId)?.name ?? "Alguien";
  }

  function userOf(userId: string) {
    return members.find((m) => m.id === userId);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const result = await onAdd({
      title: draft.title,
      placeName: draft.placeName,
      placeAddress: draft.placeAddress,
      memberHomeId: draft.memberHomeId || undefined,
      scheduledDate: draft.scheduledDate,
      scheduledTime: draft.scheduledTime,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "No se pudo guardar.");
      return;
    }
    setDraft(emptyDraft());
    setOpenForm(false);
  }

  async function vote(optionId: string) {
    setError("");
    setBusy(true);
    const result = await onVote(optionId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "No se pudo votar.");
      return;
    }
    setFlashId(optionId);
    setTimeout(() => setFlashId(null), 400);
  }

  async function remove(optionId: string) {
    setError("");
    setBusy(true);
    const result = await onRemove(optionId);
    setBusy(false);
    if (!result.ok) setError(result.error ?? "No se pudo sacar.");
  }

  return (
    <section className="surface-panel space-y-3 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mute)]">
          Alternativas · misma idea
        </p>
        <p className="mt-1 text-sm text-[var(--mute)] break-words">
          No crees otra idea: proponé otra {typeLabel}, otro lugar u otro
          horario acá. Cada uno una opción (máx {MAX_PLAN_OPTIONS}). Tocá{" "}
          <strong className="font-medium text-[var(--ink)]">Me gusta</strong>.
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="space-y-2 border border-dashed border-[var(--line)] bg-[var(--wash)] px-3 py-4 text-sm text-[var(--mute)]">
          {currentPlaceHint ? (
            <p className="break-words">
              Ahora figura:{" "}
              <strong className="font-medium text-[var(--ink)]">
                {currentPlaceHint}
              </strong>
              . Proponé una alternativa si querés cambiar qué, dónde o cuándo.
            </p>
          ) : (
            <p>Todavía no hay opciones. Proponé la primera.</p>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((option, index) => {
            const place = formatOptionPlace(option);
            const when = formatOptionWhen(option);
            const mine = option.proposedBy === currentUserId;
            const liked = preferredId === option.id;
            const votes = option.preferVotes.length;
            const proposer = userOf(option.proposedBy);
            const canDelete =
              canEdit && (mine || currentUserId === ideaProposerId);
            const what = option.title?.trim();

            return (
              <li
                key={option.id}
                className={cn(
                  "border border-[var(--line)] bg-white p-3 transition-transform",
                  flashId === option.id && "animate-pop",
                  liked && "border-[var(--pop)]",
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--mute)]">
                        Opción {index + 1}
                      </span>
                      {votes > 0 ? (
                        <span className="text-xs font-semibold text-[var(--pop)]">
                          {votes} {votes === 1 ? "voto" : "votos"}
                        </span>
                      ) : null}
                    </div>
                    {what ? (
                      <p className="break-words text-sm font-semibold text-[var(--ink)]">
                        {what}
                      </p>
                    ) : null}
                    {place ? (
                      <p className="flex items-start gap-1.5 text-sm text-[var(--ink)]">
                        <MapPin className="mt-0.5 size-3.5 shrink-0 text-[var(--pop)]" />
                        <span className="min-w-0 break-words">{place}</span>
                      </p>
                    ) : null}
                    {when ? (
                      <p className="text-sm text-[var(--mute)]">{when}</p>
                    ) : null}
                    {!what && !place && !when ? (
                      <p className="text-sm text-[var(--mute)]">Sin detalle</p>
                    ) : null}
                    <p className="inline-flex items-center gap-1.5 pt-0.5 text-xs text-[var(--mute)]">
                      {proposer ? (
                        <UserAvatar
                          user={proposer}
                          size="sm"
                          className="size-5 text-[9px]"
                        />
                      ) : null}
                      {mine ? "Tu propuesta" : nameOf(option.proposedBy)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
                    {canEdit ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={liked ? "default" : "outline"}
                        disabled={busy}
                        onClick={() => void vote(option.id)}
                        className="min-w-[7.5rem]"
                      >
                        <Heart
                          className={cn("size-3.5", liked && "fill-current")}
                        />
                        {liked ? "Te gusta" : "Me gusta"}
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void remove(option.id)}
                        className="inline-flex items-center gap-1 text-xs text-[var(--mute)] hover:text-[var(--ink)]"
                      >
                        <Trash2 className="size-3" />
                        Sacar
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canPropose && !openForm ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            setOpenForm(true);
            setError("");
          }}
        >
          <Plus className="size-4" />
          Proponer otra
        </Button>
      ) : null}

      {myOption && canEdit ? (
        <p className="text-xs text-[var(--mute)] break-words">
          Ya propusiste una. Sacala si querés cambiar qué, lugar u horario.
        </p>
      ) : null}

      {atCap && !myOption ? (
        <p className="text-xs text-[var(--mute)]">
          Ya hay {MAX_PLAN_OPTIONS} opciones. Elegí con «Me gusta».
        </p>
      ) : null}

      {openForm && canPropose ? (
        <form
          onSubmit={(e) => void submit(e)}
          className="space-y-3 border-t border-[var(--line)] pt-3"
        >
          <p className="text-sm font-semibold text-[var(--ink)]">Tu opción</p>

          <div className="space-y-1.5">
            <Label htmlFor="opt-title">
              Qué (opcional) · {IDEA_TYPE_LABELS[ideaType]}
            </Label>
            <Input
              id="opt-title"
              className="field-input"
              placeholder={titlePlaceholder(ideaType)}
              value={draft.title}
              onChange={(e) =>
                setDraft((d) => ({ ...d, title: e.target.value }))
              }
            />
          </div>

          {members.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="opt-home">Casa de alguien (opcional)</Label>
              <select
                id="opt-home"
                className="field-select"
                value={draft.memberHomeId}
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) {
                    setDraft((d) => ({ ...d, memberHomeId: "" }));
                    return;
                  }
                  const user = members.find((m) => m.id === id);
                  if (!user) return;
                  const home = memberHomePlace(user);
                  setDraft((d) => ({
                    ...d,
                    memberHomeId: id,
                    placeName: home.name,
                    placeAddress: home.address,
                  }));
                }}
              >
                <option value="">Otro lugar…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    Casa de {m.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="opt-place">Lugar</Label>
              <Input
                id="opt-place"
                className="field-input"
                placeholder="Restaurante, parque…"
                value={draft.placeName}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    placeName: e.target.value,
                    memberHomeId: "",
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opt-address">Dirección</Label>
              <Input
                id="opt-address"
                className="field-input"
                placeholder="Calle, barrio…"
                value={draft.placeAddress}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    placeAddress: e.target.value,
                    memberHomeId: "",
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="opt-date">Fecha</Label>
              <Input
                id="opt-date"
                type="date"
                className="field-input"
                value={draft.scheduledDate}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, scheduledDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opt-time">Hora</Label>
              <Input
                id="opt-time"
                type="time"
                className="field-input"
                value={draft.scheduledTime}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, scheduledTime: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="submit" disabled={busy} className="w-full sm:w-auto">
              Publicar opción
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              className="w-full sm:w-auto"
              onClick={() => {
                setOpenForm(false);
                setDraft(emptyDraft());
                setError("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="text-sm text-[#7f1d1d] break-words">{error}</p>
      ) : null}
    </section>
  );
}
