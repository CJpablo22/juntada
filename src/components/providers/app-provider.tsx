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
import type {
  AppState,
  AuthProvider,
  Expense,
  Group,
  GroupKind,
  Idea,
  IdeaTiming,
  IdeaType,
  Review,
  User,
} from "@/lib/types";

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
    city: string;
    neighborhood?: string;
    email?: string;
    phone?: string;
    authProvider?: AuthProvider;
  }) => string;
  signOut: () => void;
  resetDemo: () => void;
  createGroup: (input: { name: string; kind: GroupKind }) => string;
  joinGroupByCode: (code: string) => string | null;
  addIdea: (input: {
    groupId: string;
    type: IdeaType;
    title: string;
    notes: string;
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
    city: string;
    neighborhood?: string;
  }) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function addPoints(
  state: AppState,
  input: { groupId: string; userId: string; delta: number; reason: string },
): AppState {
  return {
    ...state,
    points: [
      ...state.points,
      {
        id: createId("pt"),
        groupId: input.groupId,
        userId: input.userId,
        delta: input.delta,
        reason: input.reason,
        at: new Date().toISOString(),
      },
    ],
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
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
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
      city: string;
      neighborhood?: string;
      email?: string;
      phone?: string;
      authProvider?: AuthProvider;
    }) => {
      const id = createId("user");
      const user: User = {
        id,
        name: input.name.trim(),
        city: input.city.trim(),
        neighborhood: input.neighborhood?.trim() || undefined,
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
            city: input.city?.trim() || "Madrid",
            email,
            authProvider: "email",
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
            city: input.city?.trim() || "Madrid",
            phone,
            authProvider: "phone",
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
            city: input?.city?.trim() || "Madrid",
            email: appleKey,
            authProvider: "apple",
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
    setState((prev) => ({ ...prev, currentUserId: null }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(resetState());
  }, []);

  const createGroup = useCallback(
    (input: { name: string; kind: GroupKind }) => {
      const id = createId("group");
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        const group: Group = {
          id,
          name: input.name.trim(),
          kind: input.kind,
          inviteCode: createInviteCode(),
          memberIds: [prev.currentUserId],
          createdAt: new Date().toISOString(),
        };
        return { ...prev, groups: [group, ...prev.groups] };
      });
      return id;
    },
    [],
  );

  const joinGroupByCode = useCallback((code: string) => {
    let joinedId: string | null = null;
    setState((prev) => {
      if (!prev.currentUserId) return prev;
      const group = prev.groups.find(
        (g) => g.inviteCode.toUpperCase() === code.trim().toUpperCase(),
      );
      if (!group) return prev;
      joinedId = group.id;
      if (group.memberIds.includes(prev.currentUserId)) return prev;
      return {
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === group.id
            ? { ...g, memberIds: [...g.memberIds, prev.currentUserId!] }
            : g,
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
      address?: string;
      tags: string[];
      timing: IdeaTiming;
    }) => {
      const id = createId("idea");
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        const idea: Idea = {
          id,
          groupId: input.groupId,
          type: input.type,
          title: input.title.trim(),
          notes: input.notes.trim(),
          address: input.address?.trim() || undefined,
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
        next = addPoints(next, {
          groupId: input.groupId,
          userId: prev.currentUserId,
          delta: POINT_REASONS.propose.delta,
          reason: POINT_REASONS.propose.label,
        });
        return next;
      });
      return id;
    },
    [],
  );

  const setIdeaTiming = useCallback((ideaId: string, timing: IdeaTiming) => {
    setState((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) =>
        i.id === ideaId
          ? {
              ...i,
              timing,
              // al pasar a catálogo, deja de ser "elegida"
              status:
                timing === "catalog" && i.status === "chosen"
                  ? "pending"
                  : i.status,
            }
          : i,
      ),
    }));
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
      let next: AppState = {
        ...prev,
        ideas: prev.ideas.map((i) =>
          i.id === ideaId
            ? {
                ...i,
                votes: { ...i.votes, [prev.currentUserId!]: score },
              }
            : i,
        ),
      };
      if (!already) {
        next = addPoints(next, {
          groupId: idea.groupId,
          userId: prev.currentUserId,
          delta: POINT_REASONS.voted.delta,
          reason: POINT_REASONS.voted.label,
        });
      }
      return next;
    });
  }, []);

  const toggleSoftVeto = useCallback((ideaId: string) => {
    setState((prev) => {
      if (!prev.currentUserId) return prev;
      return {
        ...prev,
        ideas: prev.ideas.map((i) => {
          if (i.id !== ideaId) return i;
          const has = i.softVetoUserIds.includes(prev.currentUserId!);
          return {
            ...i,
            softVetoUserIds: has
              ? i.softVetoUserIds.filter((id) => id !== prev.currentUserId)
              : [...i.softVetoUserIds, prev.currentUserId!],
          };
        }),
      };
    });
  }, []);

  const revealVotes = useCallback((ideaId: string) => {
    setState((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) =>
        i.id === ideaId ? { ...i, revealed: true } : i,
      ),
    }));
  }, []);

  const chooseIdea = useCallback((ideaId: string) => {
    setState((prev) => {
      const idea = prev.ideas.find((i) => i.id === ideaId);
      if (!idea) return prev;
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
      next = addPoints(next, {
        groupId: idea.groupId,
        userId: idea.proposedBy,
        delta: POINT_REASONS.chosen.delta,
        reason: POINT_REASONS.chosen.label,
      });
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
      next = addPoints(next, {
        groupId,
        userId: winner.proposedBy,
        delta: POINT_REASONS.chosen.delta,
        reason: POINT_REASONS.chosen.label,
      });
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
        const review: Review = {
          id: createId("rev"),
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
        next = addPoints(next, {
          groupId: idea.groupId,
          userId: prev.currentUserId,
          delta: POINT_REASONS.memory.delta,
          reason: POINT_REASONS.memory.label,
        });
        if (rating >= 4) {
          next = addPoints(next, {
            groupId: idea.groupId,
            userId: idea.proposedBy,
            delta: POINT_REASONS.doneWell.delta,
            reason: POINT_REASONS.doneWell.label,
          });
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
          id: createId("rev"),
          ideaId: input.ideaId,
          userId: prev.currentUserId,
          rating: input.rating,
          comment: input.comment.trim(),
          publicVisible: input.publicVisible ?? true,
          createdAt: new Date().toISOString(),
        };
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
          id: createId("exp"),
          groupId: input.groupId,
          ideaId: input.ideaId,
          title: input.title.trim(),
          amountCents: input.amountCents,
          paidBy: input.paidBy,
          splitBetween: input.splitBetween,
          createdAt: new Date().toISOString(),
        };
        let next: AppState = {
          ...prev,
          expenses: [expense, ...prev.expenses],
        };
        next = addPoints(next, {
          groupId: input.groupId,
          userId: prev.currentUserId,
          delta: POINT_REASONS.expense.delta,
          reason: POINT_REASONS.expense.label,
        });
        return next;
      });
    },
    [],
  );

  const updateProfile = useCallback(
    (input: { name: string; city: string; neighborhood?: string }) => {
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        return {
          ...prev,
          users: prev.users.map((u) =>
            u.id === prev.currentUserId
              ? {
                  ...u,
                  name: input.name.trim(),
                  city: input.city.trim(),
                  neighborhood: input.neighborhood?.trim() || undefined,
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
