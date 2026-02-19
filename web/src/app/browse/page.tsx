"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { CategoryTabs } from "@/components/category/CategoryTabs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FilterSheet } from "@/components/product/FilterSheet";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-2 px-4 py-2.5">
          <Image src="/brand/logo.png" alt="YachtDrop" width={22} height={22} />
          <h1 className="text-base font-bold text-foreground">Browse</h1>
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
          onSelect={setSelectedCategory}
        />
      </header>

      <section className="px-3 py-3">
        <ProductGrid categoryId={selectedCategory} />
      </section>

      <FilterSheet open={filterOpen} onOpenChange={setFilterOpen} />
    </div>
    </PageTransition>
  );
}
