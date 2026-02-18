import { create } from "zustand";

export type SortBy = "relevance" | "price-asc" | "price-desc" | "availability";

interface FilterState {
  minPrice: number;
  maxPrice: number;
  stockOnly: boolean;
  discountOnly: boolean;
  selectedCategories: string[];
  sortBy: SortBy;
  
  setMinPrice: (price: number) => void;
  setMaxPrice: (price: number) => void;
  setStockOnly: (value: boolean) => void;
  setDiscountOnly: (value: boolean) => void;
  toggleCategory: (categoryId: string) => void;
  setSortBy: (sort: SortBy) => void;
  resetFilters: () => void;
}

const DEFAULTS = {
  minPrice: 0,
  maxPrice: 10000,
  stockOnly: false,
  discountOnly: false,
  selectedCategories: [] as string[],
  sortBy: "relevance" as const,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...DEFAULTS,
  
  setMinPrice: (minPrice) => set({ minPrice }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  setStockOnly: (stockOnly) => set({ stockOnly }),
  setDiscountOnly: (discountOnly) => set({ discountOnly }),
  toggleCategory: (categoryId) => set((state) => ({
    selectedCategories: state.selectedCategories.includes(categoryId)
      ? state.selectedCategories.filter((id) => id !== categoryId)
      : [...state.selectedCategories, categoryId],
  })),
  setSortBy: (sortBy) => set({ sortBy }),
  resetFilters: () => set(DEFAULTS),
}));
