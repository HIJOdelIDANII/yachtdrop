import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useCombinedSearch } from "./useCombinedSearch";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { mockProducts, mockMarinas } from "@/test/mocks/fixtures";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useCombinedSearch", () => {
  it("returns empty arrays for empty query", () => {
    const { result } = renderHook(() => useCombinedSearch(""), {
      wrapper: createWrapper(),
    });
    expect(result.current.products).toEqual([]);
    expect(result.current.marinas).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches products and marinas for a valid query", async () => {
    const { result } = renderHook(() => useCombinedSearch("led"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.products.length).toBeGreaterThan(0);
    expect(result.current.products[0].name).toContain("LED");
  });

  it("returns marinas matching query", async () => {
    const { result } = renderHook(() => useCombinedSearch("port"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.marinas.length).toBeGreaterThan(0);
    expect(
      result.current.marinas.some((m) =>
        m.name.toLowerCase().includes("port")
      )
    ).toBe(true);
  });

  it("handles server errors gracefully", async () => {
    server.use(
      http.get("/api/search/combined", () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useCombinedSearch("test"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it("does not fetch when query is empty string", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    renderHook(() => useCombinedSearch(""), {
      wrapper: createWrapper(),
    });

    // Wait a tick to ensure no fetch was made
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/search/combined")
    );
    fetchSpy.mockRestore();
  });

  it("caches results (staleTime)", async () => {
    const wrapper = createWrapper();
    const { result, rerender } = renderHook(
      ({ q }) => useCombinedSearch(q),
      { wrapper, initialProps: { q: "anchor" } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstProducts = result.current.products;

    // Re-render with same query — should use cache
    rerender({ q: "anchor" });
    expect(result.current.products).toBe(firstProducts);
  });
});
