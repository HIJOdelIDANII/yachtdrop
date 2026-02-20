"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cart.store";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils/price";
import { Plus, Sparkles, ShoppingCart } from "lucide-react";
import type { Bundle, Product } from "@/types";
import { toast } from "sonner";

interface BundleCardProps {
  bundle: Bundle;
}

export function BundleCard({ bundle }: BundleCardProps) {
  const [open, setOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddAll = () => {
    for (const product of bundle.products) {
      addItem(product);
    }
    toast.success(`Added ${bundle.products.length} items from "${bundle.name}"`);
    setOpen(false);
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        className="flex w-[200px] shrink-0 flex-col rounded-2xl border border-border bg-card p-3 text-left"
      >
        <div className="flex items-start justify-between">
          <span className="text-2xl">{bundle.icon}</span>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
            AI
          </span>
        </div>
        <h3 className="mt-2 text-sm font-semibold text-foreground leading-tight">
          {bundle.name}
        </h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
          {bundle.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {bundle.products.length} items
            </p>
            <p className="text-sm font-bold text-foreground">
              {formatPrice(bundle.totalPrice)}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-ocean)] text-white">
            <Plus className="h-4 w-4" />
          </div>
        </div>
      </motion.button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={bundle.name}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{bundle.icon}</span>
            <div>
              <p className="text-sm text-muted-foreground">{bundle.description}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-purple-500" />
                <span className="text-[10px] text-purple-600 dark:text-purple-300">
                  AI-curated bundle
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {bundle.products.map((product) => (
              <BundleProductRow
                key={product.id}
                product={product}
                onAdd={() => {
                  addItem(product);
                  toast.success(`Added "${product.name}"`);
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <div>
              <p className="text-xs text-muted-foreground">Bundle total</p>
              <p className="text-lg font-bold text-foreground">
                {formatPrice(bundle.totalPrice)}
              </p>
            </div>
            <Button
              onClick={handleAddAll}
              className="bg-[var(--color-ocean)] text-white hover:bg-[var(--color-ocean)]/90"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add All to Cart
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

function BundleProductRow({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-2">
      {product.thumbnail && (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {product.name}
        </p>
        <p className="text-xs font-semibold text-[var(--color-ocean)]">
          {formatPrice(product.price)}
        </p>
      </div>
      <button
        onClick={onAdd}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground active:scale-90 transition-transform"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
