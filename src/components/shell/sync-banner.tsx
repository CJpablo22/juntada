"use client";

import { RefreshCw, X } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";

export function SyncBanner() {
  const { cloudError, clearCloudError, refreshFromCloud } = useApp();
  if (!cloudError) return null;

  return (
    <div
      role="alert"
      className="border-b border-[var(--pop)] bg-[var(--pop)]/10 px-4 py-3 text-sm text-[var(--ink)]"
    >
      <div className="mx-auto flex max-w-5xl items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold">No se guardó en la nube</p>
          <p className="text-[var(--mute)]">{cloudError}</p>
          <p className="text-xs text-[var(--mute)]">
            Sin esto, solo lo ves en este celular. En Supabase → SQL Editor
            corré{" "}
            <code className="text-[var(--ink)]">
              020_fix_group_members_rls_recursion.sql
            </code>{" "}
            y{" "}
            <code className="text-[var(--ink)]">021_plan_options.sql</code>{" "}
            (opciones de lugar/fecha). Si faltan, también 017–019.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() => void refreshFromCloud()}
          >
            <RefreshCw className="size-3.5" />
            Sync
          </Button>
          <button
            type="button"
            aria-label="Cerrar"
            className="rounded p-1.5 text-[var(--mute)] hover:text-[var(--ink)]"
            onClick={clearCloudError}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
