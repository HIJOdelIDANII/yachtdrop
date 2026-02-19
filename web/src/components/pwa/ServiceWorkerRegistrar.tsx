"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount.
 * Placed in the component tree (via Providers) so it only runs client-side.
 * Silent — no UI, just registers/updates the SW in the background.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("SW registration failed:", err));
    }
  }, []);

  return null;
}
