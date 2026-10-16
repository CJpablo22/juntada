export type IdeaType =
  | "movie"
  | "series"
  | "visit"
  | "food"
  | "plan"
  | "birthday";

/** Cómo festejan el cumpleaños */
export type BirthdayKind = "meal" | "party" | "other";
export type IdeaStatus =
  | "pending"
  | "chosen"
  | "in_progress"
  | "done"
  | "archived";
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

/** En el grupo: ¿ven tu @usuario o tu nombre real? */
export type GroupNameVisibility = "username" | "real_name";

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
  /** @usuario único (estilo Instagram) */
  username?: string;
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
  /** Por grupo: username o nombre real. Default real_name. */
  groupNameVisibility: Record<string, GroupNameVisibility>;
  email?: string;
  phone?: string;
  instagram?: string;
  tiktok?: string;
  /** Completó onboarding (dirección + nombre) */
  profileComplete: boolean;
  authProvider: AuthProvider;
  avatarHue: number;
  createdAt: string;
};

export const GROUP_NAME_VISIBILITY_LABELS: Record<GroupNameVisibility, string> =
  {
    real_name: "Nombre real",
    username: "Nombre de usuario (@)",
  };

export type Group = {
  id: string;
  name: string;
  kind: GroupKind;
  inviteCode: string;
  memberIds: string[];
  /** Dueño: puede renombrar, expulsar y eliminar */
  createdBy?: string;
  createdAt: string;
  /** ISO week YYYY-Www when captain last broke a tie */
  lastCaptainTieBreakWeek?: string;
};

export type Idea = {
  id: string;
  groupId: string;
  type: IdeaType;
  title: string;
  notes: string;
  /** Solo películas: ver en cine o en casa */
  movieVenue?: MovieVenue;
  /** Cumpleaños: nombre de quien cumple */
  celebrantName?: string;
  /** Si el festejado es miembro del grupo */
  celebrantMemberId?: string;
  /** Cumpleaños: comida, fiesta u otro */
  birthdayKind?: BirthdayKind;
  /** Lugares: visitar/comer/plan; cine; o casa de alguien */
  places: IdeaPlace[];
  /** Compat: primera dirección (derivada de places) */
  address?: string;
  /** Día propuesto YYYY-MM-DD */
  scheduledDate?: string;
  /** Hora propuesta HH:mm (24h) */
  scheduledTime?: string;
  /** Duración aproximada en minutos */
  durationMinutes?: number;
  /** Fecha/hora todavía a confirmar */
  dateFlexible?: boolean;
  /** Trailer, reserva, mapa, entradas… */
  link?: string;
  /** Presupuesto orientativo: "gratis", "15€ c/u" */
  budgetNote?: string;
  proposedBy: string;
  status: IdeaStatus;
  timing: IdeaTiming;
  tags: string[];
  votes: Record<string, number>;
  revealed: boolean;
  softVetoUserIds: string[];
  /** userId -> yes | no (asistencia) */
  rsvps?: Record<string, RsvpStatus>;
  doneRating?: number;
  doneNote?: string;
  /** JPEG data URL (or Storage URL) of the memory photo */
  donePhotoUrl?: string;
  createdAt: string;
};

export type RsvpStatus = "yes" | "no";

/** Campos de cuándo / extras al crear o editar una idea */
export type IdeaScheduleInput = {
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  dateFlexible?: boolean;
  link?: string;
  budgetNote?: string;
};

export const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 h" },
  { value: 90, label: "1 h 30" },
  { value: 120, label: "2 h" },
  { value: 180, label: "3 h" },
  { value: 240, label: "4 h+" },
];

export type Review = {
  id: string;
  ideaId: string;
  userId: string;
  rating: number;
  comment: string;
  publicVisible: boolean;
  /** Optional memory photo (JPEG data URL or Storage URL) */
  photoUrl?: string;
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
  /**
   * Céntimos que le tocan a cada persona.
   * Si falta o está vacío → partes iguales entre splitBetween.
   */
  splitShares?: Record<string, number>;
  createdAt: string;
};

export type ExpenseSplitMode = "equal" | "half" | "custom";

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
  birthday: "Cumpleaños",
};

export const BIRTHDAY_KIND_LABELS: Record<BirthdayKind, string> = {
  meal: "Comida",
  party: "Fiesta",
  other: "Otro",
};

export const MOVIE_VENUE_LABELS: Record<MovieVenue, string> = {
  cinema: "En el cine",
  home: "En casa",
};

export const IDEA_TIMING_LABELS: Record<IdeaTiming, string> = {
  catalog: "Catálogo",
  soon: "Pronto",
};

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  pending: "Pendiente",
  chosen: "Elegida",
  in_progress: "En proceso",
  done: "Hecha",
  archived: "Archivada",
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

export function normalizeLink(raw?: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function formatDuration(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!m) return h === 1 ? "1 h" : `${h} h`;
  return `${h} h ${m} min`;
}

/** Texto corto para lista: "sáb 18 · 20:30" / "Fecha a confirmar" */
export function formatIdeaSchedule(
  idea: Pick<
    Idea,
    "scheduledDate" | "scheduledTime" | "dateFlexible" | "durationMinutes"
  >,
): string | null {
  const flexible = idea.dateFlexible;
  const date = idea.scheduledDate?.trim();
  const time = idea.scheduledTime?.trim();
  const duration = formatDuration(idea.durationMinutes);

  if (!date && !time && !flexible && !duration) return null;

  const parts: string[] = [];
  if (date) {
    parts.push(formatDateLabel(date));
  } else if (flexible) {
    parts.push("Fecha a confirmar");
  }
  if (time) parts.push(time);
  if (duration) parts.push(duration);
  if (flexible && date) parts.push("flexible");
  return parts.join(" · ");
}

function formatDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(dt);
}

export function cleanScheduleInput(input: IdeaScheduleInput): IdeaScheduleInput {
  const scheduledDate = input.scheduledDate?.trim() || undefined;
  const scheduledTime = input.scheduledTime?.trim() || undefined;
  const durationMinutes =
    input.durationMinutes && input.durationMinutes > 0
      ? input.durationMinutes
      : undefined;
  const link = normalizeLink(input.link);
  const budgetNote = input.budgetNote?.trim() || undefined;
  const dateFlexible = Boolean(input.dateFlexible);
  return {
    scheduledDate,
    scheduledTime,
    durationMinutes,
    dateFlexible: dateFlexible || undefined,
    link,
    budgetNote,
  };
}
