"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  Copy,
  MapPin,
  Plus,
  Sparkles,
  Wallet,
} from "lucide-react";
import { LotteryButton } from "@/components/ideas/lottery-button";
import { Reveal } from "@/components/motion/reveal";
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
import {
  GROUP_KIND_LABELS,
  IDEA_TYPE_LABELS,
  type IdeaType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS: Array<"all" | IdeaType | "done"> = [
  "all",
  "movie",
  "food",
  "visit",
  "plan",
  "done",
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
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
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
      .filter((i) => {
        if (filter === "all") return i.status !== "archived";
        if (filter === "done") return i.status === "done";
        return i.type === filter && i.status !== "done" && i.status !== "archived";
      });
  }, [state.ideas, group, filter]);

  const chosen = state.ideas.find(
    (i) => i.groupId === group?.id && i.status === "chosen",
  );

  const ranking = group
    ? rankMembers(group.memberIds, state.points, group.id)
    : [];

  if (!ready || !currentUser) {
    return (
      <div className="surface-panel rounded-3xl p-6 text-[var(--brand-mute)]">
        Cargando grupo…
      </div>
    );
  }

  if (!group) {
    return (
      <div className="surface-panel rounded-3xl p-6">
        Grupo no encontrado.{" "}
        <Link href="/app" className="text-[var(--brand-pop)] underline">
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
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--brand-mute)]">
              {GROUP_KIND_LABELS[group.kind]}
            </p>
            <h1 className="type-display text-3xl font-bold text-[var(--brand-ink)] sm:text-4xl">
              {group.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {members.map((m) =>
                m ? (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-1 text-xs"
                  >
                    <UserAvatar user={m} size="sm" className="size-5 text-[10px]" />
                    {m.name}
                    {m.neighborhood ? (
                      <span className="text-[var(--brand-mute)]">
                        · {m.neighborhood}
                      </span>
                    ) : null}
                  </span>
                ) : null,
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={copyInvite}
            >
              <Copy className="size-4" />
              {copied ? "Copiado" : `Invite ${group.inviteCode}`}
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => router.push(`/app/group/${group.id}/expenses`)}
            >
              <Wallet className="size-4" />
              Gastos
            </Button>
          </div>
        </div>
      </Reveal>

      <Reveal delayMs={70} className="surface-panel rounded-3xl p-5">
        <div className="flex items-center gap-2 text-[var(--brand-ink)]">
          <Sparkles className="size-4 text-[var(--brand-sun)]" />
          <p className="type-display text-xl font-semibold">¿Qué hacemos?</p>
        </div>
        {chosen ? (
          <p className="mt-2 text-sm text-[var(--brand-mute)]">
            Ahora mismo suena fuerte:{" "}
            <Link
              href={`/app/group/${group.id}/idea/${chosen.id}`}
              className="font-semibold text-[var(--brand-pop)]"
            >
              {chosen.title}
            </Link>
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--brand-mute)]">
            No hay plan elegido todavía. Votá o tirále al azar.
          </p>
        )}
        <div className="mt-4 max-w-md">
          <LotteryButton
            onPick={() => pickRandomIdea(group.id)}
            disabled={
              !state.ideas.some(
                (i) =>
                  i.groupId === group.id &&
                  (i.status === "pending" || i.status === "chosen") &&
                  i.softVetoUserIds.length === 0,
              )
            }
          />
        </div>
      </Reveal>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    filter === f
                      ? "bg-[var(--brand-ink)] text-white"
                      : "bg-white/70 text-[var(--brand-mute)] hover:text-[var(--brand-ink)]",
                  )}
                >
                  {f === "all"
                    ? "Todas"
                    : f === "done"
                      ? "Hechas"
                      : IDEA_TYPE_LABELS[f]}
                </button>
              ))}
            </div>
            <NewIdeaDialog
              open={openIdea}
              onOpenChange={setOpenIdea}
              onSubmit={(data) => {
                const id = addIdea({ groupId: group.id, ...data });
                setOpenIdea(false);
                router.push(`/app/group/${group.id}/idea/${id}`);
              }}
            />
          </div>

          {ideas.length === 0 ? (
            <div className="surface-panel rounded-3xl p-6 text-[var(--brand-mute)]">
              No hay ideas acá todavía. Proponé la primera.
            </div>
          ) : (
            <ul className="space-y-3">
              {ideas.map((idea, idx) => {
                const proposer = state.users.find(
                  (u) => u.id === idea.proposedBy,
                );
                const voteCount = Object.keys(idea.votes).length;
                const myVote = idea.votes[currentUser.id];
                return (
                  <Reveal key={idea.id} delayMs={40 + idx * 30}>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/app/group/${group.id}/idea/${idea.id}`)
                      }
                      className={cn(
                        "surface-panel block w-full rounded-3xl p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                        idea.status === "chosen" &&
                          "ring-2 ring-[var(--brand-pop)]/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                              {IDEA_TYPE_LABELS[idea.type]}
                            </Badge>
                            {idea.status === "chosen" ? (
                              <Badge className="bg-[var(--brand-pop)] text-white">
                                Elegida
                              </Badge>
                            ) : null}
                            {idea.status === "done" ? (
                              <Badge variant="outline">Hecha</Badge>
                            ) : null}
                          </div>
                          <p className="type-display mt-2 text-xl font-semibold text-[var(--brand-ink)]">
                            {idea.title}
                          </p>
                          {idea.notes ? (
                            <p className="mt-1 line-clamp-2 text-sm text-[var(--brand-mute)]">
                              {idea.notes}
                            </p>
                          ) : null}
                        </div>
                        {proposer ? <UserAvatar user={proposer} /> : null}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--brand-mute)]">
                        {idea.address ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {idea.address}
                          </span>
                        ) : null}
                        <span>
                          {idea.revealed
                            ? `${voteCount} votos revelados`
                            : myVote
                              ? `Tu voto: ${myVote} · secreto`
                              : `${voteCount} votos secretos`}
                        </span>
                      </div>
                    </button>
                  </Reveal>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="space-y-4">
          <div className="surface-panel rounded-3xl p-5">
            <p className="type-display text-lg font-semibold text-[var(--brand-ink)]">
              Ranking del grupo
            </p>
            <ul className="mt-4 space-y-3">
              {ranking.map((row, index) => {
                const user = state.users.find((u) => u.id === row.userId);
                if (!user) return null;
                return (
                  <li
                    key={row.userId}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-5 text-sm font-semibold text-[var(--brand-mute)]">
                        {index + 1}
                      </span>
                      <UserAvatar user={user} size="sm" />
                      <span>
                        <span className="block text-sm font-medium">
                          {user.name}
                        </span>
                        <span className="block text-xs text-[var(--brand-mute)]">
                          {badgeForRank(index, row.points)}
                        </span>
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-[var(--brand-pop)]">
                      {row.points} pts
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

function NewIdeaDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    type: IdeaType;
    title: string;
    notes: string;
    address?: string;
    tags: string[];
  }) => void;
}) {
  const [type, setType] = useState<IdeaType>("plan");
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
      tags: tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setTitle("");
    setNotes("");
    setAddress("");
    setTagInput("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-ink)] px-3 text-sm font-medium text-white">
        <Plus className="size-4" />
        Proponer
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="type-display text-2xl">
            Nueva idea
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as IdeaType)}
              className="h-11 w-full rounded-xl border border-[var(--brand-line)] bg-white px-3 text-sm"
            >
              {Object.entries(IDEA_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Brunch en Lavapiés"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Por qué pinta bien…"
              className="min-h-24 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Dirección (opcional)</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, ciudad"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (coma)</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="barato, noche, cerca"
              className="h-11 rounded-xl"
            />
          </div>
          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-[var(--brand-pop)] text-white"
          >
            Guardar idea
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
