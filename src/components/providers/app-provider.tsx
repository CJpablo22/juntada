"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  captainCanBreakTie,
  isoWeekKey,
} from "@/lib/captain";
import { createId, createInviteCode } from "@/lib/id";
import { POINT_REASONS } from "@/lib/points";
import { loadState, resetState, saveState } from "@/lib/storage";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  cloudCaptainBreakTie,
  cloudCreateGroup,
  cloudDeleteGroup,
  cloudInsertExpense,
  cloudInsertIdea,
  cloudInsertPoint,
  cloudInsertReview,
  cloudJoinGroup,
  cloudKickMember,
  cloudLeaveGroup,
  cloudRenameGroup,
  cloudCastVote,
  cloudRevealVotes,
  cloudToggleSoftVeto,
  cloudUpdateIdea,
  loadCloudState,
  newCloudId,
} from "@/lib/supabase/db";
import {
  ensureProfileFromAuth,
  updateProfileRow,
  userFromAuth,
} from "@/lib/supabase/profile";
import { notifyGroup } from "@/lib/notify-client";
import type {
  AppState,
  AuthProvider,
  Expense,
  Group,
  GroupKind,
  GroupLocationVisibility,
  GroupNameVisibility,
  Idea,
  BirthdayKind,
  IdeaPlace,
  IdeaScheduleInput,
  IdeaTiming,
  IdeaType,
  MovieVenue,
  Review,
  User,
} from "@/lib/types";
import { cleanScheduleInput } from "@/lib/types";

const cloudConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

