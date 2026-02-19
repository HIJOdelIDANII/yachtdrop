"use client";

import { useQuery, useInfiniteQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import type { Product, Category, Order } from "@/types";
import { useState, useEffect } from "react";

// ─── Categories ──────────────────────────────────────────────────
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const json = await res.json();
      return json.data;
    },
  });
}

// ─── Products (paginated) ────────────────────────────────────────
export function useProducts(categoryId?: string | null) {
  return useQuery<Product[]>({
    queryKey: ["products", categoryId ?? "all"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryId) params.set("category", categoryId);
      params.set("limit", "20");
      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      return json.data;
    },
  });
}

// ─── Products (infinite scroll) ─────────────────────────────────
export function useInfiniteProducts(categoryId?: string | null) {
  return useInfiniteQuery<{
    data: Product[];
    meta: { page: number; hasMore: boolean };
  }>({
    queryKey: ["products-infinite", categoryId ?? "all"],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (categoryId) params.set("category", categoryId);
      params.set("page", String(pageParam));
      params.set("limit", "20");
      const res = await fetch(`/api/products?${params}`);
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (last) => (last.meta.hasMore ? last.meta.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

// ─── Single product ──────────────────────────────────────────────
export function useProduct(id: string | null) {
  return useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
}

// ─── Search ──────────────────────────────────────────────────────
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useSearch(query: string) {
  const debounced = useDebouncedValue(query, 300);

  return useQuery<Product[]>({
    queryKey: ["search", debounced],
    queryFn: async () => {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(debounced)}`
      );
      const json = await res.json();
      return json.data;
    },
    enabled: debounced.length >= 2,
  });
}

// ─── Trending products ──────────────────────────────────────────
export function useTrendingProducts() {
  return useQuery<Product[]>({
    queryKey: ["products-trending"],
    queryFn: async () => {
      const res = await fetch("/api/products/trending");
      const json = await res.json();
      return json.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Best offers ────────────────────────────────────────────────
export function useOffers() {
  return useQuery<Product[]>({
    queryKey: ["products-offers"],
    queryFn: async () => {
      const res = await fetch("/api/products/offers");
      const json = await res.json();
      return json.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Create order ────────────────────────────────────────────────
export function useCreateOrder() {
  return useMutation<Order, Error, Record<string, unknown>>({
    mutationFn: async (body) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create order");
      }
      const json = await res.json();
      return json.data;
    },
  });
}

// ─── Get order ───────────────────────────────────────────────────
export function useOrder(id: string | null) {
  return useQuery<Order>({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
}
