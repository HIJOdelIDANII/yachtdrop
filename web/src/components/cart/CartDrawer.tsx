/**
 * CartDrawer — Bottom sheet showing cart contents, totals, and checkout CTA.
 *
 * DESIGN DECISIONS:
 * - Opens via BottomSheet (drag-to-dismiss) for native app-like feel.
 * - Delivery fee is NOT shown here — only "Calculated at checkout".
 *   Previously it was hardcoded to €5 which was misleading because the user
 *   hasn't chosen delivery vs pickup yet. Uber Eats does the same: cart shows
 *   subtotal, fees appear only at checkout.
 * - Checkout CTA uses bg-foreground (dark in light mode, light in dark mode)
 *   which inverts the theme for maximum contrast. This is the highest-priority
 *   action on the page.
 * - 150ms setTimeout before opening checkout sheet prevents two sheets
 *   animating simultaneously (close cart → wait → open checkout).
 * - Empty cart state shows branded Anchor icon and a CTA to browse,
 *   preventing a dead-end in the user flow.
 */
"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CartItem } from "./CartItem";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils/price";
import { Anchor } from "lucide-react";
import Link from "next/link";

export function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clearCart);
  const activeSheet = useUIStore((s) => s.activeSheet);
  const closeSheet = useUIStore((s) => s.closeSheet);
  const openSheet = useUIStore((s) => s.openSheet);
  const [confirmClear, setConfirmClear] = useState(false);

  const open = activeSheet === "cart";

  return (
    <BottomSheet open={open} onClose={closeSheet} title="Your Cart">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-muted-foreground">
          <Anchor className="h-14 w-14" />
          <p className="text-base font-medium">Your cart is empty</p>
          <p className="text-sm">Browse marine parts and add them here</p>
          <Link href="/browse" onClick={() => closeSheet()}>
            <Button className="bg-[var(--color-ocean)] text-white hover:bg-[var(--color-ocean)]/90">
              Start Browsing
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Items */}
          <div className="divide-y divide-border">
            {items.map((item) => (
              <CartItem key={item.product.id} item={item} />
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-xs text-muted-foreground">Calculated at checkout</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className={`min-h-[44px] transition-colors ${confirmClear ? "text-destructive" : "text-muted-foreground"}`}
              onClick={() => {
                if (confirmClear) {
                  clearCart();
                  setConfirmClear(false);
                } else {
                  setConfirmClear(true);
                  setTimeout(() => setConfirmClear(false), 3000);
                }
              }}
            >
              {confirmClear ? "Confirm?" : "Clear"}
            </Button>
            <Button
              className="min-h-[48px] flex-1 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-sm font-semibold active:scale-[0.98] transition-transform"
              onClick={() => {
                closeSheet();
                setTimeout(() => openSheet("checkout"), 150);
              }}
            >
              Checkout · {formatPrice(subtotal)}
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
