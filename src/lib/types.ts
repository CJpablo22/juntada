export type IdeaType = "movie" | "series" | "visit" | "food" | "plan";
export type IdeaStatus = "pending" | "chosen" | "done" | "archived";
/** catalog = guardado para no olvidar; soon = candidatos a decidir/hacer pronto */
export type IdeaTiming = "catalog" | "soon";
export type GroupKind = "couple" | "friends" | "siblings" | "study" | "other";
export type AuthProvider = "demo" | "email" | "phone" | "apple";

/** Qué ven los miembros de UN grupo concreto sobre tu ubicación */
export type GroupLocationVisibility =
  | "country"
  | "province"
  | "neighborhood"
  | "exact";

/** Cine o casa — solo aplica a películas */
export type MovieVenue = "cinema" | "home";

/** Lugar concreto: sitio libre o casa de un miembro del grupo */
export type IdeaPlace = {
  name: string;
  address: string;
  kind?: "custom" | "member_home";
  /** Si kind = member_home */
  memberId?: string;
};

export type User = {
  id: string;
  name: string;
  country: string;
  province: string;
  city: string;
  neighborhood?: string;
  /** Calle y número — para recomendaciones; se revela solo si el grupo tiene nivel "exact" */
  addressLine?: string;
  /** Piso, puerta, letra, depto — aparte de la calle */
  floorUnit?: string;
  postalCode?: string;
  /**
   * Privacidad por grupo: groupId → nivel visible.
   * Si falta la clave, por defecto "province".
   */
  groupLocationVisibility: Record<string, GroupLocationVisibility>;
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
  /** Solo películas: ver en cine o en casa */
  movieVenue?: MovieVenue;
  /** Lugares: visitar/comer/plan; cine; o casa de alguien */
  places: IdeaPlace[];
  /** Compat: primera dirección (derivada de places) */
  address?: string;
  proposedBy: string;
  status: IdeaStatus;
  timing: IdeaTiming;
  tags: string[];
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
  movie: "Película",
  series: "Serie",
  visit: "Visitar",
  food: "Comer",
  plan: "Plan",
};

export const MOVIE_VENUE_LABELS: Record<MovieVenue, string> = {
  cinema: "En el cine",
  home: "En casa",
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

export const GROUP_LOCATION_VISIBILITY_LABELS: Record<
  GroupLocationVisibility,
  string
> = {
  country: "Solo país",
  province: "Solo provincia",
  neighborhood: "Barrio",
  exact: "Dirección completa",
};

/** Un plan puede (y suele) llevar varios lugares */
export function ideaAllowsMultiplePlaces(type: IdeaType): boolean {
  return type === "plan";
}

export function placesFromLegacy(address?: string): IdeaPlace[] {
  const trimmed = address?.trim();
  if (!trimmed) return [];
  return [{ kind: "custom", name: trimmed, address: trimmed }];
}

export function primaryAddress(idea: Pick<Idea, "places" | "address">): string | undefined {
  return idea.places?.[0]?.address || idea.address || undefined;
}

export function formatPlace(place: IdeaPlace): string {
  if (place.name && place.address && place.name !== place.address) {
    return `${place.name} · ${place.address}`;
  }
  return place.name || place.address;
}
