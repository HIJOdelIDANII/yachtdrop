/**
 * ProductCard — Uber Eats-style product card for the browse grid.
 *
 * DESIGN DECISIONS:
 * - 4:3 aspect ratio image (not square) gives more visual weight to the product
 *   photo while keeping cards compact. Matches food delivery app conventions.
 * - Floating circular "+" button in the bottom-right corner of the image allows
 *   quick-add without opening the detail sheet — reduces friction to 1 tap.
 *   Uber Eats, DoorDash, and Deliveroo all use this pattern.
 * - Check icon on add provides instant visual feedback (600ms). No toast here
 *   because the CartBar already slides up as confirmation — double feedback
 *   would be noisy.
 * - memo() prevents re-renders when sibling cards update (e.g. adding another
 *   product to cart). Each card only re-renders when its own product data or
 *   the `added` state changes.
 * - Staggered entrance animation: delay is capped at 0.3s so cards below the
 *   fold don't wait too long. easeOut curve feels natural on mobile.
 * - active:scale-[0.98] uses CSS transforms (GPU-composited) for instant tap
 *   feedback — faster than framer-motion whileTap which requires JS per frame.
 * - First 4 images are eager-loaded; rest are lazy. This ensures above-the-fold
 *   content paints fast on 3G connections.
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

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = memo(function ProductCard({
  product,
  index = 0,
}: ProductCardProps) {
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3), ease: "easeOut" }}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-card active:scale-[0.98] transition-transform duration-100"
      data-testid="product-card"
      onClick={() => openSheet("product", product.id)}
    >
      {/* Image — Uber Eats style: large, with floating + button */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            loading={index < 4 ? "eager" : "lazy"}
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}

        {/* Discount pill — top left */}
        {hasDiscount && product.discountPercent && (
          <span className="absolute top-2 left-2 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            -{product.discountPercent}%
          </span>
        )}

        {/* Low stock pill — top left below discount */}
        {product.stockStatus === "LOW_STOCK" && (
          <span className="absolute top-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            Low stock
          </span>
        )}

        {/* Floating + button — bottom right of image (Uber Eats pattern) */}
        <button
          className={`absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-all duration-150 ${
            added
              ? "bg-green-500 text-white scale-110"
              : "bg-white text-foreground hover:bg-gray-50 active:scale-90 dark:bg-card dark:text-foreground"
          } ${product.stockStatus === "OUT_OF_STOCK" ? "opacity-40 pointer-events-none" : ""}`}
          onClick={handleAdd}
          aria-label={`Add ${product.name} to cart`}
        >
          {added ? (
            <Check className="h-4 w-4" strokeWidth={3} />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Text content — tight, Uber Eats style */}
      <div className="px-1 pt-2 pb-1">
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
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
        {product.shortDesc && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
            {product.shortDesc}
          </p>
        )}
      </div>
    </motion.div>
  );
});
