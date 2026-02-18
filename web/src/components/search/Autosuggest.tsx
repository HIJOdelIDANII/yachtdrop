"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Suggestion } from "@/types";
import { SuggestionItem } from "./SuggestionItem";
import { Skeleton } from "@/components/ui/skeleton";

interface AutosuggestProps {
  suggestions: Suggestion[];
  activeIndex: number;
  query: string;
  isLoading: boolean;
  onSelect: (suggestion: Suggestion) => void;
}

// Group suggestions by type for display
function groupSuggestions(suggestions: Suggestion[]) {
  const groups: { type: string; label: string; items: Suggestion[] }[] = [];

  const categories = suggestions.filter((s) => s.type === "category");
  const marinas = suggestions.filter((s) => s.type === "marina");
  const products = suggestions.filter((s) => s.type === "product");

  if (categories.length > 0) groups.push({ type: "category", label: "Categories", items: categories });
  if (marinas.length > 0) groups.push({ type: "marina", label: "Marinas", items: marinas });
  if (products.length > 0) groups.push({ type: "product", label: "Products", items: products });

  return groups;
}

export function Autosuggest({
  suggestions,
  activeIndex,
  query,
  isLoading,
  onSelect,
}: AutosuggestProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-2 shadow-lg" role="listbox">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  const groups = groupSuggestions(suggestions);
  let flatIndex = 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className="rounded-xl border border-border bg-card shadow-lg overflow-hidden"
      >
        <ul
          role="listbox"
          id="search-suggestions"
          aria-label="Search suggestions"
          className="py-1"
        >
          {groups.map((group) => (
            <li key={group.type} role="presentation">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <ul role="group" aria-label={group.label}>
                {group.items.map((suggestion) => {
                  const idx = flatIndex++;
                  return (
                    <SuggestionItem
                      key={suggestion.id}
                      suggestion={suggestion}
                      index={idx}
                      isActive={idx === activeIndex}
                      query={query}
                      onSelect={onSelect}
                    />
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </motion.div>
    </AnimatePresence>
  );
}
