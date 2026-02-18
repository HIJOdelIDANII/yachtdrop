"use client";

import { useInfiniteProducts } from "@/lib/hooks/useData";
import { ProductCard } from "./ProductCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PackageOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProductGridProps {
  categoryId?: string | null;
}

export function ProductGrid({ categoryId }: ProductGridProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteProducts(categoryId);

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
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const products = data?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-muted-foreground">
        <PackageOpen className="h-16 w-16" />
        <p className="text-center text-sm font-medium">No products found</p>
        <p className="text-center text-xs">Try selecting a different category</p>
        <Link href="/browse">
          <Button variant="outline" size="sm">
            Browse All
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={categoryId ?? "all"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
        >
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
          {isFetchingNextPage &&
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={`skel-${i}`} />
            ))}
        </motion.div>
      </AnimatePresence>
      <div ref={sentinelRef} className="h-1" />
    </>
  );
}
