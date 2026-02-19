import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSearchInput } from "./useSearchInput";

describe("useSearchInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with empty query", () => {
    const { result } = renderHook(() => useSearchInput(150));
    expect(result.current.query).toBe("");
    expect(result.current.debouncedQuery).toBe("");
    expect(result.current.isActive).toBe(false);
    expect(result.current.isReady).toBe(false);
  });

  it("updates query immediately on setQuery", () => {
    const { result } = renderHook(() => useSearchInput(150));
    act(() => result.current.setQuery("led"));
    expect(result.current.query).toBe("led");
    // Debounced value not yet updated
    expect(result.current.debouncedQuery).toBe("");
  });

  it("debounces the query after the delay", () => {
    const { result } = renderHook(() => useSearchInput(150));
    act(() => result.current.setQuery("anchor"));
    act(() => vi.advanceTimersByTime(150));
    expect(result.current.debouncedQuery).toBe("anchor");
    expect(result.current.isReady).toBe(true);
  });

  it("resets debounce timer on rapid input", () => {
    const { result } = renderHook(() => useSearchInput(150));
    act(() => result.current.setQuery("a"));
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.setQuery("an"));
    act(() => vi.advanceTimersByTime(100));
    // Only 100ms since last input — should not have debounced yet
    expect(result.current.debouncedQuery).toBe("");
    act(() => vi.advanceTimersByTime(50));
    expect(result.current.debouncedQuery).toBe("an");
  });

  it("clears both query and debouncedQuery", () => {
    const { result } = renderHook(() => useSearchInput(150));
    act(() => result.current.setQuery("rope"));
    act(() => vi.advanceTimersByTime(150));
    expect(result.current.debouncedQuery).toBe("rope");

    act(() => result.current.clear());
    expect(result.current.query).toBe("");
    expect(result.current.debouncedQuery).toBe("");
    expect(result.current.isActive).toBe(false);
  });

  it("isReady requires at least 2 characters", () => {
    const { result } = renderHook(() => useSearchInput(150));
    act(() => result.current.setQuery("a"));
    act(() => vi.advanceTimersByTime(150));
    expect(result.current.isReady).toBe(false);

    act(() => result.current.setQuery("ab"));
    act(() => vi.advanceTimersByTime(150));
    expect(result.current.isReady).toBe(true);
  });

  it("respects custom delay", () => {
    const { result } = renderHook(() => useSearchInput(300));
    act(() => result.current.setQuery("test"));
    act(() => vi.advanceTimersByTime(150));
    expect(result.current.debouncedQuery).toBe("");
    act(() => vi.advanceTimersByTime(150));
    expect(result.current.debouncedQuery).toBe("test");
  });
});
