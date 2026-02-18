import { useMemo } from "react";
import { useFilterStore } from "@/store/filter.store";
import type { Product } from "@/types";

export function useFilteredProducts(products: Product[] | undefined) {
  const {
    minPrice,
    maxPrice,
    stockOnly,
    discountOnly,
    selectedCategories,
    sortBy,
  } = useFilterStore();

  return useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => 
        p.categoryId && selectedCategories.includes(p.categoryId)
      );
    }

    // Price filter
    filtered = filtered.filter(
      (p) => p.price >= minPrice && p.price <= maxPrice
    );

    // Stock filter
    if (stockOnly) {
      filtered = filtered.filter((p) => p.available && p.stockStatus === "IN_STOCK");
    }

    // Discount filter
    if (discountOnly) {
      filtered = filtered.filter((p) => p.discountPercent && p.discountPercent > 0);
    }

    // Sorting
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "availability":
        filtered.sort((a, b) => {
          if (a.available !== b.available) {
            return a.available ? -1 : 1;
          }
          return 0;
        });
        break;
      // "relevance" is default, no sorting needed
    }

    return filtered;
  }, [products, minPrice, maxPrice, stockOnly, discountOnly, selectedCategories, sortBy]);
}
