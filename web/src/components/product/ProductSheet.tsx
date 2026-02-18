"use client";

import Image from "next/image";
import { useProduct } from "@/lib/hooks/useData";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils/price";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ProductSheet() {
  const activeSheet = useUIStore((s) => s.activeSheet);
  const selectedProductId = useUIStore((s) => s.selectedProductId);
  const closeSheet = useUIStore((s) => s.closeSheet);
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useProduct(
    activeSheet === "product" ? selectedProductId : null
  );

  const open = activeSheet === "product";

  const handleAdd = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addItem(product);
    setQuantity(1);
    closeSheet();
  };

  return (
    <BottomSheet open={open} onClose={closeSheet}>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : product ? (
        <div className="space-y-4">
          {/* Product image */}
          {product.thumbnail && (
            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
              <Image
                src={product.thumbnail}
                alt={product.name}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          )}

          {/* Name & price */}
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {product.name}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg font-bold text-[var(--color-ocean)]">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              {product.discountPercent && (
                <Badge className="bg-red-500 text-white">
                  -{product.discountPercent}%
                </Badge>
              )}
            </div>
          </div>

          {/* Stock status */}
          {product.stockStatus && (
            <Badge
              variant={
                product.stockStatus === "IN_STOCK" ? "default" : "secondary"
              }
            >
              {product.stockStatus === "IN_STOCK"
                ? "In Stock"
                : product.stockStatus === "LOW_STOCK"
                  ? "Low Stock"
                  : "Out of Stock"}
            </Badge>
          )}

          {/* Description */}
          {product.description && (
            <div
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {/* Quantity picker + Add to cart */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-3 rounded-full border border-border px-3 py-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center text-foreground"
              >
                <Minus className="h-4 w-4" />
              </motion.button>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={quantity}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="w-6 text-center font-medium text-foreground"
                >
                  {quantity}
                </motion.span>
              </AnimatePresence>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center text-foreground"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            </div>
            <Button
              className="min-h-[44px] flex-1 bg-[var(--color-ocean)] text-white hover:bg-[var(--color-ocean)]/90"
              onClick={handleAdd}
              disabled={product.stockStatus === "OUT_OF_STOCK"}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart — {formatPrice(product.price * quantity)}
            </Button>
          </div>
        </div>
      ) : null}
    </BottomSheet>
  );
}
