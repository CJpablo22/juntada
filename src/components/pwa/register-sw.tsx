"use client";

import { useEffect } from "react";

/** Registers the service worker once on the client. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Avoid SW noise during local HMR unless we explicitly want install testing.
    const host = window.location.hostname;
    const allowLocal =
      host === "127.0.0.1" || host === "localhost" || host === "0.0.0.0";
    // Register everywhere (incl. local) so installability can be verified in cloud.
    if (!allowLocal && window.location.protocol !== "https:") return;

    let cancelled = false;
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (cancelled) return;
        // Quiet update check on load.
        void reg.update();
      })
      .catch(() => {
        /* ignore registration failures in unsupported contexts */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
