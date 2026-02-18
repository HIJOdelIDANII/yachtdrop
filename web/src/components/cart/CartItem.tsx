"use client";

import Image from "next/image";
import { useCartStore } from "@/store/cart.store";
import { formatPrice } from "@/lib/utils/price";
import { Minus, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CartItem as CartItemType } from "@/types";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-3 py-3" data-testid="cart-item">
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.product.thumbnail ? (
          <Image
            src={item.product.thumbnail}
            alt={item.product.name}
            fill
            loading="lazy"
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            N/A
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h4 className="line-clamp-1 text-sm font-medium text-foreground">{item.product.name}</h4>
          <span className="text-sm font-bold text-[var(--color-ocean)]">
            {formatPrice(item.product.price * item.quantity)}
          </span>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
          >
            <Minus className="h-3 w-3" />
          </motion.button>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={item.quantity}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.12 }}
              className="w-5 text-center text-sm font-medium text-foreground"
            >
              {item.quantity}
            </motion.span>
          </AnimatePresence>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
          >
            <Plus className="h-3 w-3" />
          </motion.button>
          <button
            onClick={() => removeItem(item.product.id)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
