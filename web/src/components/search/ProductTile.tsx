/**
 * ProductTile — Horizontal row item for search results.
 *
 * DESIGN DECISIONS:
 * - This is a LIST layout (thumbnail left, info center, + button right),
 *   distinct from ProductCard which is a GRID layout. Search results use
 *   list layout because users are scanning by name, not browsing visually.
 *   Uber Eats uses the same split: grid for browsing, list for search.
 * - 14x14 thumbnail (56px) — small enough for density, large enough for
 *   recognition. Rounded-xl for consistency with card design language.
 * - Staggered y-axis entrance (capped at 0.25s) for smooth result loading.
 *   Delay is tighter than ProductCard (0.03 vs 0.04) because search results
 *   are scanned faster and the animation should feel snappier.
 * - active:bg-muted/50 on the row gives a subtle highlight on tap, matching
 *   native iOS list behavior. No border — keeps the list visually clean.
 * - Quick-add circle (h-9 w-9) is slightly larger than on grid cards
 *   because it's the only tap target in the right column of each row.
 * - memo() prevents re-renders when other search results update state.
 */
"use client";

import Image from "next/image";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils/price";
import { Plus, Check } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { motion } from "framer-motion";
import { memo, useState, useCallback } from "react";

interface ProductTileProps {
  product: Product;
  index?: number;
}

export const ProductTile = memo(function ProductTile({
  product,
  index = 0,
}: ProductTileProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openSheet = useUIStore((s) => s.openSheet);
  const [added, setAdded] = useState(false);

  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      addItem(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 600);
    },
    [addItem, product]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.25), ease: "easeOut" }}
      className="flex cursor-pointer items-center gap-3 rounded-xl bg-card p-2 active:bg-muted/50 transition-colors duration-100"
      onClick={() => openSheet("product", product.id)}
      role="listitem"
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            loading="lazy"
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
            N/A
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        {product.brand && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </p>
        )}
        <h3 className="line-clamp-1 text-[13px] font-medium leading-tight text-foreground">
          {product.name}
        </h3>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-[13px] font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && product.originalPrice && (
            <span className="text-[11px] text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
        {product.stockStatus && product.stockStatus !== "IN_STOCK" && (
          <span className="text-[11px] text-amber-600 dark:text-amber-400">
            {product.stockStatus === "LOW_STOCK" ? "Low stock" : "Out of stock"}
          </span>
        )}
      </div>

      {/* Quick-add — small circle */}
      <button
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-150 ${
          added
            ? "bg-green-500 text-white scale-110"
            : "bg-secondary text-foreground active:scale-90"
        } ${product.stockStatus === "OUT_OF_STOCK" ? "opacity-40 pointer-events-none" : ""}`}
        onClick={handleAdd}
        aria-label={`Add ${product.name} to cart`}
      >
        {added ? (
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        ) : (
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        )}
      </button>
    </motion.div>
  );
});
