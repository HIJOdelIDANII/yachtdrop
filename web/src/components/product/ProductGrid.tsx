/**
 * ProductGrid — Infinite-scroll product grid for the /browse page.
 *
 * DESIGN DECISIONS:
 * - 2-column grid on mobile (matches Uber Eats item grid density).
 *   Scales to 3-col on tablet (sm), 4-col on desktop (md).
 * - gap-2.5 (10px) is intentionally tight — maximizes product density
 *   on small screens. Uber Eats uses ~8-12px gaps.
 * - Infinite scroll via IntersectionObserver on a 1px sentinel div.
 *   rootMargin: 300px triggers prefetch well before user reaches bottom,
 *   making the scroll feel seamless on fast-scroll gestures.
 * - We deliberately removed AnimatePresence/motion.div wrapper around
 *   the grid container. The old pattern caused ALL cards to unmount/remount
 *   on category change (O(n) re-renders). Now each ProductCard has its own
 *   motion.div entrance — same visual result, much better perf.
 * - Client-side filtering (useFilteredProducts) is applied AFTER the
 *   infinite query so that filter changes don't trigger new API calls;
 *   they instantly filter the already-fetched pages.
 */
"use client";

import { useInfiniteProducts } from "@/lib/hooks/useData";
import { useFilteredProducts } from "@/lib/hooks/useFilteredProducts";
import { ProductCard } from "./ProductCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useEffect, useRef } from "react";
import { PackageOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProductGridProps {
  categoryId?: string | null;
}

export function ProductGrid({ categoryId }: ProductGridProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteProducts(categoryId);

  const products = data?.pages.flatMap((p) => p.data) ?? [];
  const filteredProducts = useFilteredProducts(products);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <PackageOpen className="h-12 w-12" />
        <p className="text-sm font-medium">No products found</p>
        <p className="text-xs">Try adjusting your filters</p>
        <Link href="/browse">
          <Button variant="outline" size="sm" className="mt-1">
            Browse All
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {filteredProducts.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
        {isFetchingNextPage &&
          Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={`skel-${i}`} />
          ))}
      </div>
      <div ref={sentinelRef} className="h-1" />
    </>
  );
}
