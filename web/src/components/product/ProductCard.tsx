"use client";

import Image from "next/image";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
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
      setTimeout(() => setAdded(false), 800);
    },
    [addItem, product]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: "easeOut" }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
      data-testid="product-card"
      onClick={() => openSheet("product", product.id)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            loading="lazy"
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && product.discountPercent && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            -{product.discountPercent}%
          </Badge>
        )}

        {/* Stock badge */}
        {product.stockStatus && product.stockStatus !== "IN_STOCK" && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 text-xs"
          >
            {product.stockStatus === "LOW_STOCK"
              ? "Low stock"
              : "Out of stock"}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>

      {/* Quick-add button */}
      <div className="mt-auto px-3 pb-3">
        <motion.div whileTap={{ scale: 0.92 }}>
          <Button
            size="sm"
            className="w-full min-h-[44px] bg-[var(--color-ocean)] text-white hover:bg-[var(--color-ocean)]/90"
            onClick={handleAdd}
            disabled={product.stockStatus === "OUT_OF_STOCK"}
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  Added
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
