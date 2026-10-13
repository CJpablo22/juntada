import type { IdeaPlace, IdeaType, MovieVenue, User } from "@/lib/types";

/** Dirección usable al elegir “casa de alguien” (para el grupo). */
export function memberHomeAddress(user: User): string {
  const parts = [
    user.addressLine,
    user.postalCode,
    user.neighborhood,
    user.city,
    user.province,
  ].filter(Boolean);
  return parts.join(", ") || user.city || user.province || "Sin dirección cargada";
}

export function memberHomePlace(user: User): IdeaPlace {
  return {
    kind: "member_home",
    memberId: user.id,
    name: `Casa de ${user.name}`,
    address: memberHomeAddress(user),
  };
}

export function ideaNeedsPlaces(
  type: IdeaType,
  movieVenue?: MovieVenue | null,
): boolean {
  if (type === "visit" || type === "food" || type === "plan") return true;
  if (type === "movie") return movieVenue === "cinema" || movieVenue === "home";
  return false;
}

export function emptyPlace(): IdeaPlace {
  return { kind: "custom", name: "", address: "" };
}

export function validatePlaces(
  type: IdeaType,
  places: IdeaPlace[],
  movieVenue?: MovieVenue | null,
): string | null {
  if (!ideaNeedsPlaces(type, movieVenue)) return null;

  if (type === "movie" && movieVenue === "home") {
    const home = places.find((p) => p.kind === "member_home" && p.memberId);
    if (!home) return "Elegí de quién es la casa.";
    return null;
  }

  if (type === "movie" && movieVenue === "cinema") {
    const cinema = places.find(
      (p) => p.kind !== "member_home" && p.name.trim() && p.address.trim(),
    );
    if (!cinema) return "Poné el nombre y la dirección del cine.";
    return null;
  }

  const clean = places.filter((p) => {
    if (p.kind === "member_home") return Boolean(p.memberId);
    return p.name.trim() && p.address.trim();
  });
  if (clean.length === 0) {
    return "Poné al menos un lugar (sitio o casa de alguien del grupo).";
  }
  for (const p of clean) {
    if (p.kind === "member_home") {
      if (!p.memberId) return "Elegí de quién es la casa.";
      continue;
    }
    if (!p.name.trim() || !p.address.trim()) {
      return "Cada lugar necesita nombre y dirección.";
    }
  }
  return null;
}

export function cleanPlaces(
  places: IdeaPlace[],
  members: User[],
): IdeaPlace[] {
  return places
    .map((p) => {
      if (p.kind === "member_home" && p.memberId) {
        const user = members.find((m) => m.id === p.memberId);
        if (!user) return null;
        return memberHomePlace(user);
      }
      const name = p.name.trim();
      const address = p.address.trim();
      if (!name || !address) return null;
      return {
        kind: "custom" as const,
        name,
        address,
      };
    })
    .filter(Boolean) as IdeaPlace[];
}
