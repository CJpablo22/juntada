"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ExternalLink, Eye, MapPin, Ban } from "lucide-react";
import { ScorePicker } from "@/components/ideas/score-picker";
import { Reveal } from "@/components/motion/reveal";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/user-chip";
import { mapsUrl } from "@/lib/maps";
import { IDEA_TYPE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function IdeaDetailPage() {
  const params = useParams<{ groupId: string; ideaId: string }>();
  const {
    state,
    currentUser,
    castVote,
    toggleSoftVeto,
    revealVotes,
    chooseIdea,
    markDone,
  } = useApp();
  const [doneRating, setDoneRating] = useState(5);
  const [doneNote, setDoneNote] = useState("");
  const [flash, setFlash] = useState(false);

  const idea = state.ideas.find((i) => i.id === params.ideaId);
  const group = state.groups.find((g) => g.id === params.groupId);
  const proposer = idea
    ? state.users.find((u) => u.id === idea.proposedBy)
    : null;

  const members = useMemo(() => {
    if (!group) return [];
    return group.memberIds
      .map((id) => state.users.find((u) => u.id === id))
      .filter(Boolean);
  }, [group, state.users]);

  const average = useMemo(() => {
    if (!idea) return null;
    const values = Object.values(idea.votes);
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [idea]);

  if (!idea || !group || !currentUser) {
    return (
      <div className="surface-panel rounded-3xl p-6">
        Idea no encontrada.{" "}
        <Link href="/app" className="text-[var(--brand-pop)] underline">
          Volver
        </Link>
      </div>
    );
  }

  const myVote = idea.votes[currentUser.id];
  const vetoed = idea.softVetoUserIds.includes(currentUser.id);
  const allVoted = group.memberIds.every((id) => idea.votes[id] != null);

  function onVote(score: number) {
    castVote(idea!.id, score);
    setFlash(true);
    setTimeout(() => setFlash(false), 350);
  }

  function onDone(e: FormEvent) {
    e.preventDefault();
    markDone(idea!.id, doneRating, doneNote);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <Reveal>
        <Link
          href={`/app/group/${group.id}`}
          className="text-sm text-[var(--brand-mute)] hover:text-[var(--brand-ink)]"
        >
          ← {group.name}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{IDEA_TYPE_LABELS[idea.type]}</Badge>
          {idea.status === "chosen" ? (
            <Badge className="bg-[var(--brand-pop)] text-white">Elegida</Badge>
          ) : null}
          {idea.status === "done" ? (
            <Badge variant="outline">Hecha</Badge>
          ) : null}
        </div>
        <h1 className="type-display mt-2 text-3xl font-bold text-[var(--brand-ink)] sm:text-4xl">
          {idea.title}
        </h1>
        {idea.notes ? (
          <p className="mt-3 text-[var(--brand-mute)]">{idea.notes}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {proposer ? (
            <span className="inline-flex items-center gap-2 text-sm">
              <UserAvatar user={proposer} size="sm" />
              Propuso {proposer.name}
            </span>
          ) : null}
          {idea.address ? (
            <a
              href={mapsUrl(idea.address)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-pop)]"
            >
              <MapPin className="size-4" />
              Abrir en Maps
              <ExternalLink className="size-3.5" />
            </a>
          ) : null}
        </div>
        {idea.tags.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {idea.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/70 px-2.5 py-1 text-xs text-[var(--brand-mute)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </Reveal>

      {idea.status !== "done" ? (
        <Reveal delayMs={70} className="surface-panel space-y-4 rounded-3xl p-5">
          <div>
            <p className="type-display text-xl font-semibold text-[var(--brand-ink)]">
              Tu voto secreto
            </p>
            <p className="mt-1 text-sm text-[var(--brand-mute)]">
              Nadie ve el número hasta revelar. Sé sincero/a.
            </p>
          </div>
          <div className={cn(flash && "animate-pop")}>
            <ScorePicker value={myVote} onChange={onVote} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className={cn(
                "h-10 rounded-xl",
                vetoed && "border-[var(--brand-pop)] text-[var(--brand-pop)]",
              )}
              onClick={() => toggleSoftVeto(idea.id)}
            >
              <Ban className="size-4" />
              {vetoed ? "Sacaste el “ahora no”" : "Ahora no"}
            </Button>
            <Button
              className="h-10 rounded-xl bg-[var(--brand-ink)]"
              onClick={() => revealVotes(idea.id)}
              disabled={idea.revealed}
            >
              <Eye className="size-4" />
              {idea.revealed ? "Ya revelado" : "Revelar votos"}
            </Button>
            <Button
              className="h-10 rounded-xl bg-[var(--brand-pop)] text-white"
              onClick={() => chooseIdea(idea.id)}
              disabled={idea.status === "chosen"}
            >
              Elegir este plan
            </Button>
          </div>
          {!allVoted ? (
            <p className="text-xs text-[var(--brand-mute)]">
              Todavía faltan votos del grupo. Podés revelar igual si quieren.
            </p>
          ) : (
            <p className="text-xs text-[var(--brand-mute)]">
              Todo el grupo ya votó. Hora del reveal.
            </p>
          )}
        </Reveal>
      ) : null}

      <Reveal delayMs={120} className="surface-panel rounded-3xl p-5">
        <p className="type-display text-xl font-semibold text-[var(--brand-ink)]">
          {idea.revealed || idea.status === "done"
            ? "Resultados"
            : "Estado de votos"}
        </p>
        <ul className="mt-4 space-y-3">
          {members.map((member) => {
            if (!member) return null;
            const vote = idea.votes[member.id];
            const isMe = member.id === currentUser.id;
            return (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="inline-flex items-center gap-2">
                  <UserAvatar user={member} size="sm" />
                  <span className="text-sm font-medium">
                    {member.name}
                    {isMe ? " (vos)" : ""}
                  </span>
                </span>
                <span className="text-sm font-semibold text-[var(--brand-ink)]">
                  {vote == null
                    ? "Sin votar"
                    : idea.revealed || isMe
                      ? `${vote}/5`
                      : "••••"}
                </span>
              </li>
            );
          })}
        </ul>
        {idea.revealed && average != null ? (
          <p className="mt-4 text-sm text-[var(--brand-mute)]">
            Media del grupo:{" "}
            <strong className="text-[var(--brand-pop)]">
              {average.toFixed(1)}
            </strong>
          </p>
        ) : null}
        {idea.softVetoUserIds.length > 0 ? (
          <p className="mt-2 text-xs text-[var(--brand-mute)]">
            “Ahora no” activo:{" "}
            {idea.softVetoUserIds
              .map((id) => state.users.find((u) => u.id === id)?.name)
              .filter(Boolean)
              .join(", ")}
          </p>
        ) : null}
      </Reveal>

      {idea.status === "chosen" || idea.status === "pending" ? (
        <Reveal delayMs={160} className="surface-panel rounded-3xl p-5">
          <p className="type-display text-xl font-semibold text-[var(--brand-ink)]">
            ¿Lo hicieron?
          </p>
          <p className="mt-1 text-sm text-[var(--brand-mute)]">
            Dejá rating y una nota. Eso suma puntos y memoria al grupo.
          </p>
          <form onSubmit={onDone} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Rating post-salida</Label>
              <ScorePicker value={doneRating} onChange={setDoneRating} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doneNote">Recuerdo</Label>
              <Textarea
                id="doneNote"
                value={doneNote}
                onChange={(e) => setDoneNote(e.target.value)}
                placeholder="Corta y honesta: ¿valió la pena?"
                className="min-h-24 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              className="h-11 rounded-xl bg-[var(--brand-ink)]"
            >
              Marcar como hecho
            </Button>
          </form>
        </Reveal>
      ) : null}

      {idea.status === "done" ? (
        <Reveal delayMs={160} className="surface-panel rounded-3xl p-5">
          <p className="type-display text-xl font-semibold text-[var(--brand-ink)]">
            Recuerdo
          </p>
          <p className="mt-2 text-sm">
            Rating:{" "}
            <strong className="text-[var(--brand-pop)]">
              {idea.doneRating}/5
            </strong>
          </p>
          {idea.doneNote ? (
            <p className="mt-2 text-[var(--brand-mute)]">{idea.doneNote}</p>
          ) : null}
        </Reveal>
      ) : null}
    </main>
  );
}
