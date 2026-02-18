"use client";

import { useQuery } from "@tanstack/react-query";
import { OrderTracker } from "@/components/order/OrderTracker";
import { Skeleton } from "@/components/ui/skeleton";
import { Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";

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
      const ids = JSON.parse(localStorage.getItem("yachtdrop_orders") || "[]");
      if (!ids.length) return [];
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
    <PageTransition>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
          <h1 className="text-lg font-bold text-foreground">Orders</h1>
        </header>
        <section className="space-y-4 px-4 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            orders.map((order) => (
              <OrderTracker key={order.id} orderId={order.id} />
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
