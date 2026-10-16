"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, Copy, MapPin, Plus, Wallet } from "lucide-react";
import { LotteryButton } from "@/components/ideas/lottery-button";
import {
  PlaceFields,
  cleanPlaces,
  ideaNeedsPlaces,
  validatePlaces,
} from "@/components/ideas/place-fields";
import { ScheduleFields } from "@/components/ideas/schedule-fields";
import { WeeklyRitual } from "@/components/ideas/weekly-ritual";
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
import {
  captainCanBreakTie,
  ideaAverage,
  soleCaptainId,
} from "@/lib/captain";
import { badgeForRank, rankMembers } from "@/lib/points";
import { getVisibleLocationForViewer } from "@/lib/privacy";
import {
  BIRTHDAY_KIND_LABELS,
  GROUP_KIND_LABELS,
  IDEA_TYPE_LABELS,
  MOVIE_VENUE_LABELS,
  formatIdeaSchedule,
  formatPlace,
  type BirthdayKind,
  type IdeaPlace,
  type IdeaScheduleInput,
  type IdeaTiming,
  type IdeaType,
  type MovieVenue,
  type User,
} from "@/lib/types";
import { memberHomePlace } from "@/lib/places";
import { cn } from "@/lib/utils";

type ShelfFilter = "catalog" | "soon" | "done";

