"use client";

import { useState } from "react";
import { CategoryTabs } from "@/components/category/CategoryTabs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Anchor } from "lucide-react";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--color-border-brand)] bg-white/90 backdrop-blur">
        <div className="flex items-center gap-2 px-4 py-3">
          <Anchor className="h-6 w-6 text-[var(--color-ocean)]" />
          <h1 className="text-lg font-bold text-[var(--color-navy)]">
            YachtDrop
          </h1>
        </div>
        <CategoryTabs
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </header>

      {/* Product grid */}
      <section className="px-4 py-4">
        <ProductGrid categoryId={selectedCategory} />
      </section>
    </div>
  );
}
