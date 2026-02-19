/**
 * OrderTracker — Uber Eats-style order card with timeline, item details, and delivery info.
 *
 * Shows the full order picture: status timeline with icons, ordered items with
 * thumbnails and quantities, delivery/pickup info, and price breakdown.
 * Previously only showed a bare timeline — now surfaces meaningful data so
 * the orders page isn't just a list of statuses.
 */
"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils/price";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Order } from "@/types";
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  ChevronDown,
  ShoppingBag,
} from "lucide-react";

const STATUS_CONFIG = {
  PENDING: { label: "Order Placed", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500" },
  CONFIRMED: { label: "Confirmed", icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500" },
  PREPARING: { label: "Preparing", icon: Package, color: "text-orange-500", bg: "bg-orange-500" },
  READY: { label: "Ready", icon: MapPin, color: "text-green-500", bg: "bg-green-500" },
  DELIVERED: { label: "Delivered", icon: Truck, color: "text-green-600", bg: "bg-green-600" },
} as const;

const STATUS_ORDER = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"] as const;

interface OrderTrackerProps {
  order: Order;
}

/**
 * Accepts a pre-fetched Order object (from the batch API) instead of
 * fetching by ID — eliminates N+1 queries on the orders page.
 */
export function OrderTracker({ order }: OrderTrackerProps) {
  const [expanded, setExpanded] = useState(false);

  const currentIdx = STATUS_ORDER.indexOf(
    order.status as (typeof STATUS_ORDER)[number]
  );
  const currentConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
  const isDelivery = order.deliveryType === "DELIVERY";
  const orderDate = new Date(order.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      {/* Header — status + order info */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${currentConfig?.bg || "bg-muted"} text-white`}>
              {currentConfig && <currentConfig.icon className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {currentConfig?.label ?? order.status}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {orderDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                {" · "}
                {orderDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-foreground">
            {formatPrice(Number(order.total))}
          </p>
          <Badge
            variant="secondary"
            className="mt-0.5 text-[10px]"
          >
            {isDelivery ? "Delivery" : "Pickup"}
          </Badge>
        </div>
      </div>

      {/* Progress bar — visual status at a glance */}
      <div className="px-4 pb-3">
        <div className="flex gap-1">
          {STATUS_ORDER.map((status, idx) => (
            <div
              key={status}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx <= currentIdx
                  ? "bg-[var(--color-ocean)]"
                  : "bg-border"
              }`}
            />
          ))}
        </div>
        {order.estimatedTime && order.status !== "DELIVERED" && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Est. {order.estimatedTime}
          </p>
        )}
      </div>

      {/* Items preview — show first 2 items with thumbnails */}
      {order.items && order.items.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            {order.items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5"
              >
                {item.productThumbnail && (
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={item.productThumbnail}
                      alt={item.productName || "Product"}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-foreground max-w-[80px]">
                    {item.productName || "Item"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ×{item.quantity}
                  </p>
                </div>
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="flex items-center rounded-lg bg-muted/50 px-2 py-1.5">
                <span className="text-[11px] text-muted-foreground">
                  +{order.items.length - 3} more
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-center gap-1 border-t border-border py-2 text-xs text-muted-foreground active:bg-muted/50 transition-colors"
      >
        {expanded ? "Hide" : "View"} details
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border px-4 py-3">
              {/* Full timeline */}
              <div className="space-y-0">
                {STATUS_ORDER.map((status, idx) => {
                  const config = STATUS_CONFIG[status];
                  const Icon = config.icon;
                  const isActive = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={status} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            isActive
                              ? isCurrent
                                ? "bg-[var(--color-ocean)] text-white"
                                : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                        </div>
                        {idx < STATUS_ORDER.length - 1 && (
                          <div
                            className={`h-5 w-0.5 ${
                              idx < currentIdx ? "bg-green-300 dark:bg-green-700" : "bg-border"
                            }`}
                          />
                        )}
                      </div>
                      <p
                        className={`pb-3 text-xs font-medium ${
                          isActive ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {config.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Price breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatPrice(Number(order.subtotal))}</span>
                </div>
                {Number(order.deliveryFee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-foreground">{formatPrice(Number(order.deliveryFee))}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-border font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{formatPrice(Number(order.total))}</span>
                </div>
              </div>

              {/* Contact & delivery info */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{order.contactName} · {order.contactPhone}</p>
                {order.berthNumber && <p>Berth: {order.berthNumber}</p>}
              </div>

              {/* Order ID */}
              <p className="text-[10px] text-muted-foreground/60">
                ID: {order.id}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