type AppContextValue = {
  ready: boolean;
  state: AppState;
  currentUser: User | null;
  signInAs: (userId: string) => void;
  signInWithEmail: (input: {
    email: string;
    name?: string;
    city?: string;
  }) => string;
  signInWithPhone: (input: {
    phone: string;
    name?: string;
    city?: string;
  }) => string;
  signInWithApple: (input?: { name?: string; city?: string }) => string;
  createUser: (input: {
    name: string;
    country?: string;
    province?: string;
    city: string;
    neighborhood?: string;
    addressLine?: string;
    floorUnit?: string;
    postalCode?: string;
    email?: string;
    phone?: string;
    authProvider?: AuthProvider;
  }) => string;
  signOut: () => void;
  resetDemo: () => void;
  createGroup: (input: { name: string; kind: GroupKind }) => Promise<string | null>;
  joinGroupByCode: (code: string) => Promise<string | null>;
  leaveGroup: (groupId: string) => Promise<{ ok: boolean; error?: string }>;
  renameGroup: (
    groupId: string,
    name: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  kickMember: (
    groupId: string,
    userId: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteGroup: (groupId: string) => Promise<{ ok: boolean; error?: string }>;
  addIdea: (input: {
    groupId: string;
    type: IdeaType;
    title: string;
    notes: string;
    movieVenue?: MovieVenue;
    celebrantName?: string;
    celebrantMemberId?: string;
    birthdayKind?: BirthdayKind;
    places?: IdeaPlace[];
    address?: string;
    tags: string[];
    timing: IdeaTiming;
  } & IdeaScheduleInput) => string;
  updateIdeaSchedule: (ideaId: string, schedule: IdeaScheduleInput) => void;
  setIdeaTiming: (ideaId: string, timing: IdeaTiming) => void;
  castVote: (ideaId: string, score: number) => void;
  toggleSoftVeto: (ideaId: string) => void;
  revealVotes: (ideaId: string) => void;
  chooseIdea: (ideaId: string) => void;
  /** Capitán #1 rompe empate en Pronto (1×/semana). */
  breakTieAsCaptain: (ideaId: string) => string | null;
  markInProgress: (ideaId: string) => void;
  pickRandomIdea: (groupId: string, candidateIds?: string[]) => string | null;
  markDone: (
    ideaId: string,
    rating: number,
    note: string,
    publicVisible?: boolean,
    photoUrl?: string | null,
  ) => void;
  addReview: (input: {
    ideaId: string;
    rating: number;
    comment: string;
    publicVisible?: boolean;
    photoUrl?: string | null;
  }) => void;
  addExpense: (input: {
    groupId: string;
    ideaId?: string;
    title: string;
    amountCents: number;
    paidBy: string;
    splitBetween: string[];
  }) => void;
  updateProfile: (input: {
    name: string;
    country: string;
    province: string;
    city: string;
    neighborhood?: string;
    addressLine?: string;
    floorUnit?: string;
    postalCode?: string;
    phone?: string;
    instagram?: string;
    tiktok?: string;
  }) => void;
  completeOnboarding: (input: {
    name: string;
    country: string;
    province: string;
    city: string;
    neighborhood?: string;
    addressLine: string;
    floorUnit?: string;
    postalCode?: string;
    phone?: string;
    instagram?: string;
    tiktok?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  setGroupLocationVisibility: (
    groupId: string,
    level: GroupLocationVisibility,
  ) => void;
  setGroupNameVisibility: (
    groupId: string,
    level: GroupNameVisibility,
  ) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function addPoints(
  state: AppState,
  input: { groupId: string; userId: string; delta: number; reason: string },
  id?: string,
): AppState {
  const point = {
    id: id ?? createId("pt"),
    groupId: input.groupId,
    userId: input.userId,
    delta: input.delta,
    reason: input.reason,
    at: new Date().toISOString(),
  };
  return {
    ...state,
    points: [...state.points, point],
  };
}

function mergeUsersKeep(a: User[], b: User[]): User[] {
  const map = new Map<string, User>();
  for (const u of a) map.set(u.id, u);
  for (const u of b) map.set(u.id, u);
  return [...map.values()];
}

/** Cloud gana por id; se conservan ítems locales aún no visibles en Postgres (race / RLS lag). */
function mergeCloudWithLocal(cloud: AppState, local: AppState): AppState {
  if (local.currentUserId && local.currentUserId !== cloud.currentUserId) {
    return cloud;
  }
  const byId = <T extends { id: string }>(cloudItems: T[], localItems: T[]) => {
    const ids = new Set(cloudItems.map((x) => x.id));
    const pending = localItems.filter((x) => !ids.has(x.id));
    return pending.length === 0 ? cloudItems : [...pending, ...cloudItems];
  };
  return {
    ...cloud,
    users: mergeUsersKeep(local.users, cloud.users),
    groups: byId(cloud.groups, local.groups),
    ideas: byId(cloud.ideas, local.ideas),
    expenses: byId(cloud.expenses, local.expenses),
    points: byId(cloud.points, local.points),
    reviews: byId(cloud.reviews, local.reviews),
  };
}

function upsertUser(
  prev: AppState,
  match: (u: User) => boolean,
  create: () => User,
): { state: AppState; userId: string } {
  const existing = prev.users.find(match);
  if (existing) {
    return {
      state: { ...prev, currentUserId: existing.id },
      userId: existing.id,
    };
  }
  const user = create();
  return {
    state: {
      ...prev,
      users: [...prev.users, user],
      currentUserId: user.id,
    },
    userId: user.id,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => createEmpty());
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);
  useEffect(() => {
    userIdRef.current = state.currentUserId;
  }, [state.currentUserId]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function applyAuthUser(
      authUser: Parameters<typeof ensureProfileFromAuth>[1],
      opts?: { replace?: boolean },
    ) {
      const supabase = createSupabaseBrowserClient();
      const profile = await ensureProfileFromAuth(supabase, authUser);
      const cloud = await loadCloudState(supabase, profile);
      if (cancelled) return;
      setState((prev) => {
        if (opts?.replace) return cloud;
        // Conservar ideas/gastos recién creados si el reload llega antes que el INSERT
        if (prev.currentUserId === cloud.currentUserId) {
          return mergeCloudWithLocal(cloud, prev);
        }
        return cloud;
      });
      setReady(true);
    }

    async function boot() {
      const local = loadState();

      if (!cloudConfigured) {
        if (!cancelled) {
          setState(local);
          setReady(true);
        }
        return;
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (!authUser) {
          setState({ ...createEmpty(), currentUserId: null });
          setReady(true);
        } else {
          // Boot: fuente de verdad = cloud (merge con cache local del mismo user)
          const profile = await ensureProfileFromAuth(supabase, authUser);
          const cloud = await loadCloudState(supabase, profile);
          if (cancelled) return;
          if (
            local.currentUserId === cloud.currentUserId &&
            (local.ideas.length > 0 ||
              local.expenses.length > 0 ||
              local.groups.length > 0)
          ) {
            setState(mergeCloudWithLocal(cloud, local));
          } else {
            setState(cloud);
          }
          setReady(true);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_OUT") {
            setState({ ...createEmpty(), currentUserId: null });
            setReady(true);
            return;
          }
          // Solo login real con otro user (o primera sesión).
          // Un SIGNED_IN del mismo user NO debe pisar ideas/gastos en memoria.
          if (event === "SIGNED_IN" && session?.user) {
            if (
              readyRef.current &&
              userIdRef.current === session.user.id
            ) {
              return;
            }
            void (async () => {
              try {
                await applyAuthUser(session.user, { replace: true });
              } catch {
                if (cancelled) return;
                setState((prev) => {
                  const found = prev.users.find((u) => u.id === session.user.id);
                  if (found) {
                    return {
                      ...prev,
                      users: prev.users.map((u) =>
                        u.id === session.user.id
                          ? { ...userFromAuth(session.user, u) }
                          : u,
                      ),
                      currentUserId: session.user.id,
                    };
                  }
                  return {
                    ...prev,
                    users: [...prev.users, userFromAuth(session.user)],
                    currentUserId: session.user.id,
                  };
                });
                setReady(true);
              }
            })();
          }
        });
        unsubscribe = () => subscription.unsubscribe();
      } catch {
        if (!cancelled) {
          setState({ ...local, currentUserId: null });
          setReady(true);
        }
      }
    }

    void boot();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    // En cloud la fuente de verdad es Postgres; localStorage solo como cache offline ligera
    saveState(state);
  }, [state, ready]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  );

  const signInAs = useCallback((userId: string) => {
    setState((prev) => ({ ...prev, currentUserId: userId }));
  }, []);

  const createUser = useCallback(
    (input: {
      name: string;
      country?: string;
      province?: string;
      city: string;
      neighborhood?: string;
      addressLine?: string;
      floorUnit?: string;
      postalCode?: string;
      email?: string;
      phone?: string;
      authProvider?: AuthProvider;
    }) => {
      const id = createId("user");
      const user: User = {
        id,
        name: input.name.trim(),
        country: (input.country ?? "ES").trim() || "ES",
        province: (input.province ?? "").trim() || "Madrid",
        city: input.city.trim(),
        neighborhood: input.neighborhood?.trim() || undefined,
        addressLine: input.addressLine?.trim() || undefined,
        floorUnit: input.floorUnit?.trim() || undefined,
        postalCode: input.postalCode?.trim() || undefined,
        groupLocationVisibility: {},
        groupNameVisibility: {},
        email: input.email?.trim().toLowerCase() || undefined,
        phone: input.phone?.trim() || undefined,
        profileComplete: Boolean(input.addressLine),
        authProvider: input.authProvider ?? "demo",
        avatarHue: Math.floor(Math.random() * 360),
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        users: [...prev.users, user],
        currentUserId: id,
      }));
      return id;
    },
    [],
  );

  const signInWithEmail = useCallback(
    (input: { email: string; name?: string; city?: string }) => {
      const email = input.email.trim().toLowerCase();
      let userId = "";
      setState((prev) => {
        const result = upsertUser(
          prev,
          (u) => (u.email ?? "").toLowerCase() === email,
          () => ({
            id: createId("user"),
            name: input.name?.trim() || email.split("@")[0] || "Usuario",
            username: email.split("@")[0],
            country: "ES",
            province: "Madrid",
            city: input.city?.trim() || "Madrid",
            neighborhood: "Malasaña",
            groupLocationVisibility: {},
            groupNameVisibility: {},
            email,
            profileComplete: false,
            authProvider: "email" as const,
            avatarHue: Math.floor(Math.random() * 360),
            createdAt: new Date().toISOString(),
          }),
        );
        userId = result.userId;
        return result.state;
      });
      return userId;
    },
    [],
  );

  const signInWithPhone = useCallback(
    (input: { phone: string; name?: string; city?: string }) => {
      const phone = input.phone.trim();
      let userId = "";
      setState((prev) => {
        const result = upsertUser(
          prev,
          (u) => (u.phone ?? "").replace(/\s/g, "") === phone.replace(/\s/g, ""),
          () => ({
            id: createId("user"),
            name: input.name?.trim() || `User ${phone.slice(-4)}`,
            username: `user${phone.replace(/\D/g, "").slice(-6)}`,
            country: "ES",
            province: "Madrid",
            city: input.city?.trim() || "Madrid",
            neighborhood: "Malasaña",
            groupLocationVisibility: {},
            groupNameVisibility: {},
            phone,
            profileComplete: false,
            authProvider: "phone" as const,
            avatarHue: Math.floor(Math.random() * 360),
            createdAt: new Date().toISOString(),
          }),
        );
        userId = result.userId;
        return result.state;
      });
      return userId;
    },
    [],
  );

  const signInWithApple = useCallback(
    (input?: { name?: string; city?: string }) => {
      let userId = "";
      setState((prev) => {
        const appleKey = "apple.demo.local";
        const result = upsertUser(
          prev,
          (u) => u.authProvider === "apple" && u.email === appleKey,
          () => ({
            id: createId("user"),
            name: input?.name?.trim() || "Usuario Apple",
            username: "apple.demo",
            country: "ES",
            province: "Madrid",
            city: input?.city?.trim() || "Madrid",
            neighborhood: "Malasaña",
            groupLocationVisibility: {},
            groupNameVisibility: {},
            email: appleKey,
            profileComplete: false,
            authProvider: "apple" as const,
            avatarHue: Math.floor(Math.random() * 360),
            createdAt: new Date().toISOString(),
          }),
        );
        userId = result.userId;
        return result.state;
      });
      return userId;
    },
    [],
  );

  const signOut = useCallback(() => {
    setState({ ...createEmpty(), currentUserId: null });
    if (cloudConfigured) {
      void createSupabaseBrowserClient().auth.signOut();
    }
  }, []);

  const resetDemo = useCallback(() => {
    setState(resetState());
  }, []);

  const createGroup = useCallback(
    async (input: { name: string; kind: GroupKind }) => {
      const uid = state.currentUserId;
      if (!uid) return null;

      const id = cloudConfigured ? newCloudId() : createId("group");
      const inviteCode = createInviteCode();
      const name = input.name.trim();
      const kind = input.kind;

      const group: Group = {
        id,
        name,
        kind,
        inviteCode,
        memberIds: [uid],
        createdBy: uid,
        createdAt: new Date().toISOString(),
      };

      if (cloudConfigured) {
        const result = await cloudCreateGroup(createSupabaseBrowserClient(), {
          id,
          name,
          kind,
          inviteCode,
          userId: uid,
        });
        if (!result.ok) {
          console.error("No se pudo guardar el grupo:", result.error);
          return null;
        }
      }

      // Siempre dejar el grupo en memoria YA (antes de navegar).
      // Un reload vacío de la DB no debe borrar este grupo.
      setState((prev) => {
        const without = prev.groups.filter((g) => g.id !== id);
        return {
          ...prev,
          groups: [group, ...without],
          users: prev.users.map((u) =>
            u.id === uid
              ? {
                  ...u,
                  groupLocationVisibility: {
                    ...u.groupLocationVisibility,
                    [id]: u.groupLocationVisibility[id] ?? "province",
                  },
                }
              : u,
          ),
        };
      });

      if (cloudConfigured) {
        // Sync en segundo plano; NUNCA reemplazar a ciegas (borra ideas/gastos locales)
        void (async () => {
          try {
            const supabase = createSupabaseBrowserClient();
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;
            const profile = await ensureProfileFromAuth(supabase, user);
            const cloud = await loadCloudState(supabase, profile);
            setState((prev) => {
              const merged = mergeCloudWithLocal(cloud, prev);
              if (merged.groups.some((g) => g.id === id)) return merged;
              return {
                ...merged,
                groups: [group, ...merged.groups.filter((g) => g.id !== id)],
              };
            });
          } catch (e) {
            console.error("reload after createGroup", e);
          }
        })();
      }

      return id;
    },
    [state.currentUserId],
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (cloudConfigured) {
        const result = await cloudLeaveGroup(
          createSupabaseBrowserClient(),
          groupId,
        );
        if (!result.ok) return result;
        setState((prev) => ({
          ...prev,
          groups: prev.groups.filter((g) => g.id !== groupId),
          ideas: prev.ideas.filter((i) => i.groupId !== groupId),
          expenses: prev.expenses.filter((e) => e.groupId !== groupId),
          points: prev.points.filter((p) => p.groupId !== groupId),
        }));
        return { ok: true };
      }
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        const uid = prev.currentUserId;
        return {
          ...prev,
          groups: prev.groups
            .map((g) =>
              g.id === groupId
                ? { ...g, memberIds: g.memberIds.filter((id) => id !== uid) }
                : g,
            )
            .filter((g) => g.memberIds.length > 0),
        };
      });
      return { ok: true };
    },
    [],
  );

  const renameGroup = useCallback(async (groupId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Nombre vacío" };
    if (cloudConfigured) {
      const result = await cloudRenameGroup(
        createSupabaseBrowserClient(),
        groupId,
        trimmed,
      );
      if (!result.ok) return result;
    }
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, name: trimmed } : g,
      ),
    }));
    return { ok: true };
  }, []);

  const kickMember = useCallback(async (groupId: string, userId: string) => {
    if (cloudConfigured) {
      const result = await cloudKickMember(
        createSupabaseBrowserClient(),
        groupId,
        userId,
      );
      if (!result.ok) return result;
    }
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId
          ? { ...g, memberIds: g.memberIds.filter((id) => id !== userId) }
          : g,
      ),
    }));
    return { ok: true };
  }, []);

  const deleteGroup = useCallback(async (groupId: string) => {
    if (cloudConfigured) {
      const result = await cloudDeleteGroup(
        createSupabaseBrowserClient(),
        groupId,
      );
      if (!result.ok) return result;
    }
    setState((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g.id !== groupId),
      ideas: prev.ideas.filter((i) => i.groupId !== groupId),
      expenses: prev.expenses.filter((e) => e.groupId !== groupId),
      points: prev.points.filter((p) => p.groupId !== groupId),
    }));
    return { ok: true };
  }, []);

  const joinGroupByCode = useCallback(async (code: string) => {
    if (cloudConfigured) {
      const supabase = createSupabaseBrowserClient();
      const gid = await cloudJoinGroup(supabase, code.trim());
      if (!gid) return null;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const profile = await ensureProfileFromAuth(supabase, user);
      const cloud = await loadCloudState(supabase, profile);
      setState(cloud);
      const groupName =
        cloud.groups.find((g) => g.id === gid)?.name ?? "el grupo";
      notifyGroup({
        groupId: gid,
        eventType: "group_invite",
        title: `${profile.name} se unió a ${groupName}`,
        body: "Hay un integrante nuevo. Compartí el catálogo y lo que viene pronto.",
        payload: { userId: profile.id, groupId: gid },
      });
      return gid;
    }

    let joinedId: string | null = null;
    setState((prev) => {
      if (!prev.currentUserId) return prev;
      const uid = prev.currentUserId;
      const group = prev.groups.find(
        (g) => g.inviteCode.toUpperCase() === code.trim().toUpperCase(),
      );
      if (!group) return prev;
      joinedId = group.id;
      if (group.memberIds.includes(uid)) return prev;
      return {
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === group.id
            ? { ...g, memberIds: [...g.memberIds, uid] }
            : g,
        ),
        users: prev.users.map((u) =>
          u.id === uid
            ? {
                ...u,
                groupLocationVisibility: {
                  ...u.groupLocationVisibility,
                  [group.id]: u.groupLocationVisibility[group.id] ?? "province",
                },
              }
            : u,
        ),
      };
    });
    return joinedId;
  }, []);

  const addIdea = useCallback(
    (input: {
      groupId: string;
      type: IdeaType;
      title: string;
      notes: string;
      movieVenue?: MovieVenue;
      celebrantName?: string;
      celebrantMemberId?: string;
      birthdayKind?: BirthdayKind;
      places?: IdeaPlace[];
      address?: string;
      tags: string[];
      timing: IdeaTiming;
    } & IdeaScheduleInput) => {
      const uid = userIdRef.current;
      if (!uid) return "";
      const id = cloudConfigured ? newCloudId() : createId("idea");
      const pointId = cloudConfigured ? newCloudId() : createId("pt");
      const createdAt = new Date().toISOString();
      const places = (input.places ?? [])
        .map((p) => ({
          kind: p.kind ?? ("custom" as const),
          memberId: p.memberId,
          name: p.name.trim(),
          address: p.address.trim(),
        }))
        .filter((p) =>
          p.kind === "member_home"
            ? Boolean(p.memberId && p.name)
            : Boolean(p.name && p.address),
        );
      const schedule = cleanScheduleInput(input);
      const idea: Idea = {
        id,
        groupId: input.groupId,
        type: input.type,
        title: input.title.trim(),
        notes: input.notes.trim(),
        movieVenue: input.type === "movie" ? input.movieVenue : undefined,
        celebrantName:
          input.type === "birthday"
            ? input.celebrantName?.trim() || undefined
            : undefined,
        celebrantMemberId:
          input.type === "birthday"
            ? input.celebrantMemberId?.trim() || undefined
            : undefined,
        birthdayKind:
          input.type === "birthday" ? input.birthdayKind ?? "meal" : undefined,
        places,
        address: places[0]?.address || input.address?.trim() || undefined,
        ...schedule,
        proposedBy: uid,
        status: "pending",
        timing: input.timing,
        tags: input.tags,
        votes: {},
        revealed: false,
        softVetoUserIds: [],
        createdAt,
      };
      const point = {
        id: pointId,
        groupId: input.groupId,
        userId: uid,
        delta: POINT_REASONS.propose.delta,
        reason: POINT_REASONS.propose.label,
        at: createdAt,
      };

      setState((prev) => {
        if (!prev.currentUserId) return prev;
        return {
          ...prev,
          ideas: [idea, ...prev.ideas],
          points: [...prev.points, point],
        };
      });

      if (cloudConfigured) {
        void (async () => {
          const sb = createSupabaseBrowserClient();
          const ideaRes = await cloudInsertIdea(sb, idea);
          if (!ideaRes.ok) {
            console.error(
              "No se pudo guardar la idea en la nube:",
              ideaRes.error,
            );
            return;
          }
          const ptRes = await cloudInsertPoint(sb, point);
          if (!ptRes.ok) {
            console.error("No se pudo guardar el punto:", ptRes.error);
          }
          notifyGroup({
            groupId: input.groupId,
            eventType: "idea_proposed",
            title: `Nueva idea: ${idea.title}`,
            body: `${idea.title} se sumó al grupo. Entrá a votar o guardar.`,
            payload: { ideaId: idea.id, groupId: input.groupId },
          });
        })();
      }
      return id;
    },
    [],
  );

  const updateIdeaSchedule = useCallback(
    (ideaId: string, scheduleInput: IdeaScheduleInput) => {
      const schedule = cleanScheduleInput(scheduleInput);
      setState((prev) => {
        const nextIdeas = prev.ideas.map((i) =>
          i.id === ideaId
            ? {
                ...i,
                scheduledDate: schedule.scheduledDate,
                scheduledTime: schedule.scheduledTime,
                durationMinutes: schedule.durationMinutes,
                dateFlexible: schedule.dateFlexible,
                link: schedule.link,
                budgetNote: schedule.budgetNote,
              }
            : i,
        );
        if (cloudConfigured) {
          void cloudUpdateIdea(createSupabaseBrowserClient(), ideaId, {
            scheduled_date: schedule.scheduledDate ?? null,
            scheduled_time: schedule.scheduledTime ?? null,
            duration_minutes: schedule.durationMinutes ?? null,
            date_flexible: schedule.dateFlexible ?? false,
            link: schedule.link ?? null,
            budget_note: schedule.budgetNote ?? null,
          });
        }
        return { ...prev, ideas: nextIdeas };
      });
    },
    [],
  );

  const setIdeaTiming = useCallback((ideaId: string, timing: IdeaTiming) => {
    setState((prev) => {
      const nextIdeas = prev.ideas.map((i) =>
        i.id === ideaId
          ? {
              ...i,
              timing,
              status:
                timing === "catalog" && i.status === "chosen"
                  ? "pending"
                  : i.status,
            }
          : i,
      );
      if (cloudConfigured) {
        const idea = nextIdeas.find((i) => i.id === ideaId);
        if (idea) {
          void cloudUpdateIdea(createSupabaseBrowserClient(), ideaId, {
            timing: idea.timing,
            status: idea.status,
          });
        }
      }
      return { ...prev, ideas: nextIdeas };
    });
  }, []);

  const castVote = useCallback((ideaId: string, score: number) => {
    setState((prev) => {
      if (!prev.currentUserId) return prev;
      const idea = prev.ideas.find((i) => i.id === ideaId);
      if (
        !idea ||
        idea.status === "done" ||
        idea.status === "archived" ||
        idea.status === "in_progress" ||
        idea.timing !== "soon"
      ) {
        return prev;
      }
      const already = idea.votes[prev.currentUserId] != null;
      const votes = { ...idea.votes, [prev.currentUserId]: score };
      let next: AppState = {
        ...prev,
        ideas: prev.ideas.map((i) =>
          i.id === ideaId ? { ...i, votes } : i,
        ),
      };
      const pointId = cloudConfigured ? newCloudId() : createId("pt");
      if (!already) {
        next = addPoints(
          next,
          {
            groupId: idea.groupId,
            userId: prev.currentUserId,
            delta: POINT_REASONS.voted.delta,
            reason: POINT_REASONS.voted.label,
          },
          pointId,
        );
      }
      if (cloudConfigured) {
        const sb = createSupabaseBrowserClient();
        void cloudCastVote(sb, ideaId, score);
        if (!already) {
          void cloudInsertPoint(sb, next.points[next.points.length - 1]);
          const memberCount =
            prev.groups.find((g) => g.id === idea.groupId)?.memberIds.length ??
            0;
          const voteCount = Object.keys(votes).length;
          if (memberCount > 0 && voteCount >= memberCount) {
            notifyGroup({
              groupId: idea.groupId,
              eventType: "votes_revealed",
              title: `Todos votaron: ${idea.title}`,
              body: "Ya están los votos del grupo. Revisá el resultado.",
              payload: { ideaId, groupId: idea.groupId },
            });
          }
        }
      }
      return next;
    });
  }, []);

  const toggleSoftVeto = useCallback((ideaId: string) => {
    setState((prev) => {
      if (!prev.currentUserId) return prev;
      let softVetoUserIds: string[] = [];
      const ideas = prev.ideas.map((i) => {
        if (i.id !== ideaId) return i;
        const has = i.softVetoUserIds.includes(prev.currentUserId!);
        softVetoUserIds = has
          ? i.softVetoUserIds.filter((id) => id !== prev.currentUserId)
          : [...i.softVetoUserIds, prev.currentUserId!];
        return { ...i, softVetoUserIds };
      });
      if (cloudConfigured) {
        void cloudToggleSoftVeto(createSupabaseBrowserClient(), ideaId);
      }
      return { ...prev, ideas };
    });
  }, []);

  const revealVotes = useCallback((ideaId: string) => {
    setState((prev) => {
      if (cloudConfigured) {
        void cloudRevealVotes(createSupabaseBrowserClient(), ideaId);
      }
      return {
        ...prev,
        ideas: prev.ideas.map((i) =>
          i.id === ideaId ? { ...i, revealed: true } : i,
        ),
      };
    });
  }, []);

  const chooseIdea = useCallback((ideaId: string) => {
    setState((prev) => {
      const idea = prev.ideas.find((i) => i.id === ideaId);
      if (!idea || idea.status === "done" || idea.status === "in_progress")
        return prev;
      const pointId = cloudConfigured ? newCloudId() : createId("pt");
      let next: AppState = {
        ...prev,
        ideas: prev.ideas.map((i) => {
          if (i.groupId !== idea.groupId) return i;
          if (i.id === ideaId)
            return {
              ...i,
              status: "chosen",
              revealed: true,
              timing: "soon",
            };
          // Solo deselige otra "elegida"; no toca las que están en proceso
          if (i.status === "chosen") return { ...i, status: "pending" };
          return i;
        }),
      };
      next = addPoints(
        next,
        {
          groupId: idea.groupId,
          userId: idea.proposedBy,
          delta: POINT_REASONS.chosen.delta,
          reason: POINT_REASONS.chosen.label,
        },
        pointId,
      );
      if (cloudConfigured) {
        const sb = createSupabaseBrowserClient();
        void cloudRevealVotes(sb, ideaId);
        for (const i of next.ideas.filter((x) => x.groupId === idea.groupId)) {
          void cloudUpdateIdea(sb, i.id, {
            status: i.status,
            timing: i.timing,
          });
        }
        void cloudInsertPoint(sb, next.points[next.points.length - 1]);
        notifyGroup({
          groupId: idea.groupId,
          eventType: "idea_chosen",
          title: `Elegido: ${idea.title}`,
          body: "El grupo ya tiene plan. Coordiná día y hora.",
          payload: { ideaId, groupId: idea.groupId },
        });
      }
      return next;
    });
  }, []);

  const breakTieAsCaptain = useCallback((ideaId: string): string | null => {
    let error: string | null = null;
    setState((prev) => {
      if (!prev.currentUserId) {
        error = "Tenés que estar logueado.";
        return prev;
      }
      const idea = prev.ideas.find((i) => i.id === ideaId);
      if (!idea) {
        error = "No encontramos esa idea.";
        return prev;
      }
      const group = prev.groups.find((g) => g.id === idea.groupId);
      if (!group) {
        error = "No encontramos el grupo.";
        return prev;
      }
      const check = captainCanBreakTie({
        memberIds: group.memberIds,
        points: prev.points,
        groupId: group.id,
        userId: prev.currentUserId,
        lastTieBreakWeek: group.lastCaptainTieBreakWeek,
        ideas: prev.ideas,
      });
      if (!check.ok) {
        error = check.reason;
        return prev;
      }
      if (!check.tied.some((t) => t.id === ideaId)) {
        error = "Esa idea no está en el empate.";
        return prev;
      }

      const week = isoWeekKey();
      const pointId = cloudConfigured ? newCloudId() : createId("pt");
      let next: AppState = {
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === group.id
            ? { ...g, lastCaptainTieBreakWeek: week }
            : g,
        ),
        ideas: prev.ideas.map((i) => {
          if (i.groupId !== group.id) return i;
          if (i.id === ideaId)
            return {
              ...i,
              status: "chosen",
              revealed: true,
              timing: "soon",
            };
          if (i.status === "chosen") return { ...i, status: "pending" };
          return i;
        }),
      };
      next = addPoints(
        next,
        {
          groupId: group.id,
          userId: idea.proposedBy,
          delta: POINT_REASONS.chosen.delta,
          reason: "El Capitán rompió el empate",
        },
        pointId,
      );

      if (cloudConfigured) {
        const sb = createSupabaseBrowserClient();
        void cloudCaptainBreakTie(sb, group.id, ideaId).then((res) => {
          if (!res.ok) {
            // Local already applied; cloud RPC may fail if migration missing.
            console.error(res.error);
          }
        });
        void cloudInsertPoint(sb, next.points[next.points.length - 1]);
        notifyGroup({
          groupId: group.id,
          eventType: "idea_chosen",
          title: `Capitán eligió: ${idea.title}`,
          body: "El #1 del grupo rompió el empate. ¡Plan listo!",
          payload: { ideaId, groupId: group.id, captainBreak: true },
        });
      }
      return next;
    });
    return error;
  }, []);

  const markInProgress = useCallback((ideaId: string) => {
    setState((prev) => {
      const idea = prev.ideas.find((i) => i.id === ideaId);
      if (!idea || idea.status === "done" || idea.status === "archived")
        return prev;
      const nextIdeas = prev.ideas.map((i) =>
        i.id === ideaId
          ? { ...i, status: "in_progress" as const, timing: "soon" as const, revealed: true }
          : i,
      );
      if (cloudConfigured) {
        const sb = createSupabaseBrowserClient();
        void cloudRevealVotes(sb, ideaId);
        void cloudUpdateIdea(sb, ideaId, {
          status: "in_progress",
          timing: "soon",
        });
        notifyGroup({
          groupId: idea.groupId,
          eventType: "generic",
          title: `En proceso: ${idea.title}`,
          body: "El grupo marcó este plan como en proceso.",
          payload: { ideaId, groupId: idea.groupId },
        });
      }
      return { ...prev, ideas: nextIdeas };
    });
  }, []);

  const pickRandomIdea = useCallback((groupId: string, candidateIds?: string[]) => {
    let picked: string | null = null;
    setState((prev) => {
      const idSet =
        candidateIds && candidateIds.length > 0
          ? new Set(candidateIds)
          : null;
      const candidates = prev.ideas.filter((i) => {
        if (i.groupId !== groupId) return false;
        if (i.timing !== "soon") return false;
        if (i.status !== "pending" && i.status !== "chosen") return false;
        if (i.softVetoUserIds.length > 0) return false;
        if (idSet && !idSet.has(i.id)) return false;
        return true;
      });
      if (candidates.length === 0) return prev;

      const scored = candidates.map((idea) => {
        const votes = Object.values(idea.votes);
        const avg =
          votes.length === 0
            ? 0
            : votes.reduce((a, b) => a + b, 0) / votes.length;
        return { idea, avg, votes: votes.length };
      });
      scored.sort((a, b) => b.avg - a.avg || b.votes - a.votes);
      const top = scored.slice(0, Math.min(3, scored.length));
      const winner = top[Math.floor(Math.random() * top.length)].idea;
      picked = winner.id;
      const pointId = cloudConfigured ? newCloudId() : createId("pt");

      let next: AppState = {
        ...prev,
        ideas: prev.ideas.map((i) => {
          if (i.groupId !== groupId) return i;
          if (i.id === winner.id)
            return { ...i, status: "chosen", revealed: true, timing: "soon" };
          if (i.status === "chosen") return { ...i, status: "pending" };
          return i;
        }),
      };
      next = addPoints(
        next,
        {
          groupId,
          userId: winner.proposedBy,
          delta: POINT_REASONS.chosen.delta,
          reason: POINT_REASONS.chosen.label,
        },
        pointId,
      );
      if (cloudConfigured) {
        const sb = createSupabaseBrowserClient();
        void cloudRevealVotes(sb, winner.id);
        for (const i of next.ideas.filter((x) => x.groupId === groupId)) {
          void cloudUpdateIdea(sb, i.id, {
            status: i.status,
            timing: i.timing,
          });
        }
        void cloudInsertPoint(sb, next.points[next.points.length - 1]);
        notifyGroup({
          groupId,
          eventType: "idea_chosen",
          title: `Sorteo: ${winner.title}`,
          body: "El azar eligió entre los finalistas. ¡A disfrutar!",
          payload: { ideaId: winner.id, groupId },
        });
      }
      return next;
    });
    return picked;
  }, []);

  const markDone = useCallback(
    (
      ideaId: string,
      rating: number,
      note: string,
      publicVisible = true,
      photoUrl: string | null = null,
    ) => {
      setState((prev) => {
        const idea = prev.ideas.find((i) => i.id === ideaId);
        if (!idea || !prev.currentUserId) return prev;
        const reviewId = cloudConfigured ? newCloudId() : createId("rev");
        const photo = photoUrl?.trim() || undefined;
        const review: Review = {
          id: reviewId,
          ideaId,
          userId: prev.currentUserId,
          rating,
          comment: note.trim(),
          publicVisible,
          photoUrl: photo,
          createdAt: new Date().toISOString(),
        };
        let next: AppState = {
          ...prev,
          ideas: prev.ideas.map((i) =>
            i.id === ideaId
              ? {
                  ...i,
                  status: "done",
                  revealed: true,
                  doneRating: rating,
                  doneNote: note.trim(),
                  donePhotoUrl: photo ?? i.donePhotoUrl,
                }
              : i,
          ),
          reviews: [
            ...prev.reviews.filter(
              (r) =>
                !(r.ideaId === ideaId && r.userId === prev.currentUserId),
            ),
            review,
          ],
        };
        const memoryPt = cloudConfigured ? newCloudId() : createId("pt");
        next = addPoints(
          next,
          {
            groupId: idea.groupId,
            userId: prev.currentUserId,
            delta: POINT_REASONS.memory.delta,
            reason: POINT_REASONS.memory.label,
          },
          memoryPt,
        );
        if (rating >= 4) {
          const wellPt = cloudConfigured ? newCloudId() : createId("pt");
          next = addPoints(
            next,
            {
              groupId: idea.groupId,
              userId: idea.proposedBy,
              delta: POINT_REASONS.doneWell.delta,
              reason: POINT_REASONS.doneWell.label,
            },
            wellPt,
          );
        }
        if (cloudConfigured) {
          const sb = createSupabaseBrowserClient();
          void cloudRevealVotes(sb, ideaId);
          void cloudUpdateIdea(sb, ideaId, {
            status: "done",
            done_rating: rating,
            done_note: note.trim(),
            done_photo_url: photo ?? null,
          });
          void cloudInsertReview(sb, review);
          const newPts = next.points.slice(-(rating >= 4 ? 2 : 1));
          for (const pt of newPts) void cloudInsertPoint(sb, pt);
        }
        return next;
      });
    },
    [],
  );

  const addReview = useCallback(
    (input: {
      ideaId: string;
      rating: number;
      comment: string;
      publicVisible?: boolean;
      photoUrl?: string | null;
    }) => {
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        const idea = prev.ideas.find((i) => i.id === input.ideaId);
        if (!idea || idea.status !== "done") return prev;
        const photo = input.photoUrl?.trim() || undefined;
        const review: Review = {
          id: cloudConfigured ? newCloudId() : createId("rev"),
          ideaId: input.ideaId,
          userId: prev.currentUserId,
          rating: input.rating,
          comment: input.comment.trim(),
          publicVisible: input.publicVisible ?? true,
          photoUrl: photo,
          createdAt: new Date().toISOString(),
        };
        let ideas = prev.ideas;
        if (photo && !idea.donePhotoUrl) {
          ideas = prev.ideas.map((i) =>
            i.id === input.ideaId ? { ...i, donePhotoUrl: photo } : i,
          );
          if (cloudConfigured) {
            void cloudUpdateIdea(createSupabaseBrowserClient(), input.ideaId, {
              done_photo_url: photo,
            });
          }
        }
        if (cloudConfigured) {
          void cloudInsertReview(createSupabaseBrowserClient(), review);
        }
        return {
          ...prev,
          ideas,
          reviews: [
            ...prev.reviews.filter(
              (r) =>
                !(
                  r.ideaId === input.ideaId &&
                  r.userId === prev.currentUserId
                ),
            ),
            review,
          ],
        };
      });
    },
    [],
  );

  const addExpense = useCallback(
    (input: {
      groupId: string;
      ideaId?: string;
      title: string;
      amountCents: number;
      paidBy: string;
      splitBetween: string[];
    }) => {
      const uid = userIdRef.current;
      if (!uid) return;
      const linkedIdea = input.ideaId
        ? stateRef.current.ideas.find((i) => i.id === input.ideaId)
        : undefined;
      // El festejado no puede cargar ni ver gastos de su propio cumple
      if (
        linkedIdea?.type === "birthday" &&
        linkedIdea.celebrantMemberId === uid
      ) {
        return;
      }
      const splitBetween =
        linkedIdea?.type === "birthday" && linkedIdea.celebrantMemberId
          ? input.splitBetween.filter(
              (id) => id !== linkedIdea.celebrantMemberId,
            )
          : input.splitBetween;
      if (splitBetween.length === 0) return;

      const expenseId = cloudConfigured ? newCloudId() : createId("exp");
      const pointId = cloudConfigured ? newCloudId() : createId("pt");
      const createdAt = new Date().toISOString();
      const expense: Expense = {
        id: expenseId,
        groupId: input.groupId,
        ideaId: input.ideaId,
        title: input.title.trim(),
        amountCents: input.amountCents,
        paidBy: input.paidBy,
        splitBetween,
        createdAt,
      };
      const point = {
        id: pointId,
        groupId: input.groupId,
        userId: uid,
        delta: POINT_REASONS.expense.delta,
        reason: POINT_REASONS.expense.label,
        at: createdAt,
      };

      setState((prev) => {
        if (!prev.currentUserId) return prev;
        return {
          ...prev,
          expenses: [expense, ...prev.expenses],
          points: [...prev.points, point],
        };
      });

      if (cloudConfigured) {
        void (async () => {
          const sb = createSupabaseBrowserClient();
          const expRes = await cloudInsertExpense(sb, expense);
          if (!expRes.ok) {
            console.error(
              "No se pudo guardar el gasto en la nube:",
              expRes.error,
            );
            return;
          }
          const ptRes = await cloudInsertPoint(sb, point);
          if (!ptRes.ok) {
            console.error("No se pudo guardar el punto:", ptRes.error);
          }
          notifyGroup({
            groupId: input.groupId,
            eventType: "expense_added",
            title: `Gasto: ${expense.title}`,
            body: "Hay un gasto nuevo en el grupo. Miralo en Saldos.",
            payload: {
              expenseId: expense.id,
              ideaId: expense.ideaId,
              groupId: input.groupId,
            },
          });
        })();
      }
    },
    [],
  );

  const updateProfile = useCallback(
    (input: {
      name: string;
      country: string;
      province: string;
      city: string;
      neighborhood?: string;
      addressLine?: string;
      floorUnit?: string;
      postalCode?: string;
      phone?: string;
      instagram?: string;
      tiktok?: string;
    }) => {
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        const uid = prev.currentUserId;
        if (cloudConfigured) {
          void updateProfileRow(createSupabaseBrowserClient(), uid, input);
        }
        return {
          ...prev,
          users: prev.users.map((u) =>
            u.id === uid
              ? {
                  ...u,
                  name: input.name.trim(),
                  country: input.country.trim() || "ES",
                  province: input.province.trim(),
                  city: input.city.trim(),
                  neighborhood: input.neighborhood?.trim() || undefined,
                  addressLine: input.addressLine?.trim() || undefined,
                  floorUnit: input.floorUnit?.trim() || undefined,
                  postalCode: input.postalCode?.trim() || undefined,
                  phone: input.phone?.trim() || undefined,
                  instagram: input.instagram?.trim().replace(/^@/, "") || undefined,
                  tiktok: input.tiktok?.trim().replace(/^@/, "") || undefined,
                }
              : u,
          ),
        };
      });
    },
    [],
  );

  const completeOnboarding = useCallback(
    async (input: {
      name: string;
      country: string;
      province: string;
      city: string;
      neighborhood?: string;
      addressLine: string;
      floorUnit?: string;
      postalCode?: string;
      phone?: string;
      instagram?: string;
      tiktok?: string;
    }) => {
      const uid = state.currentUserId;
      if (!uid) return { ok: false, error: "Sin sesión" };

      const patch = {
        name: input.name.trim(),
        country: input.country.trim() || "ES",
        province: input.province.trim(),
        city: input.city.trim(),
        neighborhood: input.neighborhood?.trim() || undefined,
        addressLine: input.addressLine.trim(),
        floorUnit: input.floorUnit?.trim() || undefined,
        postalCode: input.postalCode?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        instagram: input.instagram?.trim().replace(/^@/, "") || undefined,
        tiktok: input.tiktok?.trim().replace(/^@/, "") || undefined,
        profileComplete: true as const,
      };

      if (cloudConfigured) {
        const result = await updateProfileRow(
          createSupabaseBrowserClient(),
          uid,
          patch,
        );
        if (!result.ok) return result;
      }

      setState((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === uid
            ? {
                ...u,
                ...patch,
                profileComplete: true,
              }
            : u,
        ),
      }));
      return { ok: true };
    },
    [state.currentUserId],
  );

  const setGroupLocationVisibility = useCallback(
    (groupId: string, level: GroupLocationVisibility) => {
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        const uid = prev.currentUserId;
        const me = prev.users.find((u) => u.id === uid);
        const nextVisibility = {
          ...(me?.groupLocationVisibility ?? {}),
          [groupId]: level,
        };
        if (cloudConfigured) {
          void updateProfileRow(createSupabaseBrowserClient(), uid, {
            groupLocationVisibility: nextVisibility,
          });
        }
        return {
          ...prev,
          users: prev.users.map((u) =>
            u.id === uid
              ? { ...u, groupLocationVisibility: nextVisibility }
              : u,
          ),
        };
      });
    },
    [],
  );

  const setGroupNameVisibility = useCallback(
    (groupId: string, level: GroupNameVisibility) => {
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        const uid = prev.currentUserId;
        const me = prev.users.find((u) => u.id === uid);
        const nextVisibility = {
          ...(me?.groupNameVisibility ?? {}),
          [groupId]: level,
        };
        if (cloudConfigured) {
          void updateProfileRow(createSupabaseBrowserClient(), uid, {
            groupNameVisibility: nextVisibility,
          });
        }
        return {
          ...prev,
          users: prev.users.map((u) =>
            u.id === uid ? { ...u, groupNameVisibility: nextVisibility } : u,
          ),
        };
      });
    },
    [],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      state,
      currentUser,
      signInAs,
      signInWithEmail,
      signInWithPhone,
      signInWithApple,
      createUser,
      signOut,
      resetDemo,
      createGroup,
      joinGroupByCode,
      leaveGroup,
      renameGroup,
      kickMember,
      deleteGroup,
      addIdea,
      updateIdeaSchedule,
      setIdeaTiming,
      castVote,
      toggleSoftVeto,
      revealVotes,
      chooseIdea,
      breakTieAsCaptain,
      markInProgress,
      pickRandomIdea,
      markDone,
      addReview,
      addExpense,
      updateProfile,
      completeOnboarding,
      setGroupLocationVisibility,
      setGroupNameVisibility,
    }),
    [
      ready,
      state,
      currentUser,
      signInAs,
      signInWithEmail,
      signInWithPhone,
      signInWithApple,
      createUser,
      signOut,
      resetDemo,
      createGroup,
      joinGroupByCode,
      leaveGroup,
      renameGroup,
      kickMember,
      deleteGroup,
      addIdea,
      updateIdeaSchedule,
      setIdeaTiming,
      castVote,
      toggleSoftVeto,
      revealVotes,
      chooseIdea,
      breakTieAsCaptain,
      markInProgress,
      pickRandomIdea,
      markDone,
      addReview,
      addExpense,
      updateProfile,
      completeOnboarding,
      setGroupLocationVisibility,
      setGroupNameVisibility,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function createEmpty(): AppState {
  return {
    version: 2,
    currentUserId: null,
    users: [],
    groups: [],
    ideas: [],
    reviews: [],
    expenses: [],
    points: [],
  };
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
