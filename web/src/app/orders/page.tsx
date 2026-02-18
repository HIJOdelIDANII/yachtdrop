"use client";

import { useQuery } from "@tanstack/react-query";
import { OrderTracker } from "@/components/order/OrderTracker";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";

interface OrderSummary {
  id: string;
  status: string;
  total: number;
  createdAt: string;
}

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery<OrderSummary[]>({
    queryKey: ["orders-list"],
    queryFn: async () => {
      // Orders stored in localStorage since we have no auth
      const ids = JSON.parse(localStorage.getItem("yachtdrop_orders") || "[]");
      if (!ids.length) return [];
      // Fetch each order
      const results = await Promise.all(
        ids.map(async (id: string) => {
          try {
            const res = await fetch(`/api/orders/${id}`);
            if (!res.ok) return null;
            const json = await res.json();
            return json.data;
          } catch {
            return null;
          }
        })
      );
      return results.filter(Boolean);
    },
    staleTime: 30_000,
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border-brand)] bg-white/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold text-[var(--color-navy)]">Orders</h1>
      </header>
      <section className="space-y-4 px-4 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          orders.map((order) => (
            <OrderTracker key={order.id} orderId={order.id} />
          ))
        ) : (
          <div className="flex flex-col items-center gap-4 py-20 text-gray-400">
            <Package className="h-16 w-16" />
            <p className="text-center text-sm">
              No orders yet. Start shopping to see your orders here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