export default function GroupPage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const {
    ready,
    state,
    currentUser,
    addIdea,
    pickRandomIdea,
    setIdeaTiming,
    breakTieAsCaptain,
    leaveGroup,
    renameGroup,
    kickMember,
    deleteGroup,
  } = useApp();
  const [shelf, setShelf] = useState<ShelfFilter>("catalog");
  const [typeFilter, setTypeFilter] = useState<"all" | IdeaType>("all");
  const [openIdea, setOpenIdea] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [mgmtError, setMgmtError] = useState("");
  const [mgmtBusy, setMgmtBusy] = useState(false);
  const [captainMsg, setCaptainMsg] = useState("");

  const group = state.groups.find((g) => g.id === params.groupId);
  const isOwner = Boolean(
    group && currentUser && group.createdBy === currentUser.id,
  );
  const members = useMemo(
    () =>
      group
        ? group.memberIds
            .map((id) => state.users.find((u) => u.id === id))
            .filter(Boolean)
        : [],
    [group, state.users],
  );

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
  const doneCount = state.ideas.filter(
    (i) => i.groupId === group?.id && i.status === "done",
  ).length;

  const ideas = useMemo(() => {
    if (!group) return [];
    return state.ideas
      .filter((i) => i.groupId === group.id)
      .filter((i) => i.status !== "archived")
      .filter((i) => {
        if (shelf === "catalog")
          return (
            i.timing === "catalog" &&
            i.status !== "done" &&
            i.status !== "in_progress"
          );
        if (shelf === "soon")
          return (
            (i.timing === "soon" || i.status === "in_progress") &&
            i.status !== "done"
          );
        return i.status === "done";
      })
      .filter((i) => (typeFilter === "all" ? true : i.type === typeFilter));
  }, [state.ideas, group, shelf, typeFilter]);

  const chosen = state.ideas.find(
    (i) =>
      i.groupId === group?.id && i.status === "chosen" && i.timing === "soon",
  );
  const inProgress = state.ideas.find(
    (i) => i.groupId === group?.id && i.status === "in_progress",
  );

  const ranking = group
    ? rankMembers(group.memberIds, state.points, group.id)
    : [];

  const captainId = group
    ? soleCaptainId(group.memberIds, state.points, group.id)
    : null;

  const captainTie = useMemo(() => {
    if (!group || !currentUser) return null;
    const check = captainCanBreakTie({
      memberIds: group.memberIds,
      points: state.points,
      groupId: group.id,
      userId: currentUser.id,
      lastTieBreakWeek: group.lastCaptainTieBreakWeek,
      ideas: state.ideas,
    });
    return check.ok ? check : null;
  }, [group, currentUser, state.points, state.ideas]);

  const needsVote = useMemo(() => {
    if (!group || !currentUser) return null;
    return state.ideas.find(
      (i) =>
        i.groupId === group.id &&
        i.timing === "soon" &&
        i.status !== "done" &&
        i.status !== "archived" &&
        i.status !== "in_progress" &&
        !i.revealed &&
        i.votes[currentUser.id] == null &&
        !i.softVetoUserIds.includes(currentUser.id),
    );
  }, [state.ideas, group, currentUser]);

  useEffect(() => {
    // Si hay algo que decidir, abrimos Pronto; si no, Catálogo.
    if (!group) return;
    if (soonCount > 0) setShelf("soon");
    else setShelf("catalog");
    // solo al montar / cambiar de grupo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id]);

  if (!ready || !currentUser) {
    return <div className="p-6 text-[var(--mute)]">Cargando grupo…</div>;
  }

  if (!group) {
    return (
      <div className="surface-panel p-5">
        Grupo no encontrado.{" "}
        <Link href="/app" className="font-semibold text-[var(--pop)] underline">
          Volver a grupos
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

  const nextStep = chosen
    ? {
        title: `Plan del momento: ${chosen.title}`,
        action: "Abrir plan",
        href: `/app/group/${group.id}/idea/${chosen.id}`,
        hint: "Ya está elegido. Cuando lo hagan, márquenlo como hecho.",
      }
    : needsVote
      ? {
          title: `Te falta votar: ${needsVote.title}`,
          action: "Votar ahora",
          href: `/app/group/${group.id}/idea/${needsVote.id}`,
          hint: "Tu voto queda secreto hasta que alguien revele.",
        }
      : soonCount > 0
        ? {
            title: "Ya pueden decidir",
            action: "Ir a Pronto",
            onClick: () => setShelf("soon"),
            hint: "Revelen votos, elijan un plan o tiren el azar.",
          }
        : catalogCount > 0
          ? {
              title: "Nada en Pronto todavía",
              action: "Ver catálogo",
              onClick: () => setShelf("catalog"),
              hint: "Abrí una idea del catálogo y pasala a Pronto para decidir.",
            }
          : {
              title: "Este grupo está vacío",
              action: "Proponer idea",
              onClick: () => setOpenIdea(true),
              hint: "Guardá una peli, sitio o plan. Después deciden juntos.",
            };

  return (
    <main className="space-y-5 sm:space-y-6">
      <div>
        <Link
          href="/app"
          className="text-sm text-[var(--mute)] hover:text-[var(--ink)]"
        >
          ← Grupos
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-[var(--mute)]">
              {GROUP_KIND_LABELS[group.kind]} · {members.length} personas
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
              {group.name}
            </h1>
          </div>
          <div className="btn-stack sm:shrink-0">
            <Button variant="outline" onClick={copyInvite}>
              <Copy className="size-4" />
              {copied ? "Código copiado" : `Invitar · ${group.inviteCode}`}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/app/group/${group.id}/expenses`)}
            >
              <Wallet className="size-4" />
              Gastos
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRenameValue(group.name);
                setMgmtError("");
                setOpenSettings(true);
              }}
            >
              Gestionar
            </Button>
            <Dialog
              open={openSettings}
              onOpenChange={(o) => {
                setOpenSettings(o);
                setMgmtError("");
                if (o) setRenameValue(group.name);
              }}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Gestionar grupo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {isOwner ? (
                    <form
                      className="space-y-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setMgmtBusy(true);
                        setMgmtError("");
                        const r = await renameGroup(group.id, renameValue);
                        setMgmtBusy(false);
                        if (!r.ok) {
                          setMgmtError(r.error || "No se pudo renombrar");
                          return;
                        }
                        setOpenSettings(false);
                      }}
                    >
                      <Label htmlFor="rename">Cambiar nombre</Label>
                      <Input
                        id="rename"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="field-input"
                      />
                      <Button type="submit" disabled={mgmtBusy} size="sm">
                        Guardar nombre
                      </Button>
                    </form>
                  ) : null}

                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={mgmtBusy}
                    onClick={async () => {
                      if (!window.confirm("¿Salir de este grupo?")) return;
                      setMgmtBusy(true);
                      const r = await leaveGroup(group.id);
                      setMgmtBusy(false);
                      if (!r.ok) {
                        setMgmtError(r.error || "No se pudo salir");
                        return;
                      }
                      router.replace("/app");
                    }}
                  >
                    Salir del grupo
                  </Button>

                  {isOwner ? (
                    <Button
                      variant="ghost"
                      className="w-full text-[var(--pop)]"
                      disabled={mgmtBusy}
                      onClick={async () => {
                        if (
                          !window.confirm(
                            "¿Eliminar el grupo y todo su contenido? No se puede deshacer.",
                          )
                        )
                          return;
                        setMgmtBusy(true);
                        const r = await deleteGroup(group.id);
                        setMgmtBusy(false);
                        if (!r.ok) {
                          setMgmtError(r.error || "No se pudo eliminar");
                          return;
                        }
                        router.replace("/app");
                      }}
                    >
                      Eliminar grupo
                    </Button>
                  ) : null}

                  {mgmtError ? (
                    <p className="text-sm text-[var(--pop)]">{mgmtError}</p>
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mt-3">
          <button
            type="button"
            id="toggle-members"
            onClick={() => setShowMembers((v) => !v)}
            className="flex items-center gap-2 text-sm text-[var(--mute)] hover:text-[var(--ink)]"
          >
            <span className="flex -space-x-1.5" aria-hidden>
              {members.slice(0, 4).map((m) =>
                m ? (
                  <UserAvatar
                    key={m.id}
                    user={m}
                    size="sm"
                    className="size-7 ring-2 ring-[var(--paper)]"
                  />
                ) : null,
              )}
            </span>
            <span>
              {showMembers
                ? "Ocultar quién está"
                : "Quiénes están y qué ven de mí"}
            </span>
          </button>
          {showMembers ? (
            <ul className="mt-3 space-y-2 border border-[var(--line)] bg-white p-3">
              {members.map((m) => {
                if (!m) return null;
                const visible = getVisibleLocationForViewer(m, {
                  inSharedGroup: true,
                  groupId: group.id,
                });
                const canKick =
                  isOwner && currentUser && m.id !== currentUser.id;
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <UserAvatar
                        user={m}
                        size="sm"
                        className="size-6 text-[10px]"
                      />
                      <span>
                        <span className="font-medium">{m.name}</span>
                        {group.createdBy === m.id ? (
                          <span className="ml-1 text-xs text-[var(--mute)]">
                            (dueño)
                          </span>
                        ) : null}
                        <span className="text-[var(--mute)]">
                          {" "}
                          · {visible.label}
                        </span>
                      </span>
                    </span>
                    {canKick ? (
                      <button
                        type="button"
                        className="shrink-0 text-xs font-semibold text-[var(--pop)]"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `¿Expulsar a ${m.name} del grupo?`,
                            )
                          )
                            return;
                          const r = await kickMember(group.id, m.id);
                          if (!r.ok) {
                            window.alert(r.error || "No se pudo expulsar");
                          }
                        }}
                      >
                        Expulsar
                      </button>
                    ) : null}
                  </li>
                );
              })}
              <li className="pt-1 text-xs text-[var(--mute)]">
                Cambiá lo tuyo en{" "}
                <Link href="/app/profile" className="underline">
                  Perfil → Qué ven en cada grupo
                </Link>
              </li>
            </ul>
          ) : null}
        </div>
      </div>


      {nextStep ? (
        <section className="surface-panel flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mute)]">
              Siguiente paso
            </p>
            <p className="mt-1 font-semibold text-[var(--ink)]">{nextStep.title}</p>
            <p className="mt-1 text-sm text-[var(--mute)]">{nextStep.hint}</p>
          </div>
          {"href" in nextStep && nextStep.href ? (
            <Link href={nextStep.href} className="btn-primary w-full sm:w-auto sm:shrink-0">
              {nextStep.action}
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <button
              type="button"
              className="btn-primary w-full sm:w-auto sm:shrink-0"
              onClick={nextStep.onClick}
            >
              {nextStep.action}
              <ArrowRight className="size-4" />
            </button>
          )}
        </section>
      ) : null}

      <section className="h-scroll sm:grid sm:grid-cols-3 sm:gap-2 sm:overflow-visible">
        {(
          [
            {
              id: "catalog" as const,
              label: "1 · Catálogo",
              count: catalogCount,
              blurb: "Guardar para no olvidar.",
            },
            {
              id: "soon" as const,
              label: "2 · Pronto",
              count: soonCount,
              blurb: "Votos y azar.",
            },
            {
              id: "done" as const,
              label: "Hechas",
              count: doneCount,
              blurb: "Ya lo hicieron.",
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setShelf(tab.id)}
            className={cn(
              "min-w-[9.75rem] border px-3 py-3 text-left sm:min-w-0",
              shelf === tab.id
                ? "border-[var(--ink)] bg-white shadow-[0_2px_0_0_var(--pop)]"
                : "border-[var(--line)] bg-transparent hover:bg-white/60",
            )}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-[var(--ink)]">{tab.label}</span>
              <span className="text-sm text-[var(--mute)]">{tab.count}</span>
            </span>
            <span className="mt-1 block text-xs text-[var(--mute)]">
              {tab.blurb}
            </span>
          </button>
        ))}
      </section>

      {shelf === "soon" ? (
        <>
          <WeeklyRitual
            groupId={group.id}
            ideas={state.ideas}
            onLottery={(ids) => pickRandomIdea(group.id, ids)}
            lotteryDisabled={
              !state.ideas.some(
                (i) =>
                  i.groupId === group.id &&
                  i.timing === "soon" &&
                  (i.status === "pending" || i.status === "chosen") &&
                  i.softVetoUserIds.length === 0,
              )
            }
          />
          <section className="surface-panel space-y-3 p-4">
            <div>
              <p className="font-semibold text-[var(--ink)]">Decidir juntos</p>
              <p className="mt-1 text-sm text-[var(--mute)]">
                {inProgress
                  ? "Hay un plan en proceso. Cuando lo terminen, marquenlo como hecho."
                  : chosen
                    ? "Ya hay un plan elegido. Pueden marcarlo en proceso o cambiarlo."
                    : "Votá en cada idea, revelen los votos, o dejen que el azar elija entre Pronto."}
              </p>
            </div>
            {inProgress ? (
              <p className="text-sm">
                En proceso:{" "}
                <Link
                  href={`/app/group/${group.id}/idea/${inProgress.id}`}
                  className="font-semibold text-[var(--ink)] underline"
                >
                  {inProgress.title}
                </Link>
              </p>
            ) : null}
            {chosen ? (
              <p className="text-sm">
                Elegida:{" "}
                <Link
                  href={`/app/group/${group.id}/idea/${chosen.id}`}
                  className="font-semibold text-[var(--pop)] underline"
                >
                  {chosen.title}
                </Link>
              </p>
            ) : null}
            <div className="max-w-md">
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
        </>
      ) : null}

      {shelf === "soon" && captainTie ? (
        <section className="border border-[var(--ink)] bg-[var(--mesa-foam)] p-4 shadow-[0_3px_0_0_var(--pop)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pop)]">
            Privilegio del Capitán
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
            Hay empate — rompelo vos
          </h2>
          <p className="mt-1 text-sm text-[var(--mute)]">
            Sos el #1 del grupo. Elegí una de estas ideas empatadas (1 vez por
            semana).
          </p>
          <ul className="mt-3 space-y-2">
            {captainTie.tied.map((idea) => {
              const avg = ideaAverage(idea);
              return (
                <li
                  key={idea.id}
                  className="flex flex-wrap items-center justify-between gap-2 border border-[var(--line)] bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--ink)]">{idea.title}</p>
                    <p className="text-xs text-[var(--mute)]">
                      Media {avg != null ? avg.toFixed(1) : "—"}/5
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const err = breakTieAsCaptain(idea.id);
                      if (err) {
                        setCaptainMsg(err);
                        return;
                      }
                      setCaptainMsg(`Elegiste «${idea.title}». Plan listo.`);
                      setShelf("soon");
                    }}
                  >
                    Elegir esta
                  </Button>
                </li>
              );
            })}
          </ul>
          {captainMsg ? (
            <p className="mt-3 text-sm text-[var(--pop)]">{captainMsg}</p>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">
              {shelf === "catalog"
                ? "Ideas guardadas"
                : shelf === "soon"
                  ? "Para decidir"
                  : "Ya hechas"}
            </h2>
            <p className="text-sm text-[var(--mute)]">
              {shelf === "catalog"
                ? "Tocá una idea para verla o pasarla a Pronto."
                : shelf === "soon"
                  ? "Tocá una idea para votar en secreto."
                  : "Recuerdos y valoraciones del grupo."}
            </p>
          </div>
          {shelf !== "done" ? (
            <NewIdeaDialog
              open={openIdea}
              onOpenChange={setOpenIdea}
              members={members.filter(Boolean) as User[]}
              currentUser={currentUser}
              defaultTiming={shelf === "soon" ? "soon" : "catalog"}
              onSubmit={(data) => {
                const id = addIdea({ groupId: group.id, ...data });
                setOpenIdea(false);
                router.push(`/app/group/${group.id}/idea/${id}`);
              }}
            />
          ) : null}
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
          <div className="surface-panel space-y-3 p-5">
            <p className="font-semibold text-[var(--ink)]">
              {shelf === "catalog"
                ? "Catálogo vacío"
                : shelf === "soon"
                  ? "Nada en Pronto"
                  : "Todavía no marcaron nada como hecho"}
            </p>
            <p className="text-sm text-[var(--mute)]">
              {shelf === "catalog"
                ? "Guardá pelis, sitios o planes para no olvidarlos. Cuando quieran decidir, pásenlos a Pronto."
                : shelf === "soon"
                  ? "Pasá algo del catálogo a Pronto, o proponé una idea directa para este finde."
                  : "Cuando terminen un plan, márquenlo hecho desde la idea."}
            </p>
            {shelf !== "done" ? (
              <Button
                className="w-full"
                onClick={() => setOpenIdea(true)}
              >
                <Plus className="size-4" />
                Proponer idea
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {ideas.map((idea) => {
              const proposer = state.users.find(
                (u) => u.id === idea.proposedBy,
              );
              const voteCount = Object.keys(idea.votes).length;
              const myVote = idea.votes[currentUser.id];
              const rowHint =
                idea.status === "in_progress"
                  ? "En proceso · tocá para abrir"
                  : idea.status === "chosen"
                    ? "Plan elegido · tocá para abrir"
                    : idea.timing === "soon" && !idea.revealed
                      ? myVote
                        ? `Ya votaste (${myVote}/5) · secreto`
                        : "Pendiente de tu voto"
                      : idea.timing === "soon" && idea.revealed
                        ? `${voteCount} votos revelados`
                        : idea.timing === "catalog"
                          ? "En catálogo · podés pasarla a Pronto"
                          : "Hecha";

              return (
                <li key={idea.id} className="py-3">
                  <div className="flex flex-wrap items-start gap-3">
                    {idea.donePhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={idea.donePhotoUrl}
                        alt=""
                        className="mt-1 size-14 shrink-0 border border-[var(--line)] object-cover"
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/app/group/${group.id}/idea/${idea.id}`)
                      }
                      className={cn(
                        "min-w-0 flex-1 text-left hover:opacity-90",
                        idea.status === "chosen" &&
                          "rounded bg-[var(--pop-soft)]/50 p-2 -m-2",
                        idea.status === "in_progress" &&
                          "rounded bg-[var(--wash)] p-2 -m-2",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--mute)]">
                        <span>{IDEA_TYPE_LABELS[idea.type]}</span>
                        {idea.type === "movie" && idea.movieVenue ? (
                          <span>· {MOVIE_VENUE_LABELS[idea.movieVenue]}</span>
                        ) : null}
                        {idea.type === "birthday" && idea.birthdayKind ? (
                          <span>· {BIRTHDAY_KIND_LABELS[idea.birthdayKind]}</span>
                        ) : null}
                        {idea.type === "birthday" && idea.celebrantName ? (
                          <span>· Cumple de {idea.celebrantName}</span>
                        ) : null}
                        {idea.status === "chosen" ? (
                          <Badge className="bg-[var(--pop)] text-white">
                            Elegida
                          </Badge>
                        ) : null}
                        {idea.status === "in_progress" ? (
                          <Badge className="bg-[var(--ink)] text-white">
                            En proceso
                          </Badge>
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
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--mute)]">
                        {proposer ? <span>Por {proposer.name}</span> : null}
                        {(() => {
                          const when = formatIdeaSchedule(idea);
                          return when ? (
                            <span className="inline-flex items-center gap-1 font-medium text-[var(--ink)]">
                              <CalendarClock className="size-3.5 text-[var(--pop)]" />
                              {when}
                            </span>
                          ) : null;
                        })()}
                        {idea.places?.length ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {idea.places.length === 1
                              ? formatPlace(idea.places[0])
                              : `${idea.places.length} lugares`}
                          </span>
                        ) : idea.address ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {idea.address}
                          </span>
                        ) : null}
                        {idea.budgetNote ? (
                          <span>≈ {idea.budgetNote}</span>
                        ) : null}
                        <span className="font-medium text-[var(--ink)]">
                          {rowHint}
                        </span>
                      </div>
                    </button>
                    {idea.timing === "catalog" && idea.status !== "done" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-[var(--line)]"
                        onClick={() => {
                          setIdeaTiming(idea.id, "soon");
                          setShelf("soon");
                        }}
                      >
                        A Pronto
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside className="surface-panel p-4">
        <p className="font-semibold text-[var(--ink)]">Puntos del grupo</p>
        <p className="mt-1 text-xs text-[var(--mute)]">
          El #1 (Capitán) puede romper un empate en Pronto una vez por semana.
        </p>
        <ul className="mt-3 space-y-3">
          {ranking.map((row, index) => {
            const user = state.users.find((u) => u.id === row.userId);
            if (!user) return null;
            const isCaptain = captainId === row.userId && index === 0;
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
                      {isCaptain ? (
                        <span className="ml-1 text-[var(--pop)]">★</span>
                      ) : null}
                    </span>
                    <span className="block text-xs text-[var(--mute)]">
                      {badgeForRank(index, row.points)}
                      {isCaptain ? " · rompe empates" : ""}
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
    </main>
  );
}

function NewIdeaDialog({
  open,
  onOpenChange,
  onSubmit,
  members,
  currentUser,
  defaultTiming = "catalog",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: User[];
  currentUser: User;
  defaultTiming?: IdeaTiming;
  onSubmit: (data: {
    type: IdeaType;
    title: string;
    notes: string;
    movieVenue?: MovieVenue;
    celebrantName?: string;
    celebrantMemberId?: string;
    birthdayKind?: BirthdayKind;
    places: IdeaPlace[];
    tags: string[];
    timing: IdeaTiming;
  } & IdeaScheduleInput) => void;
}) {
  const [type, setType] = useState<IdeaType>("movie");
  const [movieVenue, setMovieVenue] = useState<MovieVenue>("home");
  const [birthdayKind, setBirthdayKind] = useState<BirthdayKind>("meal");
  const [birthdayVenue, setBirthdayVenue] = useState<"home" | "out">("home");
  const [celebrantMode, setCelebrantMode] = useState<"member" | "other">(
    "other",
  );
  const [celebrantMemberId, setCelebrantMemberId] = useState("");
  const [celebrantName, setCelebrantName] = useState("");
  const [timing, setTiming] = useState<IdeaTiming>(defaultTiming);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [places, setPlaces] = useState<IdeaPlace[]>([
    { kind: "custom", name: "", address: "" },
  ]);
  const [schedule, setSchedule] = useState<IdeaScheduleInput>({});
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setTiming(defaultTiming);
      setSchedule({});
      setError("");
      setTitleTouched(false);
    }
  }, [open, defaultTiming]);

  useEffect(() => {
    if (type === "movie") {
      if (movieVenue === "home") {
        setPlaces([
          { kind: "member_home", name: "", address: "", memberId: undefined },
        ]);
      } else {
        setPlaces([{ kind: "custom", name: "", address: "" }]);
      }
      return;
    }
    if (type === "birthday") {
      if (birthdayVenue === "home") {
        setPlaces([memberHomePlace(currentUser)]);
      } else {
        setPlaces([{ kind: "custom", name: "", address: "" }]);
      }
      return;
    }
    if (type === "series") {
      setPlaces([]);
      return;
    }
    if (type === "plan") {
      setPlaces([{ kind: "custom", name: "", address: "" }]);
      return;
    }
    setPlaces([{ kind: "custom", name: "", address: "" }]);
  }, [type, movieVenue, birthdayVenue, currentUser]);

  useEffect(() => {
    if (type !== "birthday" || titleTouched) return;
    const name =
      celebrantMode === "member"
        ? members.find((m) => m.id === celebrantMemberId)?.name
        : celebrantName.trim();
    if (!name) return;
    const kindLabel =
      birthdayKind === "meal"
        ? "Comida de cumple"
        : birthdayKind === "party"
          ? "Fiesta de cumple"
          : "Cumple";
    setTitle(`${kindLabel} de ${name}`);
  }, [
    type,
    celebrantMode,
    celebrantMemberId,
    celebrantName,
    birthdayKind,
    members,
    titleTouched,
  ]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Poné un título.");
      return;
    }
    if (type === "movie" && !movieVenue) {
      setError("Elegí si es en cine o en casa.");
      return;
    }
    let resolvedCelebrantName: string | undefined;
    let resolvedCelebrantMemberId: string | undefined;
    if (type === "birthday") {
      if (celebrantMode === "member") {
        const member = members.find((m) => m.id === celebrantMemberId);
        if (!member) {
          setError("Elegí quién cumple años.");
          return;
        }
        resolvedCelebrantName = member.name;
        resolvedCelebrantMemberId = member.id;
      } else {
        if (!celebrantName.trim()) {
          setError("Poné el nombre de quien cumple.");
          return;
        }
        resolvedCelebrantName = celebrantName.trim();
      }
    }
    const placeError = validatePlaces(
      type,
      places,
      type === "movie" ? movieVenue : undefined,
    );
    if (placeError) {
      setError(placeError);
      return;
    }
    const needs = ideaNeedsPlaces(
      type,
      type === "movie" ? movieVenue : undefined,
    );
    onSubmit({
      type,
      title,
      notes,
      movieVenue: type === "movie" ? movieVenue : undefined,
      celebrantName: resolvedCelebrantName,
      celebrantMemberId: resolvedCelebrantMemberId,
      birthdayKind: type === "birthday" ? birthdayKind : undefined,
      places: needs ? cleanPlaces(places, members) : [],
      timing,
      tags: tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      ...schedule,
    });
    setTitle("");
    setNotes("");
    setPlaces([{ kind: "custom", name: "", address: "" }]);
    setSchedule({});
    setTagInput("");
    setError("");
    setMovieVenue("home");
    setBirthdayKind("meal");
    setBirthdayVenue("home");
    setCelebrantMode("other");
    setCelebrantMemberId("");
    setCelebrantName("");
    setTitleTouched(false);
    setTiming(defaultTiming);
  }

  const needsPlaces = ideaNeedsPlaces(
    type,
    type === "movie" ? movieVenue : undefined,
  );
  const placeMode =
    type === "movie" && movieVenue === "home"
      ? "home"
      : type === "movie" && movieVenue === "cinema"
        ? "cinema"
        : type === "birthday" && birthdayVenue === "home"
          ? "home"
          : "places";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="btn-primary">
        <Plus className="size-4" />
        Proponer idea
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-[var(--mute)]">
              ¿La guardan para después o la quieren decidir ya?
            </p>
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
                  Solo guardar, sin votos
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
                  Para votar / este finde
                </span>
              </button>
            </div>
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

          {type === "movie" ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--ink)]">
                ¿Dónde la ven? <span className="font-normal text-[var(--pop)]">*</span>
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMovieVenue("cinema")}
                  className={cn(
                    "border px-3 py-3 text-left text-sm",
                    movieVenue === "cinema"
                      ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                      : "border-[var(--line)] bg-white",
                  )}
                >
                  <span className="block font-semibold">En el cine</span>
                  <span className="mt-1 block text-xs opacity-80">
                    Hay que poner qué cine
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMovieVenue("home")}
                  className={cn(
                    "border px-3 py-3 text-left text-sm",
                    movieVenue === "home"
                      ? "border-[var(--pop)] bg-[var(--pop)] text-white"
                      : "border-[var(--line)] bg-white",
                  )}
                >
                  <span className="block font-semibold">En casa</span>
                  <span className="mt-1 block text-xs opacity-80">
                    Casa de alguien del grupo
                  </span>
                </button>
              </div>
            </div>
          ) : null}

          {type === "birthday" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--ink)]">
                  ¿Qué tipo de festejo?
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(Object.keys(BIRTHDAY_KIND_LABELS) as BirthdayKind[]).map(
                    (kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => setBirthdayKind(kind)}
                        className={cn(
                          "min-h-11 border px-3 py-2 text-sm font-semibold",
                          birthdayKind === kind
                            ? "border-[var(--pop)] bg-[var(--pop)] text-white"
                            : "border-[var(--line)] bg-white",
                        )}
                      >
                        {BIRTHDAY_KIND_LABELS[kind]}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--ink)]">
                  ¿Quién cumple?{" "}
                  <span className="font-normal text-[var(--pop)]">*</span>
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setCelebrantMode("other")}
                    className={cn(
                      "underline-offset-2",
                      celebrantMode === "other"
                        ? "font-semibold text-[var(--ink)] underline"
                        : "text-[var(--mute)]",
                    )}
                  >
                    Amigo / otra persona
                  </button>
                  <button
                    type="button"
                    onClick={() => setCelebrantMode("member")}
                    className={cn(
                      "underline-offset-2",
                      celebrantMode === "member"
                        ? "font-semibold text-[var(--ink)] underline"
                        : "text-[var(--mute)]",
                    )}
                  >
                    Alguien del grupo
                  </button>
                </div>
                {celebrantMode === "member" ? (
                  <select
                    value={celebrantMemberId}
                    onChange={(e) => setCelebrantMemberId(e.target.value)}
                    className="field-select"
                    required
                  >
                    <option value="">Elegí a alguien…</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={celebrantName}
                    onChange={(e) => setCelebrantName(e.target.value)}
                    placeholder="Ej. Nico, Juli…"
                    className="field-input"
                    required
                  />
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--ink)]">
                  ¿Dónde? <span className="font-normal text-[var(--pop)]">*</span>
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setBirthdayVenue("home")}
                    className={cn(
                      "border px-3 py-3 text-left text-sm",
                      birthdayVenue === "home"
                        ? "border-[var(--pop)] bg-[var(--pop)] text-white"
                        : "border-[var(--line)] bg-white",
                    )}
                  >
                    <span className="block font-semibold">En casa</span>
                    <span className="mt-1 block text-xs opacity-80">
                      Por defecto, la tuya
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBirthdayVenue("out")}
                    className={cn(
                      "border px-3 py-3 text-left text-sm",
                      birthdayVenue === "out"
                        ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                        : "border-[var(--line)] bg-white",
                    )}
                  >
                    <span className="block font-semibold">Fuera / otro sitio</span>
                    <span className="mt-1 block text-xs opacity-80">
                      Restó, parque, salón…
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitleTouched(true);
                setTitle(e.target.value);
              }}
              placeholder={
                type === "series"
                  ? "Ej. Severance"
                  : type === "movie"
                    ? "Ej. Past Lives"
                    : type === "food"
                      ? "Ej. Ramen en Malasaña"
                      : type === "birthday"
                        ? "Ej. Comida de cumple de Nico"
                        : "Ej. Escape + cañas"
              }
              className="field-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                type === "birthday"
                  ? "Traer torta, alergias, qué cocinamos…"
                  : "Por qué les gusta…"
              }
              className="min-h-20"
            />
          </div>

          {needsPlaces ? (
            <PlaceFields
              type={type}
              places={places}
              onChange={setPlaces}
              members={members}
              mode={placeMode}
              error={error && needsPlaces ? error : undefined}
            />
          ) : type === "series" ? (
            <p className="rounded bg-[var(--wash)] px-3 py-2 text-xs text-[var(--mute)]">
              Las series no piden lugar (normalmente se ven en casa).
            </p>
          ) : null}

          <ScheduleFields value={schedule} onChange={setSchedule} />

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (opcional, separados por coma)</Label>            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="noche, cerca, barato"
              className="field-input"
            />
          </div>
          {error && !needsPlaces ? (
            <p className="text-sm text-[var(--pop)]">{error}</p>
          ) : null}
          <Button
            type="submit"
            className="w-full"
          >
            {timing === "catalog" ? "Guardar en catálogo" : "Meter en Pronto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
