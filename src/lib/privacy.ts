import type { GroupLocationVisibility, User } from "@/lib/types";
import { GROUP_LOCATION_VISIBILITY_LABELS } from "@/lib/types";

const COUNTRY_NAMES: Record<string, string> = {
  ES: "España",
  AR: "Argentina",
};

export function getGroupLocationVisibility(
  owner: User,
  groupId: string,
): GroupLocationVisibility {
  return owner.groupLocationVisibility?.[groupId] ?? "province";
}

/**
 * Qué puede ver un compañero de `groupId` sobre la ubicación de `owner`.
 * Fuera de un grupo compartido: solo país.
 */
export function getVisibleLocationForViewer(
  owner: User,
  opts: { groupId?: string; inSharedGroup: boolean },
): { label: string; detail: string; level: GroupLocationVisibility | "public" } {
  if (!opts.inSharedGroup || !opts.groupId) {
    return {
      label: COUNTRY_NAMES[owner.country] ?? owner.country,
      detail: "Público",
      level: "public",
    };
  }

  const level = getGroupLocationVisibility(owner, opts.groupId);

  switch (level) {
    case "country":
      return {
        label: COUNTRY_NAMES[owner.country] ?? owner.country,
        detail: GROUP_LOCATION_VISIBILITY_LABELS.country,
        level,
      };
    case "province":
      return {
        label: `${owner.province}, ${COUNTRY_NAMES[owner.country] ?? owner.country}`,
        detail: GROUP_LOCATION_VISIBILITY_LABELS.province,
        level,
      };
    case "neighborhood":
      return {
        label: owner.neighborhood
          ? `${owner.neighborhood}, ${owner.city}`
          : `${owner.city}, ${owner.province}`,
        detail: GROUP_LOCATION_VISIBILITY_LABELS.neighborhood,
        level,
      };
    case "exact": {
      const exact = [
        owner.addressLine,
        owner.floorUnit,
        owner.postalCode,
        owner.neighborhood,
        owner.city,
      ]
        .filter(Boolean)
        .join(", ");
      return {
        label: exact || `${owner.city}, ${owner.province}`,
        detail: GROUP_LOCATION_VISIBILITY_LABELS.exact,
        level,
      };
    }
  }
}
