"use client";

import { useState } from "react";
import { CategoryTabs } from "@/components/category/CategoryTabs";
import { ProductGrid } from "@/components/product/ProductGrid";

export default function BrowsePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border-brand)] bg-white/90 backdrop-blur">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-[var(--color-navy)]">Browse</h1>
        </div>
        <CategoryTabs
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </header>

      <section className="px-4 py-4">
        <ProductGrid categoryId={selectedCategory} />
      </section>
    </div>
  );
}
