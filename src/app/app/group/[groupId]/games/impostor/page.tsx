"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-chip";
import { dealImpostor, type ImpostorDeal } from "@/lib/party-games";
import { cn } from "@/lib/utils";

/**
 * Impostor: la app reparte roles; se juega mirando a la gente, no a la pantalla.
 */
export default function ImpostorGamePage() {
  const params = useParams<{ groupId: string }>();
  const { ready, state, currentUser } = useApp();
  const group = state.groups.find((g) => g.id === params.groupId);

  const members = useMemo(() => {
    if (!group) return [];
    return group.memberIds
      .map((id) => state.users.find((u) => u.id === id))
      .filter(Boolean);
  }, [group, state.users]);

  const [selected, setSelected] = useState<string[]>([]);
  const [deal, setDeal] = useState<ImpostorDeal | null>(null);
  const [revealFor, setRevealFor] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const memberKey = group?.memberIds.join(",") ?? "";
  useEffect(() => {
    if (!memberKey) return;
    setSelected(memberKey.split(","));
  }, [group?.id, memberKey]);

  if (!ready || !currentUser) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-[var(--mute)]">
        Cargando…
      </div>
    );
  }

  if (!group || !group.memberIds.includes(currentUser.id)) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <p className="text-[var(--mute)]">No estás en este grupo.</p>
        <Link href="/app" className="mt-3 inline-block text-[var(--pop)]">
          ← Grupos
        </Link>
      </main>
    );
  }

  function toggle(id: string) {
    setDeal(null);
    setRevealFor(null);
    setSeen(new Set());
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function startRound() {
    const d = dealImpostor(selected);
    if (!d) return;
    setDeal(d);
    setRevealFor(null);
    setSeen(new Set());
  }

  function peek(userId: string) {
    setRevealFor(userId);
    setSeen((prev) => new Set(prev).add(userId));
  }

  return (
    <main className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href={`/app/group/${group.id}`}
          className="text-sm text-[var(--mute)] hover:text-[var(--ink)]"
        >
          ← {group.name}
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
          El impostor
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--mute)]">
          La app reparte un rol en secreto.{" "}
          <strong className="font-semibold text-[var(--ink)]">
            Se juega mirando a la gente
          </strong>
          , no al móvil: cada uno mira su rol, cierra, y hablan para descubrir
          quién no sabe la palabra.
        </p>
      </div>

      {!deal ? (
        <section className="space-y-4 border border-[var(--line)] bg-[var(--mesa-foam)] p-4">
          <h2 className="font-semibold text-[var(--ink)]">Quiénes juegan</h2>
          <p className="text-xs text-[var(--mute)]">Mínimo 3 personas.</p>
          <ul className="space-y-2">
            {members.map((m) => {
              if (!m) return null;
              const on = selected.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3 border px-3 py-2 text-left",
                      on
                        ? "border-[var(--ink)] bg-white"
                        : "border-[var(--line)] opacity-60",
                    )}
                  >
                    <UserAvatar user={m} size="sm" />
                    <span className="font-medium">{m.name}</span>
                    <span className="ml-auto text-xs text-[var(--mute)]">
                      {on ? "Juega" : "Fuera"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Button
            type="button"
            className="w-full"
            disabled={selected.length < 3}
            onClick={startRound}
          >
            Repartir roles
          </Button>
        </section>
      ) : (
        <section className="space-y-4">
          <p className="text-sm text-[var(--mute)]">
            Pasen el teléfono. Cada uno toca su nombre, mira el rol y cierra.
            Nadie más debe verlo.
          </p>
          <ul className="space-y-2">
            {deal.playerIds.map((id) => {
              const user = state.users.find((u) => u.id === id);
              if (!user) return null;
              const already = seen.has(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => peek(id)}
                    className="flex w-full items-center gap-3 border border-[var(--ink)] bg-[var(--mesa-foam)] px-3 py-3 text-left"
                  >
                    <UserAvatar user={user} size="sm" />
                    <span className="font-semibold">{user.name}</span>
                    <span className="ml-auto text-xs text-[var(--mute)]">
                      {already ? "Ya miró" : "Tocar para ver"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={startRound}>
              Nueva ronda
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDeal(null);
                setRevealFor(null);
                setSeen(new Set());
              }}
            >
              Volver a elegir jugadores
            </Button>
          </div>
        </section>
      )}

      {revealFor && deal ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[var(--ink)]/80 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm border border-[var(--ink)] bg-[var(--mesa-foam)] p-6 text-center shadow-[0_4px_0_0_var(--pop)]">
            <p className="text-sm text-[var(--mute)]">
              {state.users.find((u) => u.id === revealFor)?.name}
            </p>
            {revealFor === deal.impostorId ? (
              <>
                <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--pop)]">
                  Sos el impostor
                </p>
                <p className="mt-2 text-sm text-[var(--mute)]">
                  No tenés palabra. Mezclate y no digas de más.
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-[var(--mute)]">Tu palabra</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
                  {deal.word}
                </p>
              </>
            )}
            <Button
              type="button"
              className="mt-6 w-full"
              onClick={() => setRevealFor(null)}
            >
              Cerrar y pasar el teléfono
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
