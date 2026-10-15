import { cn } from "@/lib/utils";
import {
  displayNameInGroup,
  displayNameOrUsername,
} from "@/lib/display-name";
import type { User } from "@/lib/types";

export function UserAvatar({
  user,
  size = "md",
  className,
  label,
}: {
  user: Pick<User, "name" | "username" | "avatarHue">;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Inicial / etiqueta visible (ej. @usuario en un grupo) */
  label?: string;
}) {
  const dim =
    size === "sm"
      ? "size-7 text-xs"
      : size === "lg"
        ? "size-12 text-lg"
        : "size-9 text-sm";
  const text = (label || displayNameOrUsername(user)).replace(/^@/, "");
  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-full font-semibold text-white",
        dim,
        className,
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${user.avatarHue} 62% 42%), hsl(${(user.avatarHue + 40) % 360} 55% 32%))`,
      }}
      aria-hidden
    >
      {text.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function UserChip({
  user,
  subtitle,
  groupId,
}: {
  user: User;
  subtitle?: string;
  groupId?: string;
}) {
  const label = groupId
    ? displayNameInGroup(user, groupId)
    : displayNameOrUsername(user);
  return (
    <span className="inline-flex items-center gap-2">
      <UserAvatar user={user} size="sm" label={label} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-[var(--brand-ink)]">
          {label}
        </span>
        {subtitle && (
          <span className="block truncate text-xs text-[var(--brand-mute)]">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
