"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "yachtdrop_recent_searches";
const MAX_ITEMS = 8;

function getStored(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(items: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // quota exceeded — silently fail
  }
}

/**
 * Hook to manage recent searches in localStorage.
 * GDPR-safe: only stores simple query strings, no PII.
 */
export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  // Hydrate on mount
  useEffect(() => {
    setSearches(getStored());
  }, []);

  const add = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    setSearches((prev) => {
      const filtered = prev.filter(
        (s) => s.toLowerCase() !== trimmed.toLowerCase()
      );
      const next = [trimmed, ...filtered].slice(0, MAX_ITEMS);
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((query: string) => {
    setSearches((prev) => {
      const next = prev.filter(
        (s) => s.toLowerCase() !== query.toLowerCase()
      );
      persist(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return { searches, add, remove, clearAll };
}
