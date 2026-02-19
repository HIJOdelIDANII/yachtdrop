import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  mockProducts,
  mockMarinas,
  mockCategories,
  combinedResponse,
  emptyCombinedResponse,
} from "./fixtures";

export const handlers = [
  // Combined search endpoint
  http.get("/api/search/combined", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim();
    if (!q || q.length < 1) {
      return HttpResponse.json(emptyCombinedResponse);
    }
    const filtered = mockProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.description.toLowerCase().includes(q.toLowerCase())
    );
    const filteredMarinas = mockMarinas.filter((m) =>
      m.name.toLowerCase().includes(q.toLowerCase())
    );
    return HttpResponse.json(
      { products: filtered, marinas: filteredMarinas },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  }),

  // Legacy search endpoint
  http.get("/api/search", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim();
    if (!q) return HttpResponse.json({ data: [] });
    const filtered = mockProducts.filter((p) =>
      p.name.toLowerCase().includes(q.toLowerCase())
    );
    return HttpResponse.json({ data: filtered, engine: "fts" });
  }),

  // Marinas endpoint
  http.get("/api/marinas", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return HttpResponse.json({ data: mockMarinas, source: "db" });
    }
    const filtered = mockMarinas.filter((m) =>
      m.name.toLowerCase().includes(q.toLowerCase())
    );
    return HttpResponse.json({
      data: filtered,
      source: "db-cache",
      count: filtered.length,
    });
  }),

  // Categories endpoint
  http.get("/api/categories", () => {
    return HttpResponse.json({ data: mockCategories });
  }),
];

export const server = setupServer(...handlers);
