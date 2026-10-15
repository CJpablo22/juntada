"use client";

import { Label } from "@/components/ui/label";
import {
  displayNameInGroup,
  getGroupNameVisibility,
} from "@/lib/display-name";
import { getGroupLocationVisibility, getVisibleLocationForViewer } from "@/lib/privacy";
import {
  GROUP_KIND_LABELS,
  GROUP_LOCATION_VISIBILITY_LABELS,
  GROUP_NAME_VISIBILITY_LABELS,
  type Group,
  type GroupLocationVisibility,
  type GroupNameVisibility,
  type User,
} from "@/lib/types";

const LEVELS: GroupLocationVisibility[] = [
  "country",
  "province",
  "neighborhood",
  "exact",
];

const NAME_LEVELS: GroupNameVisibility[] = ["real_name", "username"];

const HINTS: Record<GroupLocationVisibility, string> = {
  country: "Solo ven el país",
  province: "Ven provincia y país",
  neighborhood: "Ven barrio y ciudad",
  exact: "Ven calle y número",
};

export function GroupPrivacySettings({
  user,
  groups,
  onChangeLocation,
  onChangeName,
}: {
  user: User;
  groups: Group[];
  onChangeLocation: (groupId: string, level: GroupLocationVisibility) => void;
  onChangeName: (groupId: string, level: GroupNameVisibility) => void;
}) {
  const mine = groups.filter((g) => g.memberIds.includes(user.id));

  if (mine.length === 0) {
    return (
      <p className="text-sm text-[var(--mute)]">
        Cuando estés en un grupo, acá elegís qué ven de tu nombre y ubicación
        en cada uno.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {mine.map((group) => {
        const level = getGroupLocationVisibility(user, group.id);
        const nameLevel = getGroupNameVisibility(user, group.id);
        const preview = getVisibleLocationForViewer(user, {
          inSharedGroup: true,
          groupId: group.id,
        });
        const namePreview = displayNameInGroup(user, group.id);
        return (
          <li
            key={group.id}
            className="border-b border-[var(--line)] pb-4 last:border-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--ink)]">
                {group.name}
              </p>
              <p className="text-xs text-[var(--mute)]">
                {GROUP_KIND_LABELS[group.kind]} · {group.memberIds.length}{" "}
                personas
              </p>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label
                  htmlFor={`name-${group.id}`}
                  className="text-xs text-[var(--mute)]"
                >
                  Cómo te ven
                </Label>
                <select
                  id={`name-${group.id}`}
                  value={nameLevel}
                  onChange={(e) =>
                    onChangeName(
                      group.id,
                      e.target.value as GroupNameVisibility,
                    )
                  }
                  className="field-select mt-1"
                >
                  {NAME_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {GROUP_NAME_VISIBILITY_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label
                  htmlFor={`vis-${group.id}`}
                  className="text-xs text-[var(--mute)]"
                >
                  Ubicación
                </Label>
                <select
                  id={`vis-${group.id}`}
                  value={level}
                  onChange={(e) =>
                    onChangeLocation(
                      group.id,
                      e.target.value as GroupLocationVisibility,
                    )
                  }
                  className="field-select mt-1"
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {GROUP_LOCATION_VISIBILITY_LABELS[l]}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[var(--mute)]">{HINTS[level]}</p>
              </div>
            </div>

            <p className="mt-2 rounded bg-[var(--wash)] px-3 py-2 text-sm">
              <span className="text-[var(--mute)]">Ellos ven: </span>
              <span className="font-medium text-[var(--ink)]">
                {namePreview}
              </span>
              <span className="text-[var(--mute)]"> · </span>
              <span className="font-medium text-[var(--ink)]">
                {preview.label}
              </span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
