import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFilteredProducts } from "./useFilteredProducts";
import { mockProducts } from "@/test/mocks/fixtures";
import type { SortBy } from "@/store/filter.store";

// Mock zustand store
const mockStoreState: {
  minPrice: number;
  maxPrice: number;
  stockOnly: boolean;
  discountOnly: boolean;
  selectedCategories: string[];
  sortBy: SortBy;
} = {
  minPrice: 0,
  maxPrice: 10000,
  stockOnly: false,
  discountOnly: false,
  selectedCategories: [],
  sortBy: "relevance",
};

vi.mock("@/store/filter.store", () => ({
  useFilterStore: () => mockStoreState,
}));

describe("useFilteredProducts", () => {
  beforeEach(() => {
    mockStoreState.minPrice = 0;
    mockStoreState.maxPrice = 10000;
    mockStoreState.stockOnly = false;
    mockStoreState.discountOnly = false;
    mockStoreState.selectedCategories = [];
    mockStoreState.sortBy = "relevance";
  });

  it("returns empty array when products is undefined", () => {
    const { result } = renderHook(() => useFilteredProducts(undefined));
    expect(result.current).toEqual([]);
  });

  it("returns all products with no filters", () => {
    const { result } = renderHook(() => useFilteredProducts(mockProducts));
    expect(result.current).toHaveLength(mockProducts.length);
  });

  it("filters by price range", () => {
    mockStoreState.minPrice = 30;
    mockStoreState.maxPrice = 60;
    const { result } = renderHook(() => useFilteredProducts(mockProducts));
    expect(result.current.every((p) => p.price >= 30 && p.price <= 60)).toBe(true);
    expect(result.current.length).toBeGreaterThan(0);
  });

  it("filters by category", () => {
    mockStoreState.selectedCategories = ["cat-1"];
    const { result } = renderHook(() => useFilteredProducts(mockProducts));
    expect(result.current.every((p) => p.categoryId === "cat-1")).toBe(true);
  });

  it("filters discount-only products", () => {
    mockStoreState.discountOnly = true;
    const { result } = renderHook(() => useFilteredProducts(mockProducts));
    expect(
      result.current.every((p) => p.discountPercent && p.discountPercent > 0)
    ).toBe(true);
  });

  it("sorts by price ascending", () => {
    mockStoreState.sortBy = "price-asc";
    const { result } = renderHook(() => useFilteredProducts(mockProducts));
    for (let i = 1; i < result.current.length; i++) {
      expect(result.current[i].price).toBeGreaterThanOrEqual(
        result.current[i - 1].price
      );
    }
  });

  it("sorts by price descending", () => {
    mockStoreState.sortBy = "price-desc";
    const { result } = renderHook(() => useFilteredProducts(mockProducts));
    for (let i = 1; i < result.current.length; i++) {
      expect(result.current[i].price).toBeLessThanOrEqual(
        result.current[i - 1].price
      );
    }
  });

  it("combines multiple filters", () => {
    mockStoreState.minPrice = 20;
    mockStoreState.maxPrice = 100;
    mockStoreState.discountOnly = true;
    const { result } = renderHook(() => useFilteredProducts(mockProducts));
    expect(
      result.current.every(
        (p) =>
          p.price >= 20 &&
          p.price <= 100 &&
          p.discountPercent != null &&
          p.discountPercent > 0
      )
    ).toBe(true);
  });
});
