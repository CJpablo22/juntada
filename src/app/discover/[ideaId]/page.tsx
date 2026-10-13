"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Logo } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-chip";
import { IDEA_TYPE_LABELS } from "@/lib/types";

export default function DiscoverDetailPage() {
  const params = useParams<{ ideaId: string }>();
  const { ready, state } = useApp();
  const idea = state.ideas.find((i) => i.id === params.ideaId);

  const reviews = useMemo(
    () =>
      state.reviews
        .filter((r) => r.ideaId === params.ideaId && r.publicVisible)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.reviews, params.ideaId],
  );

  const avg = reviews.length
    ? reviews.reduce((a, b) => a + b.rating, 0) / reviews.length
    : null;

  if (!ready) {
    return (
      <div className="grid min-h-[100svh] place-items-center text-[var(--brand-mute)]">
        Cargando…
      </div>
    );
  }

  if (!idea || reviews.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Logo />
        <div className="surface-panel mt-8 rounded-3xl p-6">
          Esta valoración no es pública o no existe.{" "}
          <Link href="/discover" className="text-[var(--brand-pop)] underline">
            Volver a Descubrir
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[100svh] max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <Link href="/discover">
          <Logo />
        </Link>
        <Link
          href="/enter"
          className="text-sm font-medium text-[var(--brand-ink)]"
        >
          Entrar
        </Link>
      </div>

      <Reveal className="mt-10">
        <Link
          href="/discover"
          className="text-sm text-[var(--brand-mute)] hover:text-[var(--brand-ink)]"
        >
          ← Descubrir
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{IDEA_TYPE_LABELS[idea.type]}</Badge>
          {avg != null ? (
            <span className="text-sm font-semibold text-[var(--brand-pop)]">
              {avg.toFixed(1)}/5 · {reviews.length} opiniones
            </span>
          ) : null}
        </div>
        <h1 className="type-display mt-2 text-3xl font-bold text-[var(--brand-ink)] sm:text-4xl">
          {idea.title}
        </h1>
        {idea.notes ? (
          <p className="mt-3 text-[var(--brand-mute)]">{idea.notes}</p>
        ) : null}
      </Reveal>

      <Reveal delayMs={80} className="mt-8 space-y-3">
        {reviews.map((review) => {
          const author = state.users.find((u) => u.id === review.userId);
          return (
            <article
              key={review.id}
              className="surface-panel rounded-3xl px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  {author ? <UserAvatar user={author} size="sm" /> : null}
                  {author?.name ?? "Alguien"}
                  {author?.city ? (
                    <span className="text-xs font-normal text-[var(--brand-mute)]">
                      · {author.city}
                    </span>
                  ) : null}
                </span>
                <span className="font-semibold text-[var(--brand-pop)]">
                  {review.rating}/5
                </span>
              </div>
              {review.comment ? (
                <p className="mt-3 text-sm leading-relaxed text-[var(--brand-mute)]">
                  {review.comment}
                </p>
              ) : null}
            </article>
          );
        })}
      </Reveal>

      <Reveal delayMs={140} className="mt-8">
        <Link
          href="/enter"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--brand-ink)] px-4 text-sm font-medium text-white"
        >
          Guardá esto en tu grupo
        </Link>
      </Reveal>
    </main>
  );
}
