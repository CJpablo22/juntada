"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import type { User } from "@/lib/types";

/** Quién del grupo tiene avisos push activos (para no pelearse a ciegas). */
export function GroupPushStatus({
  groupId,
  members,
}: {
  groupId: string;
  members: User[];
}) {
  const { loadGroupPushUserIds, currentUser } = useApp();
  const [ids, setIds] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadGroupPushUserIds(groupId).then((list) => {
      if (!cancelled) setIds(list);
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, loadGroupPushUserIds]);

  if (ids === null) return null;
  if (!members.length) return null;

  const active = members.filter((m) => ids.includes(m.id));
  const missing = members.filter((m) => !ids.includes(m.id));
  const meMissing =
    currentUser && missing.some((m) => m.id === currentUser.id);

  return (
    <div className="flex items-start gap-2 border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-xs text-[var(--mute)]">
      <Bell className="mt-0.5 size-3.5 shrink-0 text-[var(--pop)]" />
      <div className="min-w-0 space-y-0.5">
        <p>
          Avisos activos:{" "}
          <strong className="text-[var(--ink)]">
            {active.length}/{members.length}
          </strong>
          {active.length
            ? ` · ${active.map((m) => (m.id === currentUser?.id ? "vos" : m.name)).join(", ")}`
            : ""}
        </p>
        {missing.length ? (
          <p>
            Sin push:{" "}
            {missing
              .map((m) => (m.id === currentUser?.id ? "vos" : m.name))
              .join(", ")}
            {meMissing ? (
              <>
                {" "}
                · activá en{" "}
                <a href="/app/profile" className="underline text-[var(--pop)]">
                  Perfil
                </a>
              </>
            ) : null}
          </p>
        ) : (
          <p className="text-[var(--ink)]">Todos tienen avisos en el móvil.</p>
        )}
      </div>
    </div>
  );
}
