import { useState, useEffect } from "react";

/**
 * Returns false on the server and during initial client render,
 * then true after hydration completes.
 * Use to gate UI that depends on persisted client-only state (e.g. Zustand persist).
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
