"use client";

import { useOrder } from "@/lib/hooks/useData";
import { formatPrice } from "@/lib/utils/price";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  MapPin,
} from "lucide-react";

const STATUS_CONFIG = {
  PENDING: { label: "Order Placed", icon: Clock, color: "text-yellow-500" },
  CONFIRMED: { label: "Confirmed", icon: CheckCircle2, color: "text-blue-500" },
  PREPARING: { label: "Preparing", icon: Package, color: "text-orange-500" },
  READY: { label: "Ready", icon: MapPin, color: "text-green-500" },
  DELIVERED: { label: "Delivered", icon: Truck, color: "text-green-600" },
} as const;

const STATUS_ORDER = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"] as const;

interface OrderTrackerProps {
  orderId: string;
}

export function OrderTracker({ orderId }: OrderTrackerProps) {
  const { data: order, isLoading } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-xl border bg-white p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currentIdx = STATUS_ORDER.indexOf(
    order.status as (typeof STATUS_ORDER)[number]
  );

  return (
    <div className="space-y-4 rounded-xl border border-[var(--color-border-brand)] bg-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">
            Order #{order.id.slice(0, 8)}
          </p>
          <p className="text-sm font-semibold text-[var(--color-navy)]">
            {formatPrice(Number(order.total))}
          </p>
        </div>
        <Badge
          className={
            order.status === "DELIVERED"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }
        >
          {STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.label ??
            order.status}
        </Badge>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {STATUS_ORDER.map((status, idx) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const isActive = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={status} className="flex items-start gap-3">
              {/* Dot + line */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    isActive
                      ? isCurrent
                        ? "bg-[var(--color-ocean)] text-white"
                        : "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {idx < STATUS_ORDER.length - 1 && (
                  <div
                    className={`h-6 w-0.5 ${
                      idx < currentIdx ? "bg-green-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
              {/* Label */}
              <div className="pb-4">
                <p
                  className={`text-sm font-medium ${
                    isActive ? "text-[var(--color-navy)]" : "text-gray-400"
                  }`}
                >
                  {config.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimated time */}
      {order.estimatedTime && order.status !== "DELIVERED" && (
        <p className="text-center text-xs text-gray-400">
          Estimated: {order.estimatedTime}
        </p>
      )}

      {/* Items summary */}
      <div className="border-t pt-3">
        <p className="text-xs font-medium text-gray-500">
          {order.items?.length ?? 0} item
          {(order.items?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
