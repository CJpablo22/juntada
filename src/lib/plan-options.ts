import type { Idea, IdeaPlace, PlanOption } from "@/lib/types";
import { formatIdeaSchedule } from "@/lib/types";

export function normalizePlanOptions(raw: unknown): PlanOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : "";
      const proposedBy =
        typeof o.proposedBy === "string"
          ? o.proposedBy
          : typeof o.proposed_by === "string"
            ? o.proposed_by
            : "";
      if (!id || !proposedBy) return null;
      const votesRaw = o.preferVotes ?? o.prefer_votes;
      const preferVotes = Array.isArray(votesRaw)
        ? votesRaw.filter((v): v is string => typeof v === "string")
        : [];
      return {
        id,
        proposedBy,
        title: typeof o.title === "string" ? o.title : undefined,
        placeName:
          typeof o.placeName === "string"
            ? o.placeName
            : typeof o.place_name === "string"
              ? o.place_name
              : undefined,
        placeAddress:
          typeof o.placeAddress === "string"
            ? o.placeAddress
            : typeof o.place_address === "string"
              ? o.place_address
              : undefined,
        memberHomeId:
          typeof o.memberHomeId === "string"
            ? o.memberHomeId
            : typeof o.member_home_id === "string"
              ? o.member_home_id
              : undefined,
        scheduledDate:
          typeof o.scheduledDate === "string"
            ? o.scheduledDate
            : typeof o.scheduled_date === "string"
              ? o.scheduled_date
              : undefined,
        scheduledTime:
          typeof o.scheduledTime === "string"
            ? o.scheduledTime
            : typeof o.scheduled_time === "string"
              ? o.scheduled_time
              : undefined,
        createdAt:
          typeof o.createdAt === "string"
            ? o.createdAt
            : typeof o.created_at === "string"
              ? o.created_at
              : new Date().toISOString(),
        preferVotes,
      } satisfies PlanOption;
    })
    .filter(Boolean) as PlanOption[];
}

/** Si la idea tiene título / lugar / fecha, arma la 1ª opción del creador. */
export function seedPlanOptionFromIdea(
  idea: Pick<
    Idea,
    | "title"
    | "proposedBy"
    | "places"
    | "address"
    | "scheduledDate"
    | "scheduledTime"
    | "createdAt"
  >,
  id: string,
): PlanOption | null {
  const title = idea.title?.trim() || undefined;
  const place = idea.places?.[0];
  const placeName = place?.name?.trim() || undefined;
  const placeAddress =
    place?.address?.trim() || idea.address?.trim() || undefined;
  const hasPlace = Boolean(placeName || placeAddress);
  const hasWhen = Boolean(idea.scheduledDate || idea.scheduledTime);
  if (!title && !hasPlace && !hasWhen) return null;
  return {
    id,
    proposedBy: idea.proposedBy,
    title,
    placeName,
    placeAddress,
    memberHomeId:
      place?.kind === "member_home" ? place.memberId : undefined,
    scheduledDate: idea.scheduledDate,
    scheduledTime: idea.scheduledTime,
    createdAt: idea.createdAt,
    preferVotes: [],
  };
}

export function formatOptionPlace(option: PlanOption): string | null {
  if (option.placeName && option.placeAddress) {
    if (option.placeName === option.placeAddress) return option.placeName;
    return `${option.placeName} · ${option.placeAddress}`;
  }
  return option.placeName || option.placeAddress || null;
}

export function formatOptionWhen(option: PlanOption): string | null {
  return formatIdeaSchedule({
    scheduledDate: option.scheduledDate,
    scheduledTime: option.scheduledTime,
    dateFlexible: false,
    durationMinutes: undefined,
  });
}

export function optionToPlaces(option: PlanOption): IdeaPlace[] {
  if (option.memberHomeId && (option.placeName || option.placeAddress)) {
    return [
      {
        kind: "member_home",
        memberId: option.memberHomeId,
        name: option.placeName || "Casa",
        address: option.placeAddress || "",
      },
    ];
  }
  if (option.placeName || option.placeAddress) {
    return [
      {
        kind: "custom",
        name: option.placeName || option.placeAddress || "",
        address: option.placeAddress || option.placeName || "",
      },
    ];
  }
  return [];
}

/** Opción con más votos; empate → la del creador de la idea, si no la más vieja. */
export function winningPlanOption(
  options: PlanOption[],
  ideaProposerId: string,
): PlanOption | null {
  if (!options.length) return null;
  const ranked = [...options].sort((a, b) => {
    const dv = b.preferVotes.length - a.preferVotes.length;
    if (dv !== 0) return dv;
    if (a.proposedBy === ideaProposerId) return -1;
    if (b.proposedBy === ideaProposerId) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
  return ranked[0] ?? null;
}

export function myPreferredOptionId(
  options: PlanOption[],
  userId: string,
): string | null {
  const hit = options.find((o) => o.preferVotes.includes(userId));
  return hit?.id ?? null;
}
