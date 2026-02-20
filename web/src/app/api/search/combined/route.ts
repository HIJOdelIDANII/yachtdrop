/**
 * Combined Search API — returns products + marinas in a single response.
 *
 * Eliminates the double round-trip where the client fetches /api/search
 * and /api/marinas separately. Runs both queries in parallel via
 * Promise.allSettled so a marina failure never blocks product results.
 *
 * Cache: public, s-maxage=60, stale-while-revalidate=300
 */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const limit = Math.min(
    30,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 20))
  );

  if (!q || q.length < 1) {
    return NextResponse.json({ products: [], marinas: [] });
  }

  // Build tsquery for FTS: "led nav" → "led:* & nav:*"
  const tsquery = q
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => `${w}:*`)
    .join(" & ");

  if (!tsquery) {
    return NextResponse.json({ products: [], marinas: [] });
  }

  const [productsResult, marinasResult] = await Promise.allSettled([
    searchProducts(tsquery, q, limit),
    searchMarinas(q),
  ]);

  const products =
    productsResult.status === "fulfilled" ? productsResult.value : [];
  const marinas =
    marinasResult.status === "fulfilled" ? marinasResult.value : [];

  if (productsResult.status === "rejected") {
    console.error("Combined search — product query failed:", productsResult.reason);
  }
  if (marinasResult.status === "rejected") {
    console.error("Combined search — marina query failed:", marinasResult.reason);
  }

  const res = NextResponse.json({ products, marinas });
  res.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  );
  return res;
}

// ── Product search (FTS → trgm fallback → ILIKE fallback) ──────────

async function searchProducts(
  tsquery: string,
  rawQuery: string,
  limit: number
) {
  try {
    // Phase 1: Full-text search
    const fts = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        id, external_id AS "externalId", sku, name, slug,
        description, short_desc AS "shortDesc",
        price::float, original_price::float AS "originalPrice",
        discount_percent AS "discountPercent", currency,
        stock_status AS "stockStatus", category_id AS "categoryId",
        images, thumbnail, available, brand
      FROM products
      WHERE available = true
        AND price > 0
        AND search_vector @@ to_tsquery('english', ${tsquery})
      ORDER BY ts_rank(search_vector, to_tsquery('english', ${tsquery})) DESC, name ASC
      LIMIT ${limit}
    `;

    if (fts.length > 0) return formatProducts(fts);

    // Phase 2: Trigram fuzzy fallback
    const trgm = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        id, external_id AS "externalId", sku, name, slug,
        description, short_desc AS "shortDesc",
        price::float, original_price::float AS "originalPrice",
        discount_percent AS "discountPercent", currency,
        stock_status AS "stockStatus", category_id AS "categoryId",
        images, thumbnail, available, brand
      FROM products
      WHERE available = true
        AND price > 0
        AND (
          similarity(name, ${rawQuery}) > 0.08
          OR LOWER(name) LIKE LOWER(${"%" + rawQuery + "%"})
        )
      ORDER BY similarity(name, ${rawQuery}) DESC, name ASC
      LIMIT ${limit}
    `;

    return formatProducts(trgm);
  } catch {
    // Phase 3: ILIKE fallback (no extensions needed)
    const products = await prisma.product.findMany({
      where: {
        available: true,
        price: { gt: 0 },
        OR: [
          { name: { contains: rawQuery, mode: "insensitive" } },
          { sku: { contains: rawQuery, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { name: "asc" },
    });
    return products.map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    }));
  }
}

// ── Marina search (DB-only, no Overpass) ────────────────────────────

async function searchMarinas(q: string) {
  if (q.length < 2) return [];

  try {
    // Use trgm similarity when the extension/index is available
    const marinas = await prisma.$queryRaw<
      Array<{
        id: string;
        osm_id: string | null;
        name: string;
        city: string | null;
        country: string | null;
        lat: number | null;
        lng: number | null;
      }>
    >`
      SELECT id, osm_id, name, city, country, lat::float, lng::float
      FROM marinas
      WHERE similarity(name, ${q}) > 0.1
         OR LOWER(name) LIKE LOWER(${"%" + q + "%"})
      ORDER BY similarity(name, ${q}) DESC, name ASC
      LIMIT 10
    `;
    return marinas.map((m) => ({
      id: m.id,
      osmId: m.osm_id,
      name: m.name,
      city: m.city,
      country: m.country,
      lat: m.lat,
      lng: m.lng,
    }));
  } catch {
    // Fallback if trgm not available
    const marinas = await prisma.marina.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 10,
      orderBy: { name: "asc" },
    });
    return marinas;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatProducts(rows: Array<Record<string, unknown>>) {
  return rows.map((p) => ({
    ...p,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    images: p.images || [],
  }));
}
