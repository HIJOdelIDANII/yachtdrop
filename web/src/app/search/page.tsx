"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { FilterSheet } from "@/components/product/FilterSheet";
import { PageTransition } from "@/components/layout/PageTransition";
import { useSearch } from "@/lib/hooks/useData";
import { useMarinas } from "@/lib/hooks/useMarinas";
import { useFilteredProducts } from "@/lib/hooks/useFilteredProducts";
import type { Marina } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sliders } from "lucide-react";

export default function SearchPage() {
  const [committedQuery, setCommittedQuery] = useState("");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: products, isLoading: productsLoading } =
    useSearch(committedQuery);
  const filteredProducts = useFilteredProducts(products);
  
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
          />
        </header>

        {/* Results */}
        <section className="px-4 py-4">
          {committedQuery.length >= 2 ? (
            <SearchResults
              query={committedQuery}
              products={filteredProducts}
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

        <FilterSheet open={filterOpen} onOpenChange={setFilterOpen} />
      </div>
    </PageTransition>
  );
}
