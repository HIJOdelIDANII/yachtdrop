"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { Product, Marina } from "@/types";

interface CombinedSearchResult {
  products: Product[];
  marinas: Marina[];
}

export function useCombinedSearch(query: string) {
  const result = useQuery<CombinedSearchResult>({
    queryKey: ["search-combined", query],
    queryFn: async () => {
      const res = await fetch(
        `/api/search/combined?q=${encodeURIComponent(query)}&limit=20`
      );
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      return res.json();
    },
    enabled: query.length >= 1,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  return {
    products: result.data?.products ?? [],
    marinas: result.data?.marinas ?? [],
    isLoading: result.isLoading,
    isProductsLoading: result.isLoading,
    isMarinasLoading: result.isLoading,
    error: result.error,
  };
}
