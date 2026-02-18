"use client";

import { motion } from "framer-motion";
import type { Suggestion } from "@/types";
import { Package, MapPin, Grid3X3 } from "lucide-react";
import { formatPrice } from "@/lib/utils/price";

interface SuggestionItemProps {
  suggestion: Suggestion;
  index: number;
  isActive: boolean;
  query: string;
  onSelect: (suggestion: Suggestion) => void;
}

function highlightMatch(text: string, query: string) {
  if (!query || query.length < 2) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-[var(--color-ocean)]/15 text-[var(--color-ocean)] rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const iconMap = {
  product: Package,
  marina: MapPin,
  category: Grid3X3,
};

export function SuggestionItem({
  suggestion,
  index,
  isActive,
  query,
  onSelect,
}: SuggestionItemProps) {
  const Icon = iconMap[suggestion.type];

  return (
    <motion.li
      id={`suggestion-${suggestion.id}`}
      role="option"
      aria-selected={isActive}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.03 }}
      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 min-h-[44px] transition-colors ${
        isActive
          ? "bg-[var(--color-ocean)]/10 text-foreground"
          : "text-foreground hover:bg-muted/60"
      }`}
      onClick={() => onSelect(suggestion)}
      onMouseDown={(e) => e.preventDefault()} // prevent blur on click
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          suggestion.type === "marina"
            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            : suggestion.type === "category"
              ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
              : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {highlightMatch(suggestion.label, query)}
        </p>
        {suggestion.subtitle && (
          <p className="truncate text-xs text-muted-foreground">
            {suggestion.subtitle}
          </p>
        )}
      </div>

      {suggestion.type === "product" && "price" in suggestion.data && (
        <span className="shrink-0 text-xs font-semibold text-[var(--color-ocean)]">
          {formatPrice((suggestion.data as { price: number }).price)}
        </span>
      )}

      {suggestion.distance !== undefined && (
        <span className="shrink-0 text-xs text-muted-foreground">
          {suggestion.distance.toFixed(1)} km
        </span>
      )}
    </motion.li>
  );
}
