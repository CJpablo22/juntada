"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createId, createInviteCode } from "@/lib/id";
import { POINT_REASONS } from "@/lib/points";
import { loadState, resetState, saveState } from "@/lib/storage";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  cloudCreateGroup,
  cloudInsertExpense,
  cloudInsertIdea,
  cloudInsertPoint,
  cloudInsertReview,
  cloudJoinGroup,
  cloudUpdateIdea,
  loadCloudState,
  newCloudId,
} from "@/lib/supabase/db";
import {
  ensureProfileFromAuth,
  updateProfileRow,
  userFromAuth,
} from "@/lib/supabase/profile";
import type {
  AppState,
  AuthProvider,
  Expense,
  Group,
  GroupKind,
  GroupLocationVisibility,
  Idea,
  IdeaPlace,
  IdeaTiming,
  IdeaType,
  MovieVenue,
  Review,
  User,
} from "@/lib/types";

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
  createGroup: (input: { name: string; kind: GroupKind }) => string;
  joinGroupByCode: (code: string) => Promise<string | null>;
  addIdea: (input: {
    groupId: string;
    type: IdeaType;
    title: string;
    notes: string;
    movieVenue?: MovieVenue;
    places?: IdeaPlace[];
    address?: string;
    tags: string[];
    timing: IdeaTiming;
  }) => string;
  setIdeaTiming: (ideaId: string, timing: IdeaTiming) => void;
  castVote: (ideaId: string, score: number) => void;
  toggleSoftVeto: (ideaId: string) => void;
  revealVotes: (ideaId: string) => void;
  chooseIdea: (ideaId: string) => void;
  pickRandomIdea: (groupId: string) => string | null;
  markDone: (
    ideaId: string,
    rating: number,
    note: string,
    publicVisible?: boolean,
  ) => void;
  addReview: (input: {
    ideaId: string;
    rating: number;
    comment: string;
    publicVisible?: boolean;
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
  }) => void;
  setGroupLocationVisibility: (
    groupId: string,
    level: GroupLocationVisibility,
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

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function applyAuthUser(
      authUser: Parameters<typeof ensureProfileFromAuth>[1],
    ) {
      const supabase = createSupabaseBrowserClient();
      const profile = await ensureProfileFromAuth(supabase, authUser);
      const cloud = await loadCloudState(supabase, profile);
      if (cancelled) return;
      setState(cloud);
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
          await applyAuthUser(authUser);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_OUT") {
            setState({ ...createEmpty(), currentUserId: null });
            return;
          }
          // boot() ya carga INITIAL_SESSION; acá solo login nuevo o cambio de identidad
          if (
            (event === "SIGNED_IN" || event === "USER_UPDATED") &&
            session?.user
          ) {
            void (async () => {
              try {
                await applyAuthUser(session.user);
              } catch {
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
        email: input.email?.trim().toLowerCase() || undefined,
        phone: input.phone?.trim() || undefined,
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
            country: "ES",
            province: "Madrid",
            city: input.city?.trim() || "Madrid",
            neighborhood: "Malasaña",
            groupLocationVisibility: {},
            email,
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
            country: "ES",
            province: "Madrid",
            city: input.city?.trim() || "Madrid",
            neighborhood: "Malasaña",
            groupLocationVisibility: {},
            phone,
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
            country: "ES",
            province: "Madrid",
            city: input?.city?.trim() || "Madrid",
            neighborhood: "Malasaña",
            groupLocationVisibility: {},
            email: appleKey,
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
    (input: { name: string; kind: GroupKind }) => {
      const id = cloudConfigured ? newCloudId() : createId("group");
      const inviteCode = createInviteCode();
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        const uid = prev.currentUserId;
        const group: Group = {
          id,
          name: input.name.trim(),
          kind: input.kind,
          inviteCode,
          memberIds: [uid],
          createdAt: new Date().toISOString(),
        };
        if (cloudConfigured) {
          void cloudCreateGroup(createSupabaseBrowserClient(), {
            id,
            name: group.name,
            kind: group.kind,
            inviteCode,
            userId: uid,
          });
        }
        return {
          ...prev,
          groups: [group, ...prev.groups],
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
      return id;
    },
    [],
  );

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
      places?: IdeaPlace[];
      address?: string;
      tags: string[];
      timing: IdeaTiming;
    }) => {
      const id = cloudConfigured ? newCloudId() : createId("idea");
      const pointId = cloudConfigured ? newCloudId() : createId("pt");
      setState((prev) => {
        if (!prev.currentUserId) return prev;
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
        const idea: Idea = {
          id,
          groupId: input.groupId,
          type: input.type,
          title: input.title.trim(),
          notes: input.notes.trim(),
          movieVenue: input.type === "movie" ? input.movieVenue : undefined,
          places,
          address: places[0]?.address || input.address?.trim() || undefined,
          proposedBy: prev.currentUserId,
          status: "pending",
          timing: input.timing,
          tags: input.tags,
          votes: {},
          revealed: false,
          softVetoUserIds: [],
          createdAt: new Date().toISOString(),
        };
        let next: AppState = { ...prev, ideas: [idea, ...prev.ideas] };
        next = addPoints(
          next,
          {
            groupId: input.groupId,
            userId: prev.currentUserId,
            delta: POINT_REASONS.propose.delta,
            reason: POINT_REASONS.propose.label,
          },
          pointId,
        );
        if (cloudConfigured) {
          const sb = createSupabaseBrowserClient();
          void cloudInsertIdea(sb, idea);
          const pt = next.points[next.points.length - 1];
          void cloudInsertPoint(sb, pt);
        }
        return next;
      });
      return id;
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
        void cloudUpdateIdea(sb, ideaId, { votes });
        if (!already) {
          void cloudInsertPoint(sb, next.points[next.points.length - 1]);
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
        void cloudUpdateIdea(createSupabaseBrowserClient(), ideaId, {
          soft_veto_user_ids: softVetoUserIds,
        });
      }
      return { ...prev, ideas };
    });
  }, []);

  const revealVotes = useCallback((ideaId: string) => {
    setState((prev) => {
      if (cloudConfigured) {
        void cloudUpdateIdea(createSupabaseBrowserClient(), ideaId, {
          revealed: true,
        });
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
      if (!idea) return prev;
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
        for (const i of next.ideas.filter((x) => x.groupId === idea.groupId)) {
          void cloudUpdateIdea(sb, i.id, {
            status: i.status,
            revealed: i.revealed,
            timing: i.timing,
          });
        }
        void cloudInsertPoint(sb, next.points[next.points.length - 1]);
      }
      return next;
    });
  }, []);

  const pickRandomIdea = useCallback((groupId: string) => {
    let picked: string | null = null;
    setState((prev) => {
      const candidates = prev.ideas.filter((i) => {
        if (i.groupId !== groupId) return false;
        if (i.timing !== "soon") return false;
        if (i.status !== "pending" && i.status !== "chosen") return false;
        if (i.softVetoUserIds.length > 0) return false;
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
        for (const i of next.ideas.filter((x) => x.groupId === groupId)) {
          void cloudUpdateIdea(sb, i.id, {
            status: i.status,
            revealed: i.revealed,
            timing: i.timing,
          });
        }
        void cloudInsertPoint(sb, next.points[next.points.length - 1]);
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
    ) => {
      setState((prev) => {
        const idea = prev.ideas.find((i) => i.id === ideaId);
        if (!idea || !prev.currentUserId) return prev;
        const reviewId = cloudConfigured ? newCloudId() : createId("rev");
        const review: Review = {
          id: reviewId,
          ideaId,
          userId: prev.currentUserId,
          rating,
          comment: note.trim(),
          publicVisible,
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
          void cloudUpdateIdea(sb, ideaId, {
            status: "done",
            revealed: true,
            done_rating: rating,
            done_note: note.trim(),
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
    }) => {
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        const idea = prev.ideas.find((i) => i.id === input.ideaId);
        if (!idea || idea.status !== "done") return prev;
        const review: Review = {
          id: cloudConfigured ? newCloudId() : createId("rev"),
          ideaId: input.ideaId,
          userId: prev.currentUserId,
          rating: input.rating,
          comment: input.comment.trim(),
          publicVisible: input.publicVisible ?? true,
          createdAt: new Date().toISOString(),
        };
        if (cloudConfigured) {
          void cloudInsertReview(createSupabaseBrowserClient(), review);
        }
        return {
          ...prev,
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
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        const expense: Expense = {
          id: cloudConfigured ? newCloudId() : createId("exp"),
          groupId: input.groupId,
          ideaId: input.ideaId,
          title: input.title.trim(),
          amountCents: input.amountCents,
          paidBy: input.paidBy,
          splitBetween: input.splitBetween,
          createdAt: new Date().toISOString(),
        };
        const pointId = cloudConfigured ? newCloudId() : createId("pt");
        let next: AppState = {
          ...prev,
          expenses: [expense, ...prev.expenses],
        };
        next = addPoints(
          next,
          {
            groupId: input.groupId,
            userId: prev.currentUserId,
            delta: POINT_REASONS.expense.delta,
            reason: POINT_REASONS.expense.label,
          },
          pointId,
        );
        if (cloudConfigured) {
          const sb = createSupabaseBrowserClient();
          void cloudInsertExpense(sb, expense);
          void cloudInsertPoint(sb, next.points[next.points.length - 1]);
        }
        return next;
      });
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
                }
              : u,
          ),
        };
      });
    },
    [],
  );

  const setGroupLocationVisibility = useCallback(
    (groupId: string, level: GroupLocationVisibility) => {
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        const uid = prev.currentUserId;
        const nextVisibility = {
          ...(prev.users.find((u) => u.id === uid)?.groupLocationVisibility ??
            {}),
          [groupId]: level,
        };
        if (cloudConfigured) {
          void updateProfileRow(createSupabaseBrowserClient(), uid, {
            name: prev.users.find((u) => u.id === uid)?.name ?? "",
            country: prev.users.find((u) => u.id === uid)?.country ?? "ES",
            province: prev.users.find((u) => u.id === uid)?.province ?? "",
            city: prev.users.find((u) => u.id === uid)?.city ?? "",
            neighborhood: prev.users.find((u) => u.id === uid)?.neighborhood,
            addressLine: prev.users.find((u) => u.id === uid)?.addressLine,
            floorUnit: prev.users.find((u) => u.id === uid)?.floorUnit,
            postalCode: prev.users.find((u) => u.id === uid)?.postalCode,
            groupLocationVisibility: nextVisibility,
          });
        }
        return {
          ...prev,
          users: prev.users.map((u) =>
            u.id === uid
              ? {
                  ...u,
                  groupLocationVisibility: nextVisibility,
                }
              : u,
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
      addIdea,
      setIdeaTiming,
      castVote,
      toggleSoftVeto,
      revealVotes,
      chooseIdea,
      pickRandomIdea,
      markDone,
      addReview,
      addExpense,
      updateProfile,
      setGroupLocationVisibility,
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
      addIdea,
      setIdeaTiming,
      castVote,
      toggleSoftVeto,
      revealVotes,
      chooseIdea,
      pickRandomIdea,
      markDone,
      addReview,
      addExpense,
      updateProfile,
      setGroupLocationVisibility,
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
