"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  GROUP_KIND_LABELS,
  type GroupKind,
} from "@/lib/types";
import { rankMembers, totalPointsForUser } from "@/lib/points";

export default function AppHomePage() {
  const { currentUser, state, createGroup, joinGroupByCode } = useApp();
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<GroupKind>("friends");

  const myGroups = useMemo(
    () =>
      state.groups.filter((g) =>
        currentUser ? g.memberIds.includes(currentUser.id) : false,
      ),
    [state.groups, currentUser],
  );

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = createGroup({ name, kind });
    setOpenCreate(false);
    setName("");
    window.location.href = `/app/group/${id}`;
  }

  function onJoin(e: FormEvent) {
    e.preventDefault();
    const id = joinGroupByCode(joinCode);
    if (!id) {
      setJoinError("No encontramos ese código. Pedí uno al grupo.");
      return;
    }
    setJoinError("");
    window.location.href = `/app/group/${id}`;
  }

  return (
    <main className="space-y-8">
      <Reveal>
        <p className="text-sm font-medium text-[var(--brand-mute)]">
          Hola, {currentUser?.name}
        </p>
        <h1 className="type-display mt-1 text-3xl font-bold text-[var(--brand-ink)] sm:text-4xl">
          ¿Qué hacemos?
        </h1>
        <p className="mt-2 max-w-xl text-[var(--brand-mute)]">
          Entrá a un grupo, proponé ideas, votá en secreto o dejá que el azar
          elija. España primero, el mundo después.
        </p>
      </Reveal>

      <Reveal delayMs={80} className="flex flex-wrap gap-3">
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger
            render={
              <Button className="h-11 rounded-xl bg-[var(--brand-pop)] text-white hover:bg-[var(--brand-pop)]/90" />
            }
          >
            <Plus className="size-4" />
            Crear grupo
          </DialogTrigger>
          <DialogContent className="rounded-3xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="type-display text-2xl">
                Nuevo grupo
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={onCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gname">Nombre</Label>
                <Input
                  id="gname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Nosotros dos"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gkind">Tipo</Label>
                <select
                  id="gkind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as GroupKind)}
                  className="h-11 w-full rounded-xl border border-[var(--brand-line)] bg-white px-3 text-sm"
                >
                  {Object.entries(GROUP_KIND_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-[var(--brand-ink)]"
              >
                Crear
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <form onSubmit={onJoin} className="flex min-w-[240px] flex-1 gap-2">
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Código invite"
            className="h-11 rounded-xl uppercase tracking-wider"
          />
          <Button
            type="submit"
            variant="outline"
            className="h-11 rounded-xl border-[var(--brand-ink)]/20"
          >
            Unirme
          </Button>
        </form>
      </Reveal>
      {joinError ? (
        <p className="text-sm text-[var(--brand-pop)]">{joinError}</p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--brand-mute)]">
          Tus grupos
        </h2>
        {myGroups.length === 0 ? (
          <div className="surface-panel rounded-3xl p-6 text-[var(--brand-mute)]">
            Todavía no estás en ningún grupo. Creá uno o pedí un código.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {myGroups.map((group, index) => {
              const pending = state.ideas.filter(
                (i) =>
                  i.groupId === group.id &&
                  (i.status === "pending" || i.status === "chosen"),
              ).length;
              const ranking = rankMembers(
                group.memberIds,
                state.points,
                group.id,
              );
              const top = ranking[0];
              const myPts = currentUser
                ? totalPointsForUser(state.points, currentUser.id, group.id)
                : 0;
              return (
                <Reveal key={group.id} delayMs={100 + index * 40}>
                  <Link
                    href={`/app/group/${group.id}`}
                    className="surface-panel block rounded-3xl p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="type-display text-xl font-semibold text-[var(--brand-ink)]">
                          {group.name}
                        </p>
                        <p className="mt-1 text-sm text-[var(--brand-mute)]">
                          {GROUP_KIND_LABELS[group.kind]} ·{" "}
                          {group.memberIds.length} personas
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-ink)]/5 px-2.5 py-1 text-xs font-medium text-[var(--brand-ink)]">
                        <Users className="size-3.5" />
                        {pending} pendientes
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-[var(--brand-mute)]">
                        Tus puntos:{" "}
                        <strong className="text-[var(--brand-ink)]">
                          {myPts}
                        </strong>
                      </span>
                      {top ? (
                        <span className="text-[var(--brand-pop)]">
                          #1:{" "}
                          {state.users.find((u) => u.id === top.userId)?.name ??
                            "—"}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
