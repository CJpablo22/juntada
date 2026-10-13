"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, Copy, MapPin, Plus, Wallet } from "lucide-react";
import { LotteryButton } from "@/components/ideas/lottery-button";
import {
  PlaceFields,
  cleanPlaces,
  ideaNeedsPlaces,
  validatePlaces,
} from "@/components/ideas/place-fields";
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
import { getVisibleLocationForViewer } from "@/lib/privacy";
import {
  GROUP_KIND_LABELS,
  IDEA_TYPE_LABELS,
  MOVIE_VENUE_LABELS,
  formatPlace,
  type IdeaPlace,
  type IdeaTiming,
  type IdeaType,
  type MovieVenue,
  type User,
} from "@/lib/types";
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
  } = useApp();
  const [shelf, setShelf] = useState<ShelfFilter>("catalog");
  const [typeFilter, setTypeFilter] = useState<"all" | IdeaType>("all");
  const [openIdea, setOpenIdea] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

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
          return i.timing === "catalog" && i.status !== "done";
        if (shelf === "soon")
          return i.timing === "soon" && i.status !== "done";
        return i.status === "done";
      })
      .filter((i) => (typeFilter === "all" ? true : i.type === typeFilter));
  }, [state.ideas, group, shelf, typeFilter]);

  const chosen = state.ideas.find(
    (i) =>
      i.groupId === group?.id && i.status === "chosen" && i.timing === "soon",
  );

  const ranking = group
    ? rankMembers(group.memberIds, state.points, group.id)
    : [];

  const needsVote = useMemo(() => {
    if (!group || !currentUser) return null;
    return state.ideas.find(
      (i) =>
        i.groupId === group.id &&
        i.timing === "soon" &&
        i.status !== "done" &&
        i.status !== "archived" &&
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
                return (
                  <li key={m.id} className="flex items-center gap-2 text-sm">
                    <UserAvatar user={m} size="sm" className="size-6 text-[10px]" />
                    <span>
                      <span className="font-medium">{m.name}</span>
                      <span className="text-[var(--mute)]">
                        {" "}
                        · {visible.label}
                      </span>
                    </span>
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
        <section className="surface-panel space-y-3 p-4">
          <div>
            <p className="font-semibold text-[var(--ink)]">Decidir juntos</p>
            <p className="mt-1 text-sm text-[var(--mute)]">
              {chosen
                ? "Ya hay un plan elegido. Pueden cambiarlo con otro voto o el azar."
                : "Votá en cada idea, revelen los votos, o dejen que el azar elija entre Pronto."}
            </p>
          </div>
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
                idea.status === "chosen"
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
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/app/group/${group.id}/idea/${idea.id}`)
                      }
                      className={cn(
                        "min-w-0 flex-1 text-left hover:opacity-90",
                        idea.status === "chosen" && "rounded bg-[var(--pop-soft)]/50 p-2 -m-2",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--mute)]">
                        <span>{IDEA_TYPE_LABELS[idea.type]}</span>
                        {idea.type === "movie" && idea.movieVenue ? (
                          <span>· {MOVIE_VENUE_LABELS[idea.movieVenue]}</span>
                        ) : null}
                        {idea.status === "chosen" ? (
                          <Badge className="bg-[var(--pop)] text-white">
                            Elegida
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
          Se ganan al proponer, cerrar gastos o cuando una idea sale bien.
        </p>
        <ul className="mt-3 space-y-3">
          {ranking.map((row, index) => {
            const user = state.users.find((u) => u.id === row.userId);
            if (!user) return null;
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
                    </span>
                    <span className="block text-xs text-[var(--mute)]">
                      {badgeForRank(index, row.points)}
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
  defaultTiming = "catalog",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: User[];
  defaultTiming?: IdeaTiming;
  onSubmit: (data: {
    type: IdeaType;
    title: string;
    notes: string;
    movieVenue?: MovieVenue;
    places: IdeaPlace[];
    tags: string[];
    timing: IdeaTiming;
  }) => void;
}) {
  const [type, setType] = useState<IdeaType>("movie");
  const [movieVenue, setMovieVenue] = useState<MovieVenue>("home");
  const [timing, setTiming] = useState<IdeaTiming>(defaultTiming);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [places, setPlaces] = useState<IdeaPlace[]>([
    { kind: "custom", name: "", address: "" },
  ]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTiming(defaultTiming);
      setError("");
    }
  }, [open, defaultTiming]);

  useEffect(() => {
    if (type === "movie") {
      if (movieVenue === "home") {
        setPlaces([{ kind: "member_home", name: "", address: "", memberId: undefined }]);
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
  }, [type, movieVenue]);

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
    const placeError = validatePlaces(type, places, movieVenue);
    if (placeError) {
      setError(placeError);
      return;
    }
    const needs = ideaNeedsPlaces(type, movieVenue);
    onSubmit({
      type,
      title,
      notes,
      movieVenue: type === "movie" ? movieVenue : undefined,
      places: needs ? cleanPlaces(places, members) : [],
      timing,
      tags: tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setTitle("");
    setNotes("");
    setPlaces([{ kind: "custom", name: "", address: "" }]);
    setTagInput("");
    setError("");
    setMovieVenue("home");
    setTiming(defaultTiming);
  }

  const needsPlaces = ideaNeedsPlaces(type, movieVenue);
  const placeMode =
    type === "movie" && movieVenue === "home"
      ? "home"
      : type === "movie" && movieVenue === "cinema"
        ? "cinema"
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

          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "series"
                  ? "Ej. Severance"
                  : type === "movie"
                    ? "Ej. Past Lives"
                    : type === "food"
                      ? "Ej. Ramen en Malasaña"
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
              placeholder="Por qué les gusta…"
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

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (opcional, separados por coma)</Label>
            <Input
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
