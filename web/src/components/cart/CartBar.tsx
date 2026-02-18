"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { formatPrice } from "@/lib/utils/price";
import { ShoppingCart } from "lucide-react";

export function CartBar() {
  const hydrated = useHydrated();
  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());
  const openSheet = useUIStore((s) => s.openSheet);

  if (!hydrated) return null;

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.button
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed right-4 bottom-20 left-4 z-30 flex items-center justify-between rounded-2xl bg-[var(--color-navy)] px-5 py-3.5 text-white shadow-lg"
          onClick={() => openSheet("cart")}
          data-testid="cart-bar"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>
          <span className="text-lg font-bold">{formatPrice(subtotal)}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
