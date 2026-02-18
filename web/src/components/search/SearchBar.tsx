"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/lib/hooks/useData";
import { ProductCard } from "@/components/product/ProductCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { Search, Compass } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = useSearch(query);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search marine parts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 min-h-[44px]"
          data-testid="search-input"
        />
      </div>

      {query.length >= 2 && (
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          ) : results && results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {results.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-12 text-muted-foreground"
            >
              <Compass className="h-14 w-14" />
              <p className="text-base font-medium">
                No products found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-sm">Try a different search term</p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
