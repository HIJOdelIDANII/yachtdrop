/**
 * CartBar — Floating "View Cart" pill above the BottomNav.
 *
 * DESIGN DECISIONS:
 * - Modeled after Uber Eats’ green floating cart bar. Uses brand ocean color
 *   with a colored shadow (rgba glow) for visual prominence without blocking content.
 * - Positioned at bottom-[72px] to sit just above the BottomNav (which is ~56px + safe area).
 *   z-30 keeps it below the nav (z-40) but above page content.
 * - Spring animation (damping: 28, stiffness: 350) gives a snappy, physics-based
 *   entrance. Feels tactile on mobile — like the bar "bounces" into place.
 * - useHydrated() gate prevents flash of cart bar during SSR/hydration mismatch.
 *   Zustand’s persisted cart loads from localStorage after hydration, so the bar
 *   would flicker without this guard.
 * - Shows item count in a rounded-lg badge (bg-white/20) and total price on the right.
 *   This layout maps to Uber Eats: [count] [label] ... [price].
 * - active:scale-[0.98] provides instant tap feedback via CSS transforms.
 */
"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { formatPrice } from "@/lib/utils/price";
import { Truck, MapPin } from "lucide-react";

export function CartBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());
  const deliveryType = useCartStore((s) => s.deliveryType);
  const openSheet = useUIStore((s) => s.openSheet);

  if (!hydrated || itemCount === 0 || pathname === "/chat") return null;

  return (
    <AnimatePresence>
      <motion.button
        key="cart-bar"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        className="fixed right-3 bottom-[72px] left-3 z-30 flex items-center justify-between rounded-2xl bg-[var(--color-ocean)] px-4 py-3 text-white shadow-[0_4px_20px_rgba(0,180,216,0.35)] active:scale-[0.98] transition-transform duration-100"
        onClick={() => openSheet("cart")}
        data-testid="cart-bar"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-xs font-bold">
            {itemCount}
          </span>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">View Cart</span>
            <span className="flex items-center gap-1 text-[10px] text-white/70">
              {deliveryType === "DELIVERY" ? (
                <><Truck className="h-2.5 w-2.5" /> Delivery</>
              ) : (
                <><MapPin className="h-2.5 w-2.5" /> Pickup</>
              )}
            </span>
          </div>
        </div>
        <span className="text-sm font-bold">{formatPrice(subtotal)}</span>
      </motion.button>
    </AnimatePresence>
  );
}
