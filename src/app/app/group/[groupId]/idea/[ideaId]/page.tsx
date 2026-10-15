"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Ban,
  BookmarkPlus,
  CalendarClock,
  ExternalLink,
  Eye,
  Link2,
  MapPin,
  Wallet,
  Zap,
} from "lucide-react";
import { ScheduleFields } from "@/components/ideas/schedule-fields";
import { ScorePicker } from "@/components/ideas/score-picker";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/user-chip";
import { mapsUrl } from "@/lib/maps";
import {
  BIRTHDAY_KIND_LABELS,
  IDEA_TYPE_LABELS,
  MOVIE_VENUE_LABELS,
  formatDuration,
  formatIdeaSchedule,
  formatPlace,
  type IdeaScheduleInput,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export default function IdeaDetailPage() {
  const params = useParams<{ groupId: string; ideaId: string }>();
  const {
    ready,
    state,
    currentUser,
    castVote,
    toggleSoftVeto,
    revealVotes,
    chooseIdea,
    markInProgress,
    markDone,
    addReview,
    setIdeaTiming,
    updateIdeaSchedule,
  } = useApp();
  const [doneRating, setDoneRating] = useState(5);
  const [doneNote, setDoneNote] = useState("");
  const [publicVisible, setPublicVisible] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [flash, setFlash] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState<IdeaScheduleInput>({});
  const [scheduleSaved, setScheduleSaved] = useState(false);

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

  const reviews = useMemo(
    () =>
      state.reviews
        .filter((r) => r.ideaId === params.ideaId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.reviews, params.ideaId],
  );

  const average = useMemo(() => {
    if (!idea) return null;
    const values = Object.values(idea.votes);
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [idea]);

  const publicAvg = useMemo(() => {
    const publicOnes = reviews.filter((r) => r.publicVisible);
    if (!publicOnes.length) return null;
    return (
      publicOnes.reduce((a, b) => a + b.rating, 0) / publicOnes.length
    );
  }, [reviews]);

  useEffect(() => {
    if (!idea) return;
    setScheduleDraft({
      scheduledDate: idea.scheduledDate,
      scheduledTime: idea.scheduledTime,
      durationMinutes: idea.durationMinutes,
      dateFlexible: idea.dateFlexible,
      link: idea.link,
      budgetNote: idea.budgetNote,
    });
  }, [
    idea?.id,
    idea?.scheduledDate,
    idea?.scheduledTime,
    idea?.durationMinutes,
    idea?.dateFlexible,
    idea?.link,
    idea?.budgetNote,
  ]);

  if (!ready || !currentUser) {
    return <div className="p-6 text-[var(--mute)]">Cargando idea…</div>;
  }

  if (!idea || !group) {
    return (
      <div className="surface-panel p-5">
        Idea no encontrada.{" "}
        <Link href="/app" className="text-[var(--pop)] underline">
          Volver a grupos
        </Link>
      </div>
    );
  }

  const myVote = idea.votes[currentUser.id];
  const vetoed = idea.softVetoUserIds.includes(currentUser.id);
  const allVoted = group.memberIds.every((id) => idea.votes[id] != null);
  const myReview = reviews.find((r) => r.userId === currentUser.id);
  const inCatalog =
    idea.timing === "catalog" &&
    idea.status !== "done" &&
    idea.status !== "in_progress";
  const inSoon =
    idea.timing === "soon" &&
    idea.status !== "done" &&
    idea.status !== "in_progress";
  const canFinish =
    idea.status === "chosen" ||
    idea.status === "in_progress" ||
    (idea.status === "pending" && idea.timing === "soon");

  function onVote(score: number) {
    castVote(idea!.id, score);
    setFlash(true);
    setTimeout(() => setFlash(false), 350);
  }

  function onDone(e: FormEvent) {
    e.preventDefault();
    markDone(idea!.id, doneRating, doneNote, publicVisible);
  }

  function onReview(e: FormEvent) {
    e.preventDefault();
    addReview({
      ideaId: idea!.id,
      rating: reviewRating,
      comment: reviewComment,
      publicVisible,
    });
    setReviewComment("");
  }

  return (
    <main className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link
          href={`/app/group/${group.id}`}
          className="text-sm text-[var(--mute)] hover:text-[var(--ink)]"
        >
          ← {group.name}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{IDEA_TYPE_LABELS[idea.type]}</Badge>
          {idea.type === "movie" && idea.movieVenue ? (
            <Badge variant="outline">
              {MOVIE_VENUE_LABELS[idea.movieVenue]}
            </Badge>
          ) : null}
          {idea.type === "birthday" && idea.birthdayKind ? (
            <Badge variant="outline">
              {BIRTHDAY_KIND_LABELS[idea.birthdayKind]}
            </Badge>
          ) : null}
          {idea.type === "birthday" && idea.celebrantName ? (
            <Badge className="bg-[var(--pop)] text-white">
              Cumple de {idea.celebrantName}
            </Badge>
          ) : null}
          {idea.status === "chosen" ? (
            <Badge className="bg-[var(--pop)] text-white">Elegida</Badge>
          ) : null}
          {idea.status === "in_progress" ? (
            <Badge className="bg-[var(--ink)] text-white">En proceso</Badge>
          ) : null}
          {idea.status === "done" ? (
            <Badge variant="outline">Hecha</Badge>
          ) : null}
          {inCatalog ? (
            <span className="text-xs font-semibold text-[var(--mute)]">
              En catálogo
            </span>
          ) : null}
          {inSoon ? (
            <span className="text-xs font-semibold text-[var(--pop)]">
              En Pronto
            </span>
          ) : null}
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)]">
          {idea.title}
        </h1>
        {idea.notes ? (
          <p className="mt-3 text-[var(--mute)]">{idea.notes}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          {proposer ? (
            <span className="inline-flex items-center gap-2">
              <UserAvatar user={proposer} size="sm" />
              Propuso {proposer.name}
            </span>
          ) : null}
        </div>
        {idea.places?.length ? (
          <ul className="mt-4 space-y-2 border border-[var(--line)] bg-white p-3">
            <li className="text-xs font-semibold uppercase tracking-wide text-[var(--mute)]">
              {idea.type === "movie" && idea.movieVenue === "cinema"
                ? "Cine"
                : idea.type === "movie" && idea.movieVenue === "home"
                  ? "Casa"
                  : idea.places.length === 1
                    ? "Lugar"
                    : "Lugares"}
            </li>
            {idea.places.map((place, idx) => (
              <li
                key={`${place.name}-${idx}`}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  <span className="font-medium text-[var(--ink)]">
                    {place.name}
                    {place.kind === "member_home" ? (
                      <span className="ml-1 text-xs font-normal text-[var(--mute)]">
                        (casa del grupo)
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[var(--mute)]">
                    {place.address}
                  </span>
                </span>
                <a
                  href={mapsUrl(
                    place.name !== place.address
                      ? `${place.name}, ${place.address}`
                      : place.address,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[var(--pop)]"
                >
                  <MapPin className="size-4" />
                  Maps
                  <ExternalLink className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        ) : idea.address ? (
          <a
            href={mapsUrl(idea.address)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--pop)]"
          >
            <MapPin className="size-4" />
            {formatPlace({ name: idea.address, address: idea.address })}
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}
      </div>

      <section className="surface-panel space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <CalendarClock className="size-4 text-[var(--pop)]" />
            Cuándo y extras
          </p>
          {idea.status !== "done" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingSchedule((v) => !v);
                setScheduleSaved(false);
              }}
            >
              {editingSchedule ? "Cancelar" : "Editar"}
            </Button>
          ) : null}
        </div>

        {editingSchedule ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              updateIdeaSchedule(idea.id, scheduleDraft);
              setEditingSchedule(false);
              setScheduleSaved(true);
              setTimeout(() => setScheduleSaved(false), 1600);
            }}
          >
            <ScheduleFields value={scheduleDraft} onChange={setScheduleDraft} />
            <Button type="submit" className="w-full sm:w-auto">
              Guardar cuándo
            </Button>
          </form>
        ) : (
          <div className="space-y-2 text-sm text-[var(--mute)]">
            {formatIdeaSchedule(idea) ? (
              <p className="font-medium text-[var(--ink)]">
                {formatIdeaSchedule(idea)}
              </p>
            ) : (
              <p>Todavía no hay fecha ni hora. Podés agregarlas cuando quieran.</p>
            )}
            {idea.budgetNote ? (
              <p className="inline-flex items-center gap-1.5">
                <Wallet className="size-3.5" />
                {idea.budgetNote}
              </p>
            ) : null}
            {idea.link ? (
              <a
                href={idea.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-[var(--pop)]"
              >
                <Link2 className="size-3.5" />
                Abrir link
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
            {!formatIdeaSchedule(idea) &&
            !idea.budgetNote &&
            !idea.link &&
            formatDuration(idea.durationMinutes) ? (
              <p>{formatDuration(idea.durationMinutes)}</p>
            ) : null}
            {scheduleSaved ? (
              <p className="text-[var(--pop)]">Guardado.</p>
            ) : null}
          </div>
        )}
      </section>

      {idea.status !== "done" && idea.status !== "in_progress" ? (
        <section className="surface-panel space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mute)]">
            Paso 1 · ¿Dónde la ponen?
          </p>
          <p className="text-sm text-[var(--mute)]">
            <strong className="text-[var(--ink)]">Catálogo</strong> = solo
            guardar. <strong className="text-[var(--ink)]">Pronto</strong> =
            votar y decidir.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant={idea.timing === "catalog" ? "default" : "outline"}
              className="justify-start"
              onClick={() => setIdeaTiming(idea.id, "catalog")}
            >
              <BookmarkPlus className="size-4" />
              Catálogo (guardar)
            </Button>
            <Button
              variant={idea.timing === "soon" ? "secondary" : "outline"}
              className="justify-start"
              onClick={() => setIdeaTiming(idea.id, "soon")}
            >
              <Zap className="size-4" />
              Pronto (decidir)
            </Button>
          </div>
        </section>
      ) : null}

      {inCatalog ? (
        <section className="border border-dashed border-[var(--line)] bg-[var(--wash)] p-4 text-sm text-[var(--mute)]">
          Está en el catálogo: nadie vota todavía. Cuando quieran decidirla,
          pasala a <strong className="text-[var(--ink)]">Pronto</strong>.
        </section>
      ) : null}

      {inSoon ? (
        <section className="surface-panel space-y-4 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mute)]">
              Paso 2 · Votá en secreto
            </p>
            <p className="mt-1 text-sm text-[var(--mute)]">
              Del 1 al 5. Nadie ve tu número hasta que alguien pulse Revelar.
            </p>
          </div>
          <div className={cn(flash && "animate-pop")}>
            <ScorePicker value={myVote} onChange={onVote} />
          </div>
          {myVote != null ? (
            <p className="text-sm font-medium text-[var(--ink)]">
              Tu voto: {myVote}/5 (secreto)
            </p>
          ) : (
            <p className="text-sm text-[var(--pop)]">Todavía no votaste.</p>
          )}

          <div className="btn-stack border-t border-[var(--line)] pt-4">
            <Button
              variant={vetoed ? "secondary" : "outline"}
              onClick={() => toggleSoftVeto(idea.id)}
            >
              <Ban className="size-4" />
              {vetoed ? "Sacaste el “ahora no”" : "Ahora no"}
            </Button>
            <Button
              onClick={() => revealVotes(idea.id)}
              disabled={idea.revealed}
            >
              <Eye className="size-4" />
              {idea.revealed ? "Ya revelado" : "Revelar votos"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => chooseIdea(idea.id)}
              disabled={idea.status === "chosen"}
            >
              {idea.status === "chosen" ? "Ya es el plan" : "Elegir este plan"}
            </Button>
          </div>
          <p className="text-xs text-[var(--mute)]">
            {allVoted
              ? "Todo el grupo ya votó. Pueden revelar."
              : "Faltan votos. Igual pueden revelar si quieren."}
          </p>

          <div className="border-t border-[var(--line)] pt-4">
            <p className="text-sm font-semibold text-[var(--ink)]">
              {idea.revealed ? "Resultados" : "Quién votó"}
            </p>
            <ul className="mt-3 space-y-2">
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
                    <span className="text-sm font-semibold text-[var(--ink)]">
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
              <p className="mt-3 text-sm text-[var(--mute)]">
                Media del grupo:{" "}
                <strong className="text-[var(--pop)]">
                  {average.toFixed(1)}
                </strong>
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {canFinish ? (
        <section className="surface-panel space-y-3 p-4">
          {idea.status === "chosen" ? (
            <div className="space-y-2 border-b border-[var(--line)] pb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mute)]">
                En marcha
              </p>
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => markInProgress(idea.id)}
              >
                Marcar en proceso
              </Button>
              <p className="text-xs text-[var(--mute)]">
                Si ya lo están haciendo, marcá en proceso. Cuando terminen,
                valorá abajo.
              </p>
            </div>
          ) : null}
          {idea.status === "in_progress" ? (
            <p className="rounded bg-[var(--wash)] px-3 py-2 text-sm text-[var(--ink)]">
              Estado: <strong>en proceso</strong>. Cuando lo terminen, valorá y
              marcá como hecho.
            </p>
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mute)]">
            {idea.status === "in_progress"
              ? "Cuando lo terminen"
              : "Paso 3 · Cuando lo hagan"}
          </p>
          <p className="text-sm text-[var(--mute)]">
            Valorá y comentá. Si querés, aparece en Descubrir para otra gente.
          </p>
          <form onSubmit={onDone} className="space-y-4">
            <div className="space-y-2">
              <Label>Tu valoración</Label>
              <ScorePicker value={doneRating} onChange={setDoneRating} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doneNote">Comentario</Label>
              <Textarea
                id="doneNote"
                value={doneNote}
                onChange={(e) => setDoneNote(e.target.value)}
                placeholder="¿Valió la pena?"
                className="min-h-24"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
              <input
                type="checkbox"
                checked={publicVisible}
                onChange={(e) => setPublicVisible(e.target.checked)}
                className="size-4 rounded border-[var(--line)]"
              />
              Publicar en Descubrir
            </label>
            <Button
              type="submit"
              className="w-full sm:w-auto"
            >
              Marcar como hecho
            </Button>
          </form>
        </section>
      ) : null}

      {idea.status === "done" ? (
        <>
          <section className="surface-panel p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--ink)]">Valoraciones</p>
                <p className="mt-1 text-sm text-[var(--mute)]">
                  {publicAvg != null
                    ? `Media pública: ${publicAvg.toFixed(1)}/5`
                    : "Todavía no hay valoraciones públicas"}
                </p>
              </div>
              <Link
                href={`/discover/${idea.id}`}
                className="text-sm font-semibold text-[var(--pop)]"
              >
                Ver en Descubrir →
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {reviews.length === 0 ? (
                <li className="text-sm text-[var(--mute)]">
                  Sin comentarios todavía.
                </li>
              ) : (
                reviews.map((review) => {
                  const author = state.users.find(
                    (u) => u.id === review.userId,
                  );
                  return (
                    <li
                      key={review.id}
                      className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-sm font-medium">
                          {author ? (
                            <UserAvatar user={author} size="sm" />
                          ) : null}
                          {author?.name ?? "Alguien"}
                        </span>
                        <span className="text-sm font-semibold text-[var(--pop)]">
                          {review.rating}/5
                          {!review.publicVisible ? (
                            <span className="ml-2 text-xs font-normal text-[var(--mute)]">
                              privado
                            </span>
                          ) : null}
                        </span>
                      </div>
                      {review.comment ? (
                        <p className="mt-2 text-sm text-[var(--mute)]">
                          {review.comment}
                        </p>
                      ) : null}
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <section className="surface-panel p-4">
            <p className="font-semibold text-[var(--ink)]">
              {myReview ? "Actualizar tu opinión" : "Sumá tu valoración"}
            </p>
            <form onSubmit={onReview} className="mt-4 space-y-4">
              <ScorePicker value={reviewRating} onChange={setReviewRating} />
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Qué te pareció…"
                className="min-h-24"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={publicVisible}
                  onChange={(e) => setPublicVisible(e.target.checked)}
                  className="size-4 rounded border-[var(--line)]"
                />
                Pública en Descubrir
              </label>
              <Button
                type="submit"
                className="w-full sm:w-auto"
              >
                Guardar valoración
              </Button>
            </form>
          </section>
        </>
      ) : null}
    </main>
  );
}
