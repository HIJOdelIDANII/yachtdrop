/**
 * CartItem — Single line item inside the CartDrawer.
 *
 * DESIGN DECISIONS:
 * - memo() is critical here: when user taps +/- on one item, only that item
 *   re-renders — not the entire cart list. Without memo, every CartItem would
 *   re-render because the parent items array reference changes.
 * - Replaced framer-motion whileTap + AnimatePresence on quantity buttons
 *   with CSS active:scale-90. Reason: in a list of 5-10 cart items, per-item
 *   framer-motion instances add up. CSS transforms are GPU-composited and
 *   zero-JS-cost per frame.
 * - Trash button uses active:text-red-500 (color on press) instead of
 *   always-red to reduce visual noise in the cart. The action is destructive
 *   but not dangerous (items can be re-added).
 * - 14x14 thumbnails (h-14 w-14) are smaller than grid cards because the
 *   user has already seen the product — recognition is fast, so the image
 *   is a reference, not a discovery tool.
 * - min-w-0 on the flex container prevents long product names from
 *   overflowing the layout (common CSS flexbox gotcha).
 */
"use client";

import Image from "next/image";
import { useCartStore } from "@/store/cart.store";
import { formatPrice } from "@/lib/utils/price";
import { Minus, Plus, Trash2 } from "lucide-react";
import { memo } from "react";
import type { CartItem as CartItemType } from "@/types";

interface CartItemProps {
  item: CartItemType;
}

export const CartItem = memo(function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-3 py-2.5" data-testid="cart-item">
      {/* Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
        {item.product.thumbnail ? (
          <Image
            src={item.product.thumbnail}
            alt={item.product.name}
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

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <h4 className="line-clamp-1 text-[13px] font-medium text-foreground">{item.product.name}</h4>
          <span className="text-[13px] font-bold text-foreground">
            {formatPrice(item.product.price * item.quantity)}
          </span>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground active:scale-90 active:bg-muted transition-all"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-6 text-center text-sm font-semibold text-foreground">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground active:scale-90 active:bg-muted transition-all"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={() => removeItem(item.product.id)}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground active:text-red-500 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});
