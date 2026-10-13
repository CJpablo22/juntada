"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
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
import { resolveRegionTheme } from "@/lib/regions";

export default function AppHomePage() {
  const router = useRouter();
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

  const theme = currentUser
    ? resolveRegionTheme({
        country: currentUser.country,
        province: currentUser.province,
        city: currentUser.city,
      })
    : null;

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = createGroup({ name, kind });
    setOpenCreate(false);
    setName("");
    router.push(`/app/group/${id}`);
  }

  function onJoin(e: FormEvent) {
    e.preventDefault();
    const id = joinGroupByCode(joinCode);
    if (!id) {
      setJoinError("No encontramos ese código. Pedí uno al grupo.");
      return;
    }
    setJoinError("");
    router.push(`/app/group/${id}`);
  }

  return (
    <main className="space-y-8">
      <div>
        <p className="text-sm text-[var(--mute)]">
          Hola, {currentUser?.name}
          {theme ? ` · ${theme.label}` : ""}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
          Tus grupos
        </h1>
        <p className="mt-2 max-w-lg text-[var(--mute)]">
          Entrá a uno, armá el catálogo o decidí en Pronto.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger className="btn-primary">
            Crear grupo
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo grupo</DialogTitle>
            </DialogHeader>
            <form onSubmit={onCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="gname">Nombre</Label>
                <Input
                  id="gname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Nosotros dos"
                  className="field-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gkind">Tipo</Label>
                <select
                  id="gkind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as GroupKind)}
                  className="field-select"
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
                className="h-10 w-full bg-[var(--ink)] text-white hover:bg-[var(--ink)]/90"
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
            className="field-input uppercase tracking-wider"
          />
          <Button type="submit" variant="outline" className="h-10 border-[var(--line)]">
            Unirme
          </Button>
        </form>
      </div>
      {joinError ? (
        <p className="text-sm text-[var(--pop)]">{joinError}</p>
      ) : null}

      <section className="space-y-2">
        {myGroups.length === 0 ? (
          <div className="surface-panel p-5 text-[var(--mute)]">
            Todavía no estás en ningún grupo. Creá uno o pedí un código.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {myGroups.map((group) => {
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
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/app/group/${group.id}`)}
                    className="flex w-full items-start justify-between gap-4 py-4 text-left hover:bg-white/60"
                  >
                    <div>
                      <p className="text-lg font-semibold text-[var(--ink)]">
                        {group.name}
                      </p>
                      <p className="mt-0.5 text-sm text-[var(--mute)]">
                        {GROUP_KIND_LABELS[group.kind]} ·{" "}
                        {group.memberIds.length} personas · {pending} pendientes
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <p className="font-semibold text-[var(--ink)]">{myPts} pts</p>
                      {top ? (
                        <p className="mt-0.5 text-[var(--mute)]">
                          #1{" "}
                          {state.users.find((u) => u.id === top.userId)?.name ??
                            "—"}
                        </p>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
