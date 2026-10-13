export type IdeaType = "movie" | "visit" | "food" | "plan";
export type IdeaStatus = "pending" | "chosen" | "done" | "archived";
/** catalog = guardado para no olvidar; soon = candidatos a decidir/hacer pronto */
export type IdeaTiming = "catalog" | "soon";
export type GroupKind = "couple" | "friends" | "siblings" | "study" | "other";
export type AuthProvider = "demo" | "email" | "phone" | "apple";

export type User = {
  id: string;
  name: string;
  /** ISO-ish country code: ES, AR, … */
  country: string;
  province: string;
  city: string;
  neighborhood?: string;
  email?: string;
  phone?: string;
  authProvider: AuthProvider;
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
  timing: IdeaTiming;
  tags: string[];
  /** userId -> score 1-5, hidden until revealed (solo aplica a "soon") */
  votes: Record<string, number>;
  revealed: boolean;
  softVetoUserIds: string[];
  doneRating?: number;
  doneNote?: string;
  createdAt: string;
};

export type Review = {
  id: string;
  ideaId: string;
  userId: string;
  rating: number;
  comment: string;
  /** Visible en el catálogo público para gente de fuera del grupo */
  publicVisible: boolean;
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
  version: 2;
  currentUserId: string | null;
  users: User[];
  groups: Group[];
  ideas: Idea[];
  reviews: Review[];
  expenses: Expense[];
  points: PointEvent[];
};

export const IDEA_TYPE_LABELS: Record<IdeaType, string> = {
  movie: "Peli / serie",
  visit: "Visitar",
  food: "Comer",
  plan: "Plan",
};

export const IDEA_TIMING_LABELS: Record<IdeaTiming, string> = {
  catalog: "Catálogo",
  soon: "Pronto",
};

export const GROUP_KIND_LABELS: Record<GroupKind, string> = {
  couple: "Pareja",
  friends: "Amigos",
  siblings: "Hermanos",
  study: "Estudio",
  other: "Otro",
};
