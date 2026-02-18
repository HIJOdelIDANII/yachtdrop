import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns false on the server and during initial client render,
 * then true after hydration completes.
 * Use to gate UI that depends on persisted client-only state (e.g. Zustand persist).
 */
export function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
