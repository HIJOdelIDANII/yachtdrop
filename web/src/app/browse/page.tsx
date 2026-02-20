/**
 * Browse Page — Full product catalog with category filtering.
 *
 * Category selection is synced to URL search params (?category=ID) so it
 * survives page reload and supports deep linking from the home page.
 * Uses useRouter().replace to update the URL without a navigation event.
 */
"use client";

import { useCallback } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { CategoryTabs } from "@/components/category/CategoryTabs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FilterSheet } from "@/components/product/FilterSheet";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SlidersHorizontal, Package } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { useBundles } from "@/lib/hooks/useBundles";
import { BundleCard } from "@/components/product/BundleCard";

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCategory = searchParams.get("category");
  const [filterOpen, setFilterOpen] = useState(false);
  const { data: bundles } = useBundles();

  const handleCategorySelect = useCallback(
    (categoryId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (categoryId) {
        params.set("category", categoryId);
      } else {
        params.delete("category");
      }
      router.replace(`/browse?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-2 px-4 py-2.5">
          <Image src="/brand/logo.png" alt="YachtDrop" width={22} height={22} />
          <span className="text-sm font-bold text-foreground">YachtDrop</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFilterOpen(true)}
              className="h-8 w-8"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
        <CategoryTabs
          selected={selectedCategory}
          onSelect={handleCategorySelect}
        />
      </header>

      {bundles && bundles.length > 0 && (
        <section className="py-3">
          <div className="flex items-center gap-2 px-3 mb-2">
            <Package className="h-4 w-4 text-[var(--color-ocean)]" />
            <h2 className="text-sm font-bold text-foreground">Crew Essentials</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-3 pb-2 scrollbar-hide">
            {bundles.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} />
            ))}
          </div>
        </section>
      )}

      <section className="px-3 py-3">
        <ProductGrid categoryId={selectedCategory} />
      </section>

      <FilterSheet open={filterOpen} onOpenChange={setFilterOpen} />
    </div>
    </PageTransition>
  );
}
