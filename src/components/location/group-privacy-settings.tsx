"use client";

import { Label } from "@/components/ui/label";
import {
  GROUP_KIND_LABELS,
  GROUP_LOCATION_VISIBILITY_LABELS,
  type Group,
  type GroupLocationVisibility,
  type User,
} from "@/lib/types";
import { getGroupLocationVisibility } from "@/lib/privacy";

const LEVELS: GroupLocationVisibility[] = [
  "country",
  "province",
  "neighborhood",
  "exact",
];

export function GroupPrivacySettings({
  user,
  groups,
  onChange,
}: {
  user: User;
  groups: Group[];
  onChange: (groupId: string, level: GroupLocationVisibility) => void;
}) {
  const mine = groups.filter((g) => g.memberIds.includes(user.id));

  if (mine.length === 0) {
    return (
      <p className="text-sm text-[var(--mute)]">
        Cuando estés en un grupo, acá elegís qué ven de tu ubicación en cada
        uno.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {mine.map((group) => {
        const level = getGroupLocationVisibility(user, group.id);
        return (
          <li
            key={group.id}
            className="flex flex-col gap-2 border-b border-[var(--line)] pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">
                {group.name}
              </p>
              <p className="text-xs text-[var(--mute)]">
                {GROUP_KIND_LABELS[group.kind]} · {group.memberIds.length}{" "}
                personas
              </p>
            </div>
            <div className="sm:w-56">
              <Label htmlFor={`vis-${group.id}`} className="sr-only">
                Visibilidad en {group.name}
              </Label>
              <select
                id={`vis-${group.id}`}
                value={level}
                onChange={(e) =>
                  onChange(
                    group.id,
                    e.target.value as GroupLocationVisibility,
                  )
                }
                className="field-select"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {GROUP_LOCATION_VISIBILITY_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
