"use client";

import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CartItem } from "./CartItem";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils/price";
import { ShoppingCart } from "lucide-react";

export function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clearCart);
  const activeSheet = useUIStore((s) => s.activeSheet);
  const closeSheet = useUIStore((s) => s.closeSheet);
  const openSheet = useUIStore((s) => s.openSheet);

  const deliveryFee = 5.0;
  const open = activeSheet === "cart";

  return (
    <BottomSheet open={open} onClose={closeSheet} title="Your Cart">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
          <ShoppingCart className="h-12 w-12" />
          <p className="text-sm">Your cart is empty</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Items */}
          <div className="divide-y">
            {items.map((item) => (
              <CartItem key={item.product.id} item={item} />
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery fee</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(subtotal + deliveryFee)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={clearCart}
            >
              Clear Cart
            </Button>
            <Button
              className="flex-1 bg-[var(--color-ocean)] text-white hover:bg-[var(--color-ocean)]/90"
              onClick={() => {
                closeSheet();
                setTimeout(() => openSheet("checkout"), 150);
              }}
            >
              Checkout — {formatPrice(subtotal + deliveryFee)}
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
