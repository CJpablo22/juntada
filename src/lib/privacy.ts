import type { User } from "@/lib/types";

export type AddressShareLevel = "hidden" | "neighborhood" | "exact";

export function formatPublicPlace(user: Pick<User, "city" | "province" | "country">): string {
  return [user.city, user.province].filter(Boolean).join(", ");
}

/**
 * Qué puede ver otro miembro del grupo sobre la ubicación de `owner`.
 * - Fuera de grupo / sin casilla: solo ciudad (nunca dirección).
 * - En grupo + compartir: barrio o dirección exacta según elija el dueño.
 */
export function getVisibleLocationForViewer(
  owner: User,
  opts: { inSharedGroup: boolean },
): { label: string; detail: string | null; level: AddressShareLevel } {
  if (!opts.inSharedGroup || !owner.shareAddressInGroups) {
    return {
      label: formatPublicPlace(owner),
      detail: null,
      level: "hidden",
    };
  }

  if (owner.addressDetailLevel === "exact" && owner.addressLine) {
    const exact = [
      owner.addressLine,
      owner.postalCode,
      owner.neighborhood,
      owner.city,
    ]
      .filter(Boolean)
      .join(", ");
    return { label: exact, detail: "Dirección exacta", level: "exact" };
  }

  const barrio = owner.neighborhood
    ? `${owner.neighborhood}, ${owner.city}`
    : formatPublicPlace(owner);
  return {
    label: barrio,
    detail: "Solo barrio",
    level: "neighborhood",
  };
}
