"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useApp } from "@/components/providers/app-provider";
import { IDEA_TYPE_LABELS } from "@/lib/types";

export default function GroupAlbumPage() {
  const params = useParams<{ groupId: string }>();
  const { ready, state, currentUser } = useApp();
  const group = state.groups.find((g) => g.id === params.groupId);

  const memories = useMemo(() => {
    if (!group) return [];
    return state.ideas
      .filter((i) => i.groupId === group.id && i.status === "done")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((idea) => {
        const reviewPhoto = state.reviews.find(
          (r) => r.ideaId === idea.id && r.photoUrl,
        )?.photoUrl;
        return {
          idea,
          photo: idea.donePhotoUrl || reviewPhoto,
        };
      });
  }, [group, state.ideas, state.reviews]);

  if (!ready || !currentUser) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-[var(--mute)]">
        Cargando…
      </div>
    );
  }

  if (!group || !group.memberIds.includes(currentUser.id)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-[var(--mute)]">No estás en este grupo.</p>
        <Link href="/app" className="mt-3 inline-block text-[var(--pop)]">
          ← Grupos
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/app/group/${group.id}`}
          className="text-sm text-[var(--mute)] hover:text-[var(--ink)]"
        >
          ← {group.name}
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
          Álbum de recuerdos
        </h1>
        <p className="mt-1 text-sm text-[var(--mute)]">
          Lo que ya hicieron juntos — fotos y notas del grupo.
        </p>
      </div>

      {memories.length === 0 ? (
        <div className="surface-panel p-5 text-sm text-[var(--mute)]">
          Todavía no hay planes marcados como hechos. Cuando valoren uno,
          aparece acá.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {memories.map(({ idea, photo }) => (
            <li key={idea.id}>
              <Link
                href={`/app/group/${group.id}/idea/${idea.id}`}
                className="block overflow-hidden border border-[var(--line)] bg-[var(--mesa-foam)] transition-colors hover:border-[var(--ink)]"
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="grid aspect-[4/3] place-items-center bg-[var(--wash)] text-sm text-[var(--mute)]">
                    Sin foto
                  </div>
                )}
                <div className="space-y-1 p-3">
                  <p className="text-xs text-[var(--mute)]">
                    {IDEA_TYPE_LABELS[idea.type]}
                    {idea.doneRating != null ? ` · ${idea.doneRating}/5` : ""}
                  </p>
                  <p className="font-semibold text-[var(--ink)]">{idea.title}</p>
                  {idea.doneNote ? (
                    <p className="line-clamp-2 text-sm text-[var(--mute)]">
                      {idea.doneNote}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
