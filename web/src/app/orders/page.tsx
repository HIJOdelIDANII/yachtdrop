/**
 * Orders Page — Lists all user orders with rich tracking cards.
 *
 * Uses a batch API endpoint to fetch all orders in a single query
 * instead of N+1 individual fetches. Order IDs are stored in
 * localStorage (no auth = no server-side user association).
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { OrderTracker } from "@/components/order/OrderTracker";
import { Skeleton } from "@/components/ui/skeleton";
import { Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import type { Order } from "@/types";

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["orders-list"],
    queryFn: async () => {
      const ids: string[] = JSON.parse(localStorage.getItem("yachtdrop_orders") || "[]");
      if (!ids.length) return [];
      // Single batch fetch instead of N+1 individual API calls
      const res = await fetch(`/api/orders/batch?ids=${ids.join(",")}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
          <h1 className="text-lg font-bold text-foreground">Orders</h1>
          {orders && orders.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </p>
          )}
        </header>
        <section className="space-y-3 px-4 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton key={j} className="h-1 flex-1 rounded-full" />
                    ))}
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            orders.map((order) => (
              <OrderTracker key={order.id} order={order} />
            ))
          ) : (
            <div className="flex flex-col items-center gap-4 py-20 text-muted-foreground">
              <Ship className="h-16 w-16" />
              <p className="text-base font-medium">No orders yet</p>
              <p className="text-center text-sm">
                Place your first order and track it here
              </p>
              <Link href="/browse">
                <Button className="min-h-[44px] bg-[var(--color-ocean)] text-white hover:bg-[var(--color-ocean)]/90">
                  Browse Products
                </Button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
