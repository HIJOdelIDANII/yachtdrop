"use client";

import Image from "next/image";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils/price";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Check } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface ProductTileProps {
  product: Product;
  index?: number;
}

export function ProductTile({ product, index = 0 }: ProductTileProps) {
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
      toast.success("✓ Added", {
        description: product.name,
        duration: 1500,
      });
      setTimeout(() => setAdded(false), 800);
    },
    [addItem, product]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03, ease: "easeOut" }}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-2.5 transition-shadow hover:shadow-md"
      onClick={() => openSheet("product", product.id)}
      role="listitem"
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            loading="lazy"
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No img
          </div>
        )}
        {hasDiscount && product.discountPercent && (
          <Badge className="absolute -top-1 -left-1 scale-75 bg-red-500 text-white">
            -{product.discountPercent}%
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
          {product.name}
        </h3>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
        {product.stockStatus && product.stockStatus !== "IN_STOCK" && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {product.stockStatus === "LOW_STOCK" ? "Low stock" : "Out of stock"}
          </span>
        )}
      </div>

      {/* Quick-add */}
      <motion.div whileTap={{ scale: 0.9 }} className="shrink-0">
        <Button
          size="icon"
          className="h-10 w-10 rounded-xl bg-[var(--color-ocean)] text-white hover:bg-[var(--color-ocean)]/90"
          onClick={handleAdd}
          disabled={product.stockStatus === "OUT_OF_STOCK"}
          aria-label={`Add ${product.name} to cart`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.span
                key="check"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.12 }}
              >
                <Check className="h-4 w-4" />
              </motion.span>
            ) : (
              <motion.span
                key="plus"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.12 }}
              >
                <Plus className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </motion.div>
  );
}
