export type IdeaType = "movie" | "visit" | "food" | "plan";
export type IdeaStatus = "pending" | "chosen" | "done" | "archived";
export type GroupKind = "couple" | "friends" | "siblings" | "study" | "other";

export type User = {
  id: string;
  name: string;
  city: string;
  neighborhood?: string;
  avatarHue: number;
  createdAt: string;
};

export type Group = {
  id: string;
  name: string;
  kind: GroupKind;
  inviteCode: string;
  memberIds: string[];
  createdAt: string;
};

export type Idea = {
  id: string;
  groupId: string;
  type: IdeaType;
  title: string;
  notes: string;
  address?: string;
  proposedBy: string;
  status: IdeaStatus;
  tags: string[];
  /** userId -> score 1-5, hidden until revealed */
  votes: Record<string, number>;
  revealed: boolean;
  softVetoUserIds: string[];
  doneRating?: number;
  doneNote?: string;
  createdAt: string;
};

export type Expense = {
  id: string;
  groupId: string;
  ideaId?: string;
  title: string;
  amountCents: number;
  paidBy: string;
  splitBetween: string[];
  createdAt: string;
};

export type PointEvent = {
  id: string;
  groupId: string;
  userId: string;
  delta: number;
  reason: string;
  at: string;
};

export type AppState = {
  version: 1;
  currentUserId: string | null;
  users: User[];
  groups: Group[];
  ideas: Idea[];
  expenses: Expense[];
  points: PointEvent[];
};

export const IDEA_TYPE_LABELS: Record<IdeaType, string> = {
  movie: "Peli / serie",
  visit: "Visitar",
  food: "Comer",
  plan: "Plan",
};

export const GROUP_KIND_LABELS: Record<GroupKind, string> = {
  couple: "Pareja",
  friends: "Amigos",
  siblings: "Hermanos",
  study: "Estudio",
  other: "Otro",
};
