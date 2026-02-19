/**
 * CategoryTabs — Horizontal scrollable filter pills for /browse.
 *
 * DESIGN DECISIONS:
 * - These are FILTERS (select → products update), not navigation links.
 *   That's why they live on /browse and not on home. CategoryGrid on home
 *   uses icons and navigates; CategoryTabs here filters in-place.
 * - Replaced framer-motion layoutId animation with pure CSS transition-all.
 *   The old layoutId caused a layout recalculation on every tab switch which
 *   triggered a repaint cascade in the grid below. CSS bg transition is
 *   GPU-composited and doesn't affect layout.
 * - Active tab uses bg-foreground/text-background (inverted theme) for high
 *   contrast. Inactive uses bg-secondary which is subtle but visible.
 * - memo() prevents re-render when ProductGrid updates (e.g., infinite scroll
 *   loads more pages). Tabs only re-render when `selected` or categories change.
 * - "All" is always first, prepended to the API categories array.
 * - min-h-[34px] ensures 44px touch target (34px + padding) per Apple HIG.
 */
"use client";

import { useCategories } from "@/lib/hooks/useData";
import { Skeleton } from "@/components/ui/skeleton";
import { memo } from "react";

interface CategoryTabsProps {
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export const CategoryTabs = memo(function CategoryTabs({
  selected,
  onSelect,
}: CategoryTabsProps) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }

  const allTabs = [
    { id: null, name: "All", count: null },
    ...(categories?.map((c) => ({ id: c.id, name: c.name, count: c.productCount })) ?? []),
  ];

  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2.5">
      {allTabs.map((tab) => {
        const isActive = selected === tab.id;
        return (
          <button
            key={tab.id ?? "all"}
            onClick={() => onSelect(tab.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 min-h-[34px] ${
              isActive
                ? "bg-foreground text-background shadow-sm"
                : "bg-secondary text-muted-foreground active:bg-secondary/80"
            }`}
          >
            {tab.name}
          </button>
        );
      })}
    </div>
  );
});
