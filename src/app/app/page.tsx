"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { FlowSteps } from "@/components/shell/flow-steps";
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
import { UserAvatar } from "@/components/ui/user-chip";
import {
  GROUP_KIND_LABELS,
  type GroupKind,
} from "@/lib/types";

export default function AppHomePage() {
  const router = useRouter();
  const { currentUser, state, createGroup, joinGroupByCode } = useApp();
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openJoin, setOpenJoin] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<GroupKind>("friends");

  const myGroups = useMemo(
    () =>
      state.groups.filter((g) =>
        currentUser ? g.memberIds.includes(currentUser.id) : false,
      ),
    [state.groups, currentUser],
  );

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = await createGroup({ name, kind });
    if (!id) {
      setJoinError("No se pudo crear el grupo. Probá de nuevo.");
      return;
    }
    setOpenCreate(false);
    setName("");
    router.push(`/app/group/${id}`);
  }

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    setJoinError("");
    const id = await joinGroupByCode(joinCode);
    if (!id) {
      setJoinError("No encontramos ese código. Pedíselo a alguien del grupo.");
      return;
    }
    setOpenJoin(false);
    setJoinCode("");
    router.push(`/app/group/${id}`);
  }

  return (
    <main className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
          Hola, {currentUser?.name}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--mute)] sm:text-base">
          Elegí un grupo para guardar planes o decidir qué hacen.
        </p>
      </div>

      <FlowSteps active={1} />

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-[var(--ink)]">
            Tus grupos
          </h2>
          <div className="btn-stack">
            <Dialog open={openJoin} onOpenChange={setOpenJoin}>
              <DialogTrigger className="btn-ghost">
                Unirme con código
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Unirme a un grupo</DialogTitle>
                </DialogHeader>
                <form onSubmit={onJoin} className="space-y-4">
                  <p className="text-sm text-[var(--mute)]">
                    Pedí el código a alguien que ya esté en el grupo (ej. DALE26).
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="join">Código</Label>
                    <Input
                      id="join"
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase())
                      }
                      placeholder="DALE26"
                      className="field-input uppercase tracking-wider"
                      autoFocus
                    />
                  </div>
                  {joinError ? (
                    <p className="text-sm text-[var(--pop)]">{joinError}</p>
                  ) : null}
                  <Button type="submit" className="w-full">
                    Entrar al grupo
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger className="btn-primary">
                Crear grupo
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nuevo grupo</DialogTitle>
                </DialogHeader>
                <form onSubmit={onCreate} className="space-y-4">
                  <p className="text-sm text-[var(--mute)]">
                    Pareja, amigos, hermanos… después invitás con un código.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="gname">Nombre del grupo</Label>
                    <Input
                      id="gname"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Nosotros dos"
                      className="field-input"
                      autoFocus
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
                      {Object.entries(GROUP_KIND_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <Button type="submit" className="w-full">
                    Crear y abrir
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {myGroups.length === 0 ? (
          <div className="surface-panel space-y-3 p-5">
            <p className="font-semibold text-[var(--ink)]">
              Todavía no tenés grupos
            </p>
            <p className="text-sm text-[var(--mute)]">
              Creá uno para tu pareja o amigos, o pedí un código e ingresá.
            </p>
            <div className="btn-stack">
              <Button onClick={() => setOpenCreate(true)}>
                Crear mi primer grupo
              </Button>
              <Button variant="outline" onClick={() => setOpenJoin(true)}>
                Tengo un código
              </Button>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {myGroups.map((group) => {
              const catalog = state.ideas.filter(
                (i) =>
                  i.groupId === group.id &&
                  i.timing === "catalog" &&
                  i.status !== "done" &&
                  i.status !== "archived",
              ).length;
              const soon = state.ideas.filter(
                (i) =>
                  i.groupId === group.id &&
                  i.timing === "soon" &&
                  i.status !== "done" &&
                  i.status !== "archived",
              ).length;
              const chosen = state.ideas.find(
                (i) =>
                  i.groupId === group.id &&
                  i.status === "chosen" &&
                  i.timing === "soon",
              );
              const inProgress = state.ideas.find(
                (i) =>
                  i.groupId === group.id && i.status === "in_progress",
              );
              const members = group.memberIds
                .map((id) => state.users.find((u) => u.id === id))
                .filter(Boolean);
              const nextHint = inProgress
                ? `En proceso: ${inProgress.title}`
                : chosen
                  ? `Plan elegido: ${chosen.title}`
                  : soon > 0
                    ? `${soon} en Pronto · tocá para votar o sortear`
                    : catalog > 0
                      ? `${catalog} en catálogo · pasá algo a Pronto para decidir`
                      : "Empezá guardando una idea";

              return (
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/app/group/${group.id}`)}
                    className="surface-panel flex w-full items-center gap-3 p-3.5 text-left transition hover:border-[var(--ink)] hover:shadow-[0_2px_0_0_var(--pop)] sm:p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-[var(--ink)] sm:text-lg">
                          {group.name}
                        </p>
                        <span className="text-xs text-[var(--mute)]">
                          {GROUP_KIND_LABELS[group.kind]}
                        </span>
                      </div>
                      <div className="mt-2 flex -space-x-1.5">
                        {members.slice(0, 5).map((m) =>
                          m ? (
                            <UserAvatar
                              key={m.id}
                              user={m}
                              size="sm"
                              className="size-7 ring-2 ring-white"
                            />
                          ) : null,
                        )}
                      </div>
                      <p className="mt-2 text-sm text-[var(--mute)]">
                        {nextHint}
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-[var(--mute)]" />
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
