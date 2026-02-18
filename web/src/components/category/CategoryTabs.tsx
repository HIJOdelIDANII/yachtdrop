"use client";

import { useCategories } from "@/lib/hooks/useData";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface CategoryTabsProps {
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryTabs({ selected, onSelect }: CategoryTabsProps) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }

  const allTabs = [
    { id: null, name: "All" },
    ...(categories?.map((c) => ({ id: c.id, name: c.name })) ?? []),
  ];

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
      {allTabs.map((tab) => {
        const isActive = selected === tab.id;
        return (
          <button
            key={tab.id ?? "all"}
            onClick={() => onSelect(tab.id)}
            className="relative shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors min-h-[36px]"
          >
            {isActive && (
              <motion.span
                layoutId="category-tab-active"
                className="absolute inset-0 rounded-full bg-[var(--color-ocean)]"
                transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
              />
            )}
            <span
              className={`relative z-10 ${
                isActive
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
