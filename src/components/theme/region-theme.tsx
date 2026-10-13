"use client";

import { useEffect } from "react";
import { useApp } from "@/components/providers/app-provider";
import { applyRegionTheme, resolveRegionTheme } from "@/lib/regions";

/** Aplica la apariencia según país / provincia / ciudad del usuario actual. */
export function RegionThemeSync() {
  const { ready, currentUser } = useApp();

  useEffect(() => {
    if (!ready) return;
    const theme = resolveRegionTheme({
      country: currentUser?.country,
      province: currentUser?.province,
      city: currentUser?.city,
    });
    applyRegionTheme(theme);
  }, [
    ready,
    currentUser?.country,
    currentUser?.province,
    currentUser?.city,
  ]);

  return null;
}
