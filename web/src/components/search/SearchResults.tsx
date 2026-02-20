"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product, Marina } from "@/types";
import { ProductTile } from "./ProductTile";
import { Skeleton } from "@/components/ui/skeleton";
import { Compass, MapPin } from "lucide-react";

interface SearchResultsProps {
  query: string;
  products: Product[];
  marinas: Marina[];
  isLoading: boolean;
  isMarinasLoading?: boolean;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
  onMarinaSelect?: (marina: Marina) => void;
}

export function SearchResults({
  query,
  products,
  marinas,
  isLoading,
  hasMore,
  isFetchingMore,
  onLoadMore,
  onMarinaSelect,
}: SearchResultsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || !onLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, onLoadMore]);

  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-card p-2">
            <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/4 rounded" />
            </div>
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  const hasResults = products.length > 0 || marinas.length > 0;

  if (!hasResults && !isLoading && query.length >= 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 py-12 text-muted-foreground"
      >
        <Compass className="h-14 w-14" />
        <p className="text-base font-medium">
          No results for &ldquo;{query}&rdquo;
        </p>
        <p className="text-sm">Try a different search term</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div aria-live="polite" className="sr-only">
        {products.length} product{products.length !== 1 ? "s" : ""} and{" "}
        {marinas.length} marina{marinas.length !== 1 ? "s" : ""} found
      </div>

      {/* Marina results */}
      {marinas.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Marinas
          </h2>
          <div className="space-y-1.5" role="list">
            <AnimatePresence>
              {marinas.map((marina, i) => (
                <motion.button
                  key={marina.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.03 }}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 min-h-[44px] text-left transition-colors hover:bg-muted/50"
                  onClick={() => onMarinaSelect?.(marina)}
                  role="listitem"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {marina.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[marina.city, marina.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Product results */}
      {products.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Products ({products.length})
          </h2>
          <div className="space-y-2" role="list">
            <AnimatePresence>
              {products.map((product, i) => (
                <ProductTile key={product.id} product={product} index={i} />
              ))}
            </AnimatePresence>

            {isFetchingMore && (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={`skel-${i}`} className="flex items-center gap-3 rounded-xl bg-card p-2">
                    <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/4 rounded" />
                    </div>
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div ref={sentinelRef} className="h-1" />
        </section>
      )}
    </div>
  );
}
