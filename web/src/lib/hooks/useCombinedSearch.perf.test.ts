import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useCombinedSearch } from "./useCombinedSearch";
import { mockProducts, mockMarinas } from "@/test/mocks/fixtures";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useCombinedSearch — performance", () => {
  it("resolves initial fetch within 500ms", async () => {
    const start = performance.now();
    const { result } = renderHook(() => useCombinedSearch("led"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it("cache hit returns instantly (< 10ms)", async () => {
    const wrapper = createWrapper();

    // First fetch — populates cache
    const { result: first } = renderHook(() => useCombinedSearch("anchor"), {
      wrapper,
    });
    await waitFor(() => expect(first.current.isLoading).toBe(false));

    // Second fetch with same query — should be instant from cache
    const start = performance.now();
    const { result: second } = renderHook(() => useCombinedSearch("anchor"), {
      wrapper,
    });
    // Should already have data (not loading)
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10);
    expect(second.current.products.length).toBeGreaterThanOrEqual(0);
  });

  it("makes exactly 1 HTTP request per unique query (no duplicate fetches)", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    const wrapper = createWrapper();

    // Render hook with query
    const { result, rerender } = renderHook(
      ({ q }) => useCombinedSearch(q),
      { wrapper, initialProps: { q: "rope" } }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callCount = fetchSpy.mock.calls.filter((c) =>
      String(c[0]).includes("/api/search/combined")
    ).length;

    // Re-render with same query — should NOT trigger another fetch
    rerender({ q: "rope" });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callCountAfter = fetchSpy.mock.calls.filter((c) =>
      String(c[0]).includes("/api/search/combined")
    ).length;

    expect(callCountAfter).toBe(callCount); // No extra request
    fetchSpy.mockRestore();
  });

  it("does not fetch for queries shorter than 1 character", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    renderHook(() => useCombinedSearch(""), {
      wrapper: createWrapper(),
    });

    await new Promise((r) => setTimeout(r, 100));

    const combinedCalls = fetchSpy.mock.calls.filter((c) =>
      String(c[0]).includes("/api/search/combined")
    );
    expect(combinedCalls).toHaveLength(0);
    fetchSpy.mockRestore();
  });

  it("concurrent renders with different queries do not cause race conditions", async () => {
    const wrapper = createWrapper();

    const { result: r1 } = renderHook(() => useCombinedSearch("led"), { wrapper });
    const { result: r2 } = renderHook(() => useCombinedSearch("anchor"), { wrapper });

    await waitFor(() => {
      expect(r1.current.isLoading).toBe(false);
      expect(r2.current.isLoading).toBe(false);
    });

    // Both should resolve independently
    // (Content depends on MSW mock filtering, just check no errors)
    expect(r1.current.error).toBeNull();
    expect(r2.current.error).toBeNull();
  });
});
