"use client";

import { useState, useCallback, useMemo, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/lib/hooks/useData";
import { haversineDistance } from "@/lib/hooks/useMarinas";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { useSearchInput } from "@/lib/hooks/useSearchInput";
import { useRecentSearches } from "@/lib/hooks/useRecentSearches";
import { useCombinedSearch } from "@/lib/hooks/useCombinedSearch";
import { Autosuggest } from "./Autosuggest";
import { RecentSearches } from "./RecentSearches";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Suggestion, Marina, Product } from "@/types";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onMarinaSelect?: (marina: Marina) => void;
  showSuggestions?: boolean;
  externalQuery?: string;
  onQueryChange?: (query: string) => void;
  searchResults?: Product[];
  marinas?: Marina[];
  isLoading?: boolean;
}

export function SearchBar({
  onSearch,
  onMarinaSelect,
  showSuggestions = true,
  externalQuery,
  onQueryChange,
  searchResults: externalSearchResults,
  marinas: externalMarinas,
  isLoading: externalIsLoading,
}: SearchBarProps) {
  const {
    query: internalQuery,
    debouncedQuery,
    setQuery: setInternalQuery,
    clear,
    inputRef,
    isReady,
  } = useSearchInput(150);

  const query = externalQuery ?? internalQuery;
  const setQuery = onQueryChange ?? setInternalQuery;

  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const activeQuery = externalQuery ?? debouncedQuery;
  const localSearch = useCombinedSearch(
    externalSearchResults ? "" : activeQuery
  );

  const searchResults = externalSearchResults ?? localSearch.products;
  const marinas = externalMarinas ?? localSearch.marinas;
  const searchLoading = externalIsLoading ?? localSearch.isLoading;

  const { data: categories } = useCategories();
  const { position } = useGeolocation();
  const {
    searches: recentSearches,
    add: addRecent,
    remove: removeRecent,
    clearAll: clearAllRecent,
  } = useRecentSearches();

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!isReady && !externalQuery) return [];
    const activeQuery = externalQuery ?? debouncedQuery;
    if (activeQuery.length < 1) return [];

    const items: Suggestion[] = [];

    if (categories) {
      categories
        .filter((c) =>
          c.name.toLowerCase().includes(activeQuery.toLowerCase())
        )
        .slice(0, 3)
        .forEach((c) =>
          items.push({
            id: `cat-${c.id}`,
            type: "category",
            label: c.name,
            subtitle: `${c.productCount} products`,
            data: c,
          })
        );
    }

    if (marinas) {
      marinas.slice(0, 4).forEach((m) => {
        const dist =
          position && m.lat && m.lng
            ? haversineDistance(
                position.lat,
                position.lng,
                Number(m.lat),
                Number(m.lng)
              )
            : undefined;
        items.push({
          id: `mar-${m.id}`,
          type: "marina",
          label: m.name,
          subtitle: [m.city, m.country].filter(Boolean).join(", "),
          distance: dist,
          data: m,
        });
      });
    }

    if (searchResults) {
      searchResults.slice(0, 6).forEach((p) =>
        items.push({
          id: `prod-${p.id}`,
          type: "product",
          label: p.name,
          subtitle: p.shortDesc || undefined,
          data: p,
        })
      );
    }

    return items;
  }, [
    isReady,
    externalQuery,
    debouncedQuery,
    categories,
    marinas,
    searchResults,
    position,
  ]);

  const handleSelect = useCallback(
    (suggestion: Suggestion) => {
      if (suggestion.type === "marina") {
        onMarinaSelect?.(suggestion.data as Marina);
      }
      setQuery(suggestion.label);
      addRecent(suggestion.label);
      onSearch?.(suggestion.label);
      setActiveIndex(-1);
      inputRef.current?.blur();
    },
    [onMarinaSelect, onSearch, setQuery, addRecent, inputRef]
  );

  const handleSubmit = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    addRecent(q);
    onSearch?.(q);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }, [query, addRecent, onSearch, inputRef]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const count = suggestions.length;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < count) {
            handleSelect(suggestions[activeIndex]);
          } else {
            handleSubmit();
          }
          break;
        case "Escape":
          e.preventDefault();
          if (query) {
            clear();
          } else {
            inputRef.current?.blur();
          }
          setActiveIndex(-1);
          break;
      }
    },
    [suggestions, activeIndex, handleSelect, handleSubmit, query, clear, inputRef]
  );

  const showDropdown =
    focused && showSuggestions && query.length >= 1 && suggestions.length > 0;
  const showRecent = focused && query.length === 0 && recentSearches.length > 0;

  const activeSuggestionId =
    activeIndex >= 0 && activeIndex < suggestions.length
      ? `suggestion-${suggestions[activeIndex].id}`
      : undefined;

  return (
    <div className="relative" role="search" aria-label="Search YachtDrop">
      {/* Input */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search parts, marinas..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 150);
          }}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 min-h-[44px] text-base"
          data-testid="search-input"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          aria-activedescendant={activeSuggestionId}
          aria-autocomplete="list"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />

        {/* Clear button */}
        <AnimatePresence>
          {query.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1 }}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground min-h-[32px] min-w-[32px] flex items-center justify-center"
              onClick={() => {
                clear();
                onQueryChange?.("");
              }}
              aria-label="Clear search"
              type="button"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Recent searches */}
      <AnimatePresence>
        {showRecent && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-x-0 top-full z-30 mt-1"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
              <RecentSearches
                searches={recentSearches}
                onSelect={(q) => {
                  setQuery(q);
                  addRecent(q);
                  onSearch?.(q);
                }}
                onRemove={removeRecent}
                onClearAll={clearAllRecent}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Autosuggest dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <div className="absolute inset-x-0 top-full z-30 mt-1" onMouseDown={(e) => e.preventDefault()}>
            <Autosuggest
              suggestions={suggestions}
              activeIndex={activeIndex}
              query={query}
              isLoading={searchLoading && suggestions.length === 0}
              onSelect={handleSelect}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
