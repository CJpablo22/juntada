"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Copy, MapPin, Plus, Wallet } from "lucide-react";
import { LotteryButton } from "@/components/ideas/lottery-button";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-chip";
import { badgeForRank, rankMembers } from "@/lib/points";
import { getVisibleLocationForViewer } from "@/lib/privacy";
import {
  GROUP_KIND_LABELS,
  IDEA_TIMING_LABELS,
  IDEA_TYPE_LABELS,
  type IdeaTiming,
  type IdeaType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type ShelfFilter = "catalog" | "soon" | "done" | "all";

const SHELVES: { id: ShelfFilter; label: string }[] = [
  { id: "catalog", label: "Catálogo" },
  { id: "soon", label: "Pronto" },
  { id: "done", label: "Hechas" },
  { id: "all", label: "Todo" },
];

export default function GroupPage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const {
    ready,
    state,
    currentUser,
    addIdea,
    pickRandomIdea,
  } = useApp();
  const [shelf, setShelf] = useState<ShelfFilter>("catalog");
  const [typeFilter, setTypeFilter] = useState<"all" | IdeaType>("all");
  const [openIdea, setOpenIdea] = useState(false);
  const [copied, setCopied] = useState(false);

  const group = state.groups.find((g) => g.id === params.groupId);
  const members = useMemo(
    () =>
      group
        ? group.memberIds
            .map((id) => state.users.find((u) => u.id === id))
            .filter(Boolean)
        : [],
    [group, state.users],
  );

  const ideas = useMemo(() => {
    if (!group) return [];
    return state.ideas
      .filter((i) => i.groupId === group.id)
      .filter((i) => i.status !== "archived")
      .filter((i) => {
        if (shelf === "catalog")
          return i.timing === "catalog" && i.status !== "done";
        if (shelf === "soon")
          return i.timing === "soon" && i.status !== "done";
        if (shelf === "done") return i.status === "done";
        return true;
      })
      .filter((i) => (typeFilter === "all" ? true : i.type === typeFilter));
  }, [state.ideas, group, shelf, typeFilter]);

  const catalogCount = state.ideas.filter(
    (i) =>
      i.groupId === group?.id &&
      i.timing === "catalog" &&
      i.status !== "done" &&
      i.status !== "archived",
  ).length;
  const soonCount = state.ideas.filter(
    (i) =>
      i.groupId === group?.id &&
      i.timing === "soon" &&
      i.status !== "done" &&
      i.status !== "archived",
  ).length;

  const chosen = state.ideas.find(
    (i) =>
      i.groupId === group?.id && i.status === "chosen" && i.timing === "soon",
  );

  const ranking = group
    ? rankMembers(group.memberIds, state.points, group.id)
    : [];

  if (!ready || !currentUser) {
    return <div className="p-6 text-[var(--mute)]">Cargando grupo…</div>;
  }

  if (!group) {
    return (
      <div className="surface-panel p-5">
        Grupo no encontrado.{" "}
        <Link href="/app" className="font-semibold text-[var(--pop)] underline">
          Volver
        </Link>
      </div>
    );
  }

  const activeGroup = group;

  async function copyInvite() {
    await navigator.clipboard.writeText(activeGroup.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--mute)]">
            {GROUP_KIND_LABELS[group.kind]}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
            {group.name}
          </h1>
          <ul className="mt-4 space-y-2">
            {members.map((m) => {
              if (!m) return null;
              const visible = getVisibleLocationForViewer(m, {
                inSharedGroup: true,
                groupId: group.id,
              });
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-2 text-sm"
                  title={visible.detail}
                >
                  <UserAvatar user={m} size="sm" className="size-6 text-[10px]" />
                  <span>
                    <span className="font-medium">{m.name}</span>
                    <span className="text-[var(--mute)]">
                      {" "}
                      · {visible.label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-[var(--mute)]">
            Qué ven de vos se elige en{" "}
            <Link href="/app/profile" className="underline">
              Perfil → Qué ven en cada grupo
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-10 border-[var(--line)]" onClick={copyInvite}>
            <Copy className="size-4" />
            {copied ? "Copiado" : `Invite ${group.inviteCode}`}
          </Button>
          <Button
            variant="outline"
            className="h-10 border-[var(--line)]"
            onClick={() => router.push(`/app/group/${group.id}/expenses`)}
          >
            <Wallet className="size-4" />
            Gastos
          </Button>
        </div>
      </div>

      <section className="surface-panel p-4">
        <p className="font-semibold text-[var(--ink)]">¿Qué hacemos?</p>
        {chosen ? (
          <p className="mt-2 text-sm text-[var(--mute)]">
            Ahora mismo suena fuerte:{" "}
            <Link
              href={`/app/group/${group.id}/idea/${chosen.id}`}
              className="font-semibold text-[var(--pop)]"
            >
              {chosen.title}
            </Link>
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--mute)]">
            El azar solo mira <strong>Pronto</strong> ({soonCount}). El{" "}
            <strong>Catálogo</strong> ({catalogCount}) es para no olvidar.
          </p>
        )}
        <div className="mt-4 max-w-md">
          <LotteryButton
            onPick={() => pickRandomIdea(group.id)}
            disabled={
              !state.ideas.some(
                (i) =>
                  i.groupId === group.id &&
                  i.timing === "soon" &&
                  (i.status === "pending" || i.status === "chosen") &&
                  i.softVetoUserIds.length === 0,
              )
            }
          />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
            <div className="flex flex-wrap gap-1">
              {SHELVES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setShelf(f.id)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-semibold",
                    shelf === f.id
                      ? "border-b-2 border-[var(--ink)] text-[var(--ink)]"
                      : "text-[var(--mute)]",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <NewIdeaDialog
              open={openIdea}
              onOpenChange={setOpenIdea}
              defaultTiming={shelf === "soon" ? "soon" : "catalog"}
              onSubmit={(data) => {
                const id = addIdea({ groupId: group.id, ...data });
                setOpenIdea(false);
                router.push(`/app/group/${group.id}/idea/${id}`);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={cn(
                "underline-offset-2",
                typeFilter === "all"
                  ? "font-semibold text-[var(--ink)] underline"
                  : "text-[var(--mute)]",
              )}
            >
              Todos
            </button>
            {(Object.keys(IDEA_TYPE_LABELS) as IdeaType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "underline-offset-2",
                  typeFilter === t
                    ? "font-semibold text-[var(--ink)] underline"
                    : "text-[var(--mute)]",
                )}
              >
                {IDEA_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {ideas.length === 0 ? (
            <div className="surface-panel p-5 text-[var(--mute)]">
              {shelf === "catalog"
                ? "Catálogo vacío. Guardá series, sitios y planes para no olvidarlos."
                : shelf === "soon"
                  ? "Nada en Pronto. Pasá algo del catálogo acá cuando quieran decidir."
                  : "No hay ideas acá todavía."}
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {ideas.map((idea) => {
                const proposer = state.users.find(
                  (u) => u.id === idea.proposedBy,
                );
                const voteCount = Object.keys(idea.votes).length;
                const myVote = idea.votes[currentUser.id];
                return (
                  <li key={idea.id}>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/app/group/${group.id}/idea/${idea.id}`)
                      }
                      className={cn(
                        "block w-full py-4 text-left hover:bg-white/50",
                        idea.status === "chosen" && "bg-[var(--pop-soft)]/40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--mute)]">
                            <span>{IDEA_TYPE_LABELS[idea.type]}</span>
                            <span>·</span>
                            <span>{IDEA_TIMING_LABELS[idea.timing]}</span>
                            {idea.status === "chosen" ? (
                              <Badge className="bg-[var(--pop)] text-white">
                                Elegida
                              </Badge>
                            ) : null}
                            {idea.status === "done" ? (
                              <span>Hecha</span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-lg font-semibold text-[var(--ink)]">
                            {idea.title}
                          </p>
                          {idea.notes ? (
                            <p className="mt-1 line-clamp-2 text-sm text-[var(--mute)]">
                              {idea.notes}
                            </p>
                          ) : null}
                        </div>
                        {proposer ? <UserAvatar user={proposer} /> : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--mute)]">
                        {idea.address ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {idea.address}
                          </span>
                        ) : null}
                        {idea.timing === "soon" && idea.status !== "done" ? (
                          <span>
                            {idea.revealed
                              ? `${voteCount} votos revelados`
                              : myVote
                                ? `Tu voto: ${myVote} · secreto`
                                : `${voteCount} votos secretos`}
                          </span>
                        ) : idea.timing === "catalog" ? (
                          <span>Guardada para más adelante</span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="surface-panel p-4">
          <p className="font-semibold text-[var(--ink)]">Ranking</p>
          <ul className="mt-3 space-y-3">
            {ranking.map((row, index) => {
              const user = state.users.find((u) => u.id === row.userId);
              if (!user) return null;
              return (
                <li
                  key={row.userId}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 text-sm text-[var(--mute)]">
                      {index + 1}
                    </span>
                    <UserAvatar user={user} size="sm" />
                    <span>
                      <span className="block text-sm font-medium">
                        {user.name}
                      </span>
                      <span className="block text-xs text-[var(--mute)]">
                        {badgeForRank(index, row.points)}
                      </span>
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-[var(--pop)]">
                    {row.points} pts
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>
      </section>
    </main>
  );
}

function NewIdeaDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultTiming = "catalog",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTiming?: IdeaTiming;
  onSubmit: (data: {
    type: IdeaType;
    title: string;
    notes: string;
    address?: string;
    tags: string[];
    timing: IdeaTiming;
  }) => void;
}) {
  const [type, setType] = useState<IdeaType>("movie");
  const [timing, setTiming] = useState<IdeaTiming>(defaultTiming);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [tagInput, setTagInput] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      type,
      title,
      notes,
      address,
      timing,
      tags: tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setTitle("");
    setNotes("");
    setAddress("");
    setTagInput("");
    setTiming(defaultTiming);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="btn-primary">
        <Plus className="size-4" />
        Guardar
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTiming("catalog")}
              className={cn(
                "border px-3 py-3 text-left text-sm",
                timing === "catalog"
                  ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                  : "border-[var(--line)] bg-white",
              )}
            >
              <span className="block font-semibold">Catálogo</span>
              <span className="mt-1 block text-xs opacity-80">
                Guardar para no olvidar
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTiming("soon")}
              className={cn(
                "border px-3 py-3 text-left text-sm",
                timing === "soon"
                  ? "border-[var(--pop)] bg-[var(--pop)] text-white"
                  : "border-[var(--line)] bg-white",
              )}
            >
              <span className="block font-semibold">Pronto</span>
              <span className="mt-1 block text-xs opacity-80">
                Para decidir / este finde
              </span>
            </button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as IdeaType)}
              className="field-select"
            >
              {Object.entries(IDEA_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Severance, brunch en Lavapiés…"
              className="field-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Por qué la quieren guardar…"
              className="min-h-24"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección (opcional)</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, ciudad"
              className="field-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (coma)</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="serie, noche, cerca"
              className="field-input"
            />
          </div>
          <Button
            type="submit"
            className="h-10 w-full bg-[var(--ink)] text-white hover:bg-[var(--ink)]/90"
          >
            {timing === "catalog" ? "Guardar en catálogo" : "Meter en Pronto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
