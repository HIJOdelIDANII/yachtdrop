"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { FilterSheet } from "@/components/product/FilterSheet";
import { PageTransition } from "@/components/layout/PageTransition";
import { useCombinedSearch } from "@/lib/hooks/useCombinedSearch";
import { useFilteredProducts } from "@/lib/hooks/useFilteredProducts";
import type { Marina } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sliders, Search } from "lucide-react";

export default function SearchPage() {
  const [committedQuery, setCommittedQuery] = useState("");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // Single combined fetch — no more duplicate requests
  const {
    products,
    marinas,
    isProductsLoading,
  } = useCombinedSearch(committedQuery);

  const filteredProducts = useFilteredProducts(products);

  const handleSearch = useCallback((q: string) => {
    setCommittedQuery(q);
  }, []);

  const handleMarinaSelect = useCallback((marina: Marina) => {
    toast.info(`Marina: ${marina.name}`, {
      description: [marina.city, marina.country].filter(Boolean).join(", "),
    });
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Sticky header with SearchBar */}
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 px-4 py-3 backdrop-blur safe-top">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-lg font-bold text-foreground flex-1">Search</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFilterOpen(true)}
              className="h-9 w-9"
            >
              <Sliders className="h-4 w-4" />
            </Button>
          </div>
          <SearchBar
            onSearch={handleSearch}
            onMarinaSelect={handleMarinaSelect}
            externalQuery={query}
            onQueryChange={setQuery}
            searchResults={products}
            marinas={marinas}
            isLoading={isProductsLoading}
          />
        </header>

        {/* Results */}
        <section className="px-4 py-4">
          {committedQuery.length >= 1 ? (
            <SearchResults
              query={committedQuery}
              products={filteredProducts}
              marinas={marinas}
              isLoading={isProductsLoading}
              onMarinaSelect={handleMarinaSelect}
            />
          ) : (
            <div className="py-12 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">
                Find what you need
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Search for marine parts, marinas, or categories
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Anchor", "Rope", "LED lights", "Fenders", "Bilge pump"].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      setCommittedQuery(term);
                    }}
                    className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground active:scale-95 transition-transform"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <FilterSheet open={filterOpen} onOpenChange={setFilterOpen} />
      </div>
    </PageTransition>
  );
}
