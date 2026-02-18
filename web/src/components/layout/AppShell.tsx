"use client";

import { BottomNav } from "./BottomNav";
import { CartBar } from "@/components/cart/CartBar";
import { ProductSheet } from "@/components/product/ProductSheet";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CheckoutSheet } from "@/components/checkout/CheckoutSheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <main className="pb-36">{children}</main>
      <CartBar />
      <ProductSheet />
      <CartDrawer />
      <CheckoutSheet />
      <BottomNav />
    </div>
  );
}
