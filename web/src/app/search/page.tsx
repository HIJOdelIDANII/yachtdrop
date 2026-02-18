"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { PageTransition } from "@/components/layout/PageTransition";
import { useSearch } from "@/lib/hooks/useData";
import { useMarinas } from "@/lib/hooks/useMarinas";
import type { Marina } from "@/types";
import { toast } from "sonner";

export default function SearchPage() {
  const [committedQuery, setCommittedQuery] = useState("");
  const [query, setQuery] = useState("");

  const { data: products, isLoading: productsLoading } =
    useSearch(committedQuery);
  const { data: marinas, isLoading: marinasLoading } = useMarinas({
    query: committedQuery.length >= 2 ? committedQuery : undefined,
  });

  const handleSearch = useCallback((q: string) => {
    setCommittedQuery(q);
  }, []);

  const handleMarinaSelect = useCallback((marina: Marina) => {
    toast.info(`Marina: ${marina.name}`, {
      description: [marina.city, marina.country].filter(Boolean).join(", "),
    });
  }, []);

  const isLoading = productsLoading || marinasLoading;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Sticky header with SearchBar */}
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 px-4 py-3 backdrop-blur safe-top">
          <h1 className="mb-2 text-lg font-bold text-foreground">Search</h1>
          <SearchBar
            onSearch={handleSearch}
            onMarinaSelect={handleMarinaSelect}
            externalQuery={query}
            onQueryChange={setQuery}
          />
        </header>

        {/* Results */}
        <section className="px-4 py-4">
          {committedQuery.length >= 2 ? (
            <SearchResults
              query={committedQuery}
              products={products ?? []}
              marinas={marinas ?? []}
              isLoading={isLoading}
              onMarinaSelect={handleMarinaSelect}
            />
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-sm">
                Search for marine parts, marinas, or categories
              </p>
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
