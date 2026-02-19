import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// Mock prisma
const mockQueryRaw = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
    product: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    marina: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

function makeRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/search/combined", () => {
  beforeEach(() => {
    mockQueryRaw.mockReset();
    mockFindMany.mockReset();
  });

  it("returns empty arrays for empty query", async () => {
    const res = await GET(makeRequest("/api/search/combined"));
    const json = await res.json();
    expect(json.products).toEqual([]);
    expect(json.marinas).toEqual([]);
  });

  it("returns empty arrays for whitespace-only query", async () => {
    const res = await GET(makeRequest("/api/search/combined?q=   "));
    const json = await res.json();
    expect(json.products).toEqual([]);
    expect(json.marinas).toEqual([]);
  });

  it("returns products and marinas for valid query", async () => {
    const mockProduct = {
      id: "p1",
      externalId: null,
      sku: null,
      name: "LED Light",
      slug: "led-light",
      description: null,
      shortDesc: null,
      price: 29.99,
      originalPrice: null,
      discountPercent: null,
      currency: "EUR",
      stockStatus: "IN_STOCK",
      categoryId: null,
      images: [],
      thumbnail: null,
      available: true,
    };

    const mockMarina = {
      id: "m1",
      osm_id: "node/123",
      name: "Port LED Marina",
      city: "Test City",
      country: "ES",
      lat: 39.5,
      lng: 2.5,
    };

    // First call = product FTS, second call = marina search
    mockQueryRaw
      .mockResolvedValueOnce([mockProduct])
      .mockResolvedValueOnce([mockMarina]);

    const res = await GET(makeRequest("/api/search/combined?q=led"));
    const json = await res.json();

    expect(json.products).toHaveLength(1);
    expect(json.products[0].name).toBe("LED Light");
    expect(json.marinas).toHaveLength(1);
    expect(json.marinas[0].name).toBe("Port LED Marina");
  });

  it("sets Cache-Control header", async () => {
    mockQueryRaw.mockResolvedValue([]);
    mockFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest("/api/search/combined?q=test"));
    expect(res.headers.get("Cache-Control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=300"
    );
  });

  it("respects limit parameter", async () => {
    const products = Array.from({ length: 5 }, (_, i) => ({
      id: `p${i}`,
      name: `Product ${i}`,
      price: 10 * i,
      originalPrice: null,
      images: [],
      available: true,
    }));
    mockQueryRaw.mockResolvedValueOnce(products).mockResolvedValueOnce([]);

    const res = await GET(makeRequest("/api/search/combined?q=product&limit=5"));
    const json = await res.json();
    expect(json.products.length).toBeLessThanOrEqual(5);
  });

  it("handles product search failure gracefully (still returns marinas)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Product query rejects, marina query succeeds
    mockQueryRaw
      .mockRejectedValueOnce(new Error("DB error"))
      .mockResolvedValueOnce([
        { id: "m1", osm_id: null, name: "Port Test", city: null, country: null, lat: 39.5, lng: 2.5 },
      ]);

    // Fallback findMany also fails (ILIKE fallback)
    mockFindMany.mockRejectedValueOnce(new Error("Also failed"));

    const res = await GET(makeRequest("/api/search/combined?q=test"));
    const json = await res.json();

    // Products failed but marinas should still work
    expect(json.marinas).toHaveLength(1);
    consoleSpy.mockRestore();
  });
});
