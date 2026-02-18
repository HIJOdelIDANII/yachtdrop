"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/lib/hooks/useData";
import { ProductCard } from "@/components/product/ProductCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { Search } from "lucide-react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = useSearch(query);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search marine parts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          data-testid="search-input"
        />
      </div>

      {query.length >= 2 && (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : results && results.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
