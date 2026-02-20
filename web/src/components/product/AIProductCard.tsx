"use client";

import { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Plus, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils/price";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import type { Product } from "@/types";

export const AIProductCard = memo(function AIProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const openSheet = useUIStore((s) => s.openSheet);
  const [added, setAdded] = useState(false);

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      addItem(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 600);
    },
    [addItem, product]
  );

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-background/60 p-2 transition-colors hover:bg-muted/50"
      onClick={() => openSheet("product", product.id)}
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            loading="lazy"
            className="object-cover"
            sizes="44px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">
            N/A
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {product.brand && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </p>
        )}
        <p className="line-clamp-1 text-[12px] font-medium leading-tight text-foreground">
          {product.name}
        </p>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="text-[12px] font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && product.originalPrice && (
            <span className="text-[10px] text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
      <button
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-150 ${
          added
            ? "bg-green-500 text-white scale-110"
            : "bg-[var(--color-ocean)]/15 text-[var(--color-ocean)] active:scale-90"
        } ${product.stockStatus === "OUT_OF_STOCK" ? "opacity-40 pointer-events-none" : ""}`}
        onClick={handleAdd}
        aria-label={`Add ${product.name} to cart`}
      >
        {added ? (
          <Check className="h-3 w-3" strokeWidth={3} />
        ) : (
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        )}
      </button>
    </motion.div>
  );
});
