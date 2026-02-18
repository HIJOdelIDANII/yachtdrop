"use client";

import { useState } from "react";
import Image from "next/image";
import { CategoryTabs } from "@/components/category/CategoryTabs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FilterSheet } from "@/components/product/FilterSheet";
import { PageTransition } from "@/components/layout/PageTransition";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sliders } from "lucide-react";

export default function BrowsePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
          <div className="flex items-center gap-2 px-4 py-3">
            <Image src="/brand/logo.png" alt="YachtDrop" width={24} height={24} />
            <h1 className="text-lg font-bold text-foreground">Browse</h1>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFilterOpen(true)}
                className="h-9 w-9"
              >
                <Sliders className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
          <CategoryTabs
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </header>

        <section className="px-4 py-4">
          <ProductGrid categoryId={selectedCategory} />
        </section>

        <FilterSheet open={filterOpen} onOpenChange={setFilterOpen} />
      </div>
    </PageTransition>
  );
}
