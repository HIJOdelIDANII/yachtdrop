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
import { useProductCardActions } from "@/lib/hooks/useProductCardActions";
import { FloatingAddButton } from "./FloatingAddButton";
import { motion } from "framer-motion";
import { memo } from "react";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = memo(function ProductCard({
  product,
  index = 0,
}: ProductCardProps) {
  const { added, handleAdd, handleOpen } = useProductCardActions(product);

  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3), ease: "easeOut" }}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-card active:scale-[0.98] transition-transform duration-100"
      data-testid="product-card"
      onClick={handleOpen}
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
          <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground/40">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
        )}

        {/* Discount pill — top left */}
        {hasDiscount && product.discountPercent && (
          <span className="absolute top-2 left-2 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            -{product.discountPercent}%
          </span>
        )}

        {/* Low stock pill — top right */}
        {product.stockStatus === "LOW_STOCK" && (
          <span className="absolute top-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            Low stock
          </span>
        )}

        <FloatingAddButton
          added={added}
          disabled={product.stockStatus === "OUT_OF_STOCK"}
          size="md"
          onClick={handleAdd}
          label={`Add ${product.name} to cart`}
        />
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
