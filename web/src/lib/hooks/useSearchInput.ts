"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Debounced search input hook.
 * Returns current query, debounced value, setter, clear, and input ref.
 */
export function useSearchInput(delay = 150) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), delay);
    return () => clearTimeout(timer);
  }, [query, delay]);

  const clear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    inputRef.current?.focus();
  }, []);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return {
    query,
    debouncedQuery,
    setQuery,
    clear,
    focus,
    inputRef,
    isActive: query.length > 0,
    isReady: debouncedQuery.length >= 2,
  };
}
