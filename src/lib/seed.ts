import type { AppState } from "@/lib/types";

/** Demo seed so the app feels alive on first open. */
export function createSeedState(): AppState {
  const now = new Date().toISOString();

  const lucia = {
    id: "user_lucia",
    name: "Lucía",
    city: "Madrid",
    neighborhood: "Malasaña",
    avatarHue: 12,
    createdAt: now,
  };
  const mateo = {
    id: "user_mateo",
    name: "Mateo",
    city: "Madrid",
    neighborhood: "Lavapiés",
    avatarHue: 168,
    createdAt: now,
  };
  const sofia = {
    id: "user_sofia",
    name: "Sofía",
    city: "Madrid",
    neighborhood: "Chamberí",
    avatarHue: 210,
    createdAt: now,
  };

  const couple = {
    id: "group_nos",
    name: "Nosotros dos",
    kind: "couple" as const,
    inviteCode: "DALE26",
    memberIds: [lucia.id, mateo.id],
    createdAt: now,
  };
  const friends = {
    id: "group_finde",
    name: "El finde",
    kind: "friends" as const,
    inviteCode: "FINDE1",
    memberIds: [lucia.id, mateo.id, sofia.id],
    createdAt: now,
  };

  return {
    version: 1,
    currentUserId: null,
    users: [lucia, mateo, sofia],
    groups: [couple, friends],
    ideas: [
      {
        id: "idea_peli",
        groupId: couple.id,
        type: "movie",
        title: "Past Lives",
        notes: "Para un domingo perezoso en casa.",
        proposedBy: lucia.id,
        status: "pending",
        tags: ["noche", "casa"],
        votes: {},
        revealed: false,
        softVetoUserIds: [],
        createdAt: now,
      },
      {
        id: "idea_ramen",
        groupId: couple.id,
        type: "food",
        title: "Ramen Shifu",
        notes: "El de siempre, pero nunca falla.",
        address: "Calle de la Palma 16, Madrid",
        proposedBy: mateo.id,
        status: "pending",
        tags: ["cerca"],
        votes: { [lucia.id]: 5 },
        revealed: false,
        softVetoUserIds: [],
        createdAt: now,
      },
      {
        id: "idea_retiro",
        groupId: friends.id,
        type: "visit",
        title: "Picnic en El Retiro",
        notes: "Manta, snacks y cero prisa.",
        address: "Parque del Retiro, Madrid",
        proposedBy: sofia.id,
        status: "pending",
        tags: ["barato", "tarde"],
        votes: {},
        revealed: false,
        softVetoUserIds: [],
        createdAt: now,
      },
      {
        id: "idea_escape",
        groupId: friends.id,
        type: "plan",
        title: "Escape room en Tribunal",
        notes: "El de detectives. 60 minutos.",
        address: "Tribunal, Madrid",
        proposedBy: mateo.id,
        status: "pending",
        tags: ["noche"],
        votes: { [sofia.id]: 4, [lucia.id]: 3 },
        revealed: false,
        softVetoUserIds: [],
        createdAt: now,
      },
    ],
    expenses: [
      {
        id: "exp_cafe",
        groupId: friends.id,
        title: "Cafés del sábado",
        amountCents: 1850,
        paidBy: lucia.id,
        splitBetween: [lucia.id, mateo.id, sofia.id],
        createdAt: now,
      },
    ],
    points: [
      {
        id: "pt_1",
        groupId: couple.id,
        userId: lucia.id,
        delta: 1,
        reason: "Propusiste una idea",
        at: now,
      },
      {
        id: "pt_2",
        groupId: couple.id,
        userId: mateo.id,
        delta: 1,
        reason: "Propusiste una idea",
        at: now,
      },
      {
        id: "pt_3",
        groupId: friends.id,
        userId: sofia.id,
        delta: 1,
        reason: "Propusiste una idea",
        at: now,
      },
      {
        id: "pt_4",
        groupId: friends.id,
        userId: mateo.id,
        delta: 1,
        reason: "Propusiste una idea",
        at: now,
      },
      {
        id: "pt_5",
        groupId: friends.id,
        userId: lucia.id,
        delta: 2,
        reason: "Cerraste un gasto",
        at: now,
      },
    ],
  };
}
