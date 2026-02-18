"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { useCreateOrder } from "@/lib/hooks/useData";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils/price";
import { toast } from "sonner";
import { Truck, MapPin, Loader2 } from "lucide-react";
import { MarinaPicker } from "@/components/search/MarinaPicker";
import type { Marina } from "@/types";

type DeliveryType = "DELIVERY" | "PICKUP";

export function CheckoutSheet() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clearCart);
  const activeSheet = useUIStore((s) => s.activeSheet);
  const closeSheet = useUIStore((s) => s.closeSheet);
  const createOrder = useCreateOrder();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("DELIVERY");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [berthNumber, setBerthNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [selectedMarina, setSelectedMarina] = useState<Marina | null>(null);

  const open = activeSheet === "checkout";
  const deliveryFee = deliveryType === "DELIVERY" ? 5.0 : 0;
  const total = subtotal + deliveryFee;

  const isValid =
    contactName.trim() &&
    contactPhone.trim() &&
    contactEmail.trim() &&
    (deliveryType === "DELIVERY" || selectedMarina !== null);

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error("Please fill in all contact fields");
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        deliveryType,
        marinaId: selectedMarina?.id || undefined,
        berthNumber: berthNumber || undefined,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        notes: notes || undefined,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      });

      setOrderId(order.id);
      // Save order ID for the orders page
      const existingOrders = JSON.parse(
        localStorage.getItem("yachtdrop_orders") || "[]"
      );
      localStorage.setItem(
        "yachtdrop_orders",
        JSON.stringify([order.id, ...existingOrders])
      );
      clearCart();
      toast.success("Order placed successfully!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to place order"
      );
    }
  };

  const handleClose = () => {
    setOrderId(null);
    closeSheet();
  };

  if (orderId) {
    return (
      <BottomSheet open={open} onClose={handleClose} title="Order Confirmed!">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Thank you for your order!
          </h3>
          <p className="text-center text-sm text-muted-foreground">
            Your order has been placed. Estimated delivery: 45–60 min.
          </p>
          <p className="text-xs text-muted-foreground">
            Order ID: {orderId.slice(0, 8)}…
          </p>
          <Button
            className="mt-4 w-full bg-[var(--color-ocean)] text-white hover:bg-[var(--color-ocean)]/90"
            onClick={handleClose}
          >
            Done
          </Button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title="Checkout">
      <div className="space-y-5">
        {/* Delivery type toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setDeliveryType("DELIVERY")}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
              deliveryType === "DELIVERY"
                ? "border-[var(--color-ocean)] bg-[var(--color-ocean)]/10 text-[var(--color-ocean)]"
                : "border-border text-muted-foreground"
            }`}
          >
            <Truck className="h-4 w-4" />
            Delivery
          </button>
          <button
            onClick={() => setDeliveryType("PICKUP")}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
              deliveryType === "PICKUP"
                ? "border-[var(--color-ocean)] bg-[var(--color-ocean)]/10 text-[var(--color-ocean)]"
                : "border-border text-muted-foreground"
            }`}
          >
            <MapPin className="h-4 w-4" />
            Pickup
          </button>
        </div>

        {/* Contact info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Contact Information
          </h3>
          <div className="space-y-2">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+34 600 000 000"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Delivery / Pickup conditional section */}
        <AnimatePresence mode="popLayout" initial={false}>
          {deliveryType === "DELIVERY" ? (
            <motion.div
              key="delivery-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Delivery Details
                </h3>
                <div>
                  <Label htmlFor="berth">Berth / Pontoon Number</Label>
                  <Input
                    id="berth"
                    placeholder="B-42"
                    value={berthNumber}
                    onChange={(e) => setBerthNumber(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pickup-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Select Pickup Marina
                </h3>
                <MarinaPicker
                  selectedMarinaId={selectedMarina?.id}
                  onSelect={(marina) => setSelectedMarina(marina)}
                />
                <AnimatePresence>
                  {selectedMarina && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs text-muted-foreground"
                    >
                      Pickup at: <strong>{selectedMarina.name}</strong>
                      {selectedMarina.city && `, ${selectedMarina.city}`}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <Separator />

        {/* Order summary */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
            <span className="text-foreground">{formatPrice(subtotal)}</span>
          </div>
          {deliveryType === "DELIVERY" && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery fee</span>
              <span className="text-foreground">{formatPrice(deliveryFee)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-base font-bold text-foreground">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Submit */}
        <Button
          className="w-full bg-[var(--color-ocean)] py-6 text-base font-semibold text-white hover:bg-[var(--color-ocean)]/90"
          onClick={handleSubmit}
          disabled={!isValid || createOrder.isPending}
        >
          {createOrder.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Placing order…
            </>
          ) : (
            `Place Order — ${formatPrice(total)}`
          )}
        </Button>
      </div>
    </BottomSheet>
  );
}
