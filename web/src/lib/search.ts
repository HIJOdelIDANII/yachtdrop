/**
 * Search & retrieval module for YachtDrop.
 *
 * Provides:
 * - getCatalogContext() — cached catalog summary for AI planner prompts
 * - ftsSearch() — PostgreSQL full-text search with AND→OR fallback
 * - retrieve() — multi-query search with dedup and relevance ranking
 * - getCategoryName() — cached category ID → name resolver
 *
 * FTS uses PostgreSQL tsvector/tsquery via raw SQL (Prisma has no tsvector support).
 * search_vector column is maintained by a DB trigger on INSERT/UPDATE.
 */
import { prisma } from "@/lib/prisma";

// ── Catalog context cache ──────────────────────────────────────────
// Builds a text summary of all categories with price ranges and sample
// products. Used as context in the AI planner prompt so it knows what
// categories and products exist. Cached for 10 minutes in-memory.

let catalogContext: { text: string; ts: number } | null = null;
const CATALOG_TTL = 10 * 60 * 1000;

export async function getCatalogContext(): Promise<string> {
  if (catalogContext && Date.now() - catalogContext.ts < CATALOG_TTL) {
    return catalogContext.text;
  }

  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true, productCount: true },
  });

  const summaries = await Promise.all(
    categories.map(async (cat) => {
      const [priceRange, topProducts] = await Promise.all([
        prisma.$queryRaw<Array<{ min: number; max: number }>>`
          SELECT MIN(price)::float AS min, MAX(price)::float AS max
          FROM products
          WHERE category_id = ${cat.id} AND available = true AND price > 0
        `.then((r) => r[0] || { min: 0, max: 0 }),
        prisma.product.findMany({
          where: { categoryId: cat.id, available: true, price: { gt: 0 } },
          select: { name: true, brand: true },
          take: 5,
          orderBy: { name: "asc" },
        }),
      ]);

      const names = topProducts.map((p) => p.brand ? `${p.name} (${p.brand})` : p.name).join(", ");
      return `- ${cat.name} (${cat.productCount} items, €${priceRange.min?.toFixed(0) ?? "?"}-€${priceRange.max?.toFixed(0) ?? "?"}): ${names}`;
    })
  );

  const totalProducts = categories.reduce((s, c) => s + c.productCount, 0);
  const text = `YachtDrop marine supplies catalog — ${totalProducts} products across ${categories.length} categories:\n${summaries.join("\n")}`;

  catalogContext = { text, ts: Date.now() };
  return text;
}

// ── FTS query builder ─────────────────────────────────────────────
// Converts text into a PostgreSQL tsquery string.
// Each word gets :* suffix for prefix matching ("anchor" → "anchor:*").
// Operator controls AND (&) vs OR (|) between terms.

export function buildTsquery(text: string, operator: "&" | "|" = "&"): string {
  return text
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => `${w}:*`)
    .join(` ${operator} `);
}

// Normalizes raw SQL rows: Decimal→number, null images→empty array
export function formatRows(rows: Array<Record<string, unknown>>) {
  return rows.map((row) => ({
    ...row,
    price: Number(row.price),
    originalPrice: row.originalPrice ? Number(row.originalPrice) : null,
    images: row.images || [],
  }));
}

/**
 * Full-text search with graceful degradation:
 * 1. Try AND query (all words must match) — highest precision
 * 2. If AND returns nothing and query has multiple words, try OR — broader recall
 * 3. If FTS throws (e.g. invalid tsquery), fall back to ILIKE on name
 */
export async function ftsSearch(
  q: string,
  limit: number
): Promise<Array<Record<string, unknown>>> {
  const tsqueryAnd = buildTsquery(q, "&");
  if (!tsqueryAnd) return [];

  try {
    let rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        id, external_id AS "externalId", sku, name, slug,
        description, short_desc AS "shortDesc",
        price::float, original_price::float AS "originalPrice",
        discount_percent AS "discountPercent", currency,
        stock_status AS "stockStatus", category_id AS "categoryId",
        images, thumbnail, available, brand
      FROM products
      WHERE available = true AND price > 0
        AND search_vector @@ to_tsquery('english', ${tsqueryAnd})
      ORDER BY ts_rank(search_vector, to_tsquery('english', ${tsqueryAnd})) DESC
      LIMIT ${limit}
    `;

    // AND returned nothing + multi-word query → broaden with OR
    if (rows.length === 0 && q.trim().includes(" ")) {
      const tsqueryOr = buildTsquery(q, "|");
      rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
        SELECT
          id, external_id AS "externalId", sku, name, slug,
          description, short_desc AS "shortDesc",
          price::float, original_price::float AS "originalPrice",
          discount_percent AS "discountPercent", currency,
          stock_status AS "stockStatus", category_id AS "categoryId",
          images, thumbnail, available, brand
        FROM products
        WHERE available = true AND price > 0
          AND search_vector @@ to_tsquery('english', ${tsqueryOr})
        ORDER BY ts_rank(search_vector, to_tsquery('english', ${tsqueryOr})) DESC
        LIMIT ${limit}
      `;
    }

    return formatRows(rows);
  } catch {
    // FTS failed (bad tsquery syntax, etc.) → ILIKE fallback
    const products = await prisma.product.findMany({
      where: {
        available: true,
        price: { gt: 0 },
        name: { contains: q, mode: "insensitive" },
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

/**
 * Multi-query retrieval with deduplication and relevance ranking.
 *
 * Takes a search plan (from the AI planner) and executes:
 * 1. FTS search for each query phrase (first query gets full limit for priority)
 * 2. Category-based Prisma query if categories specified
 * 3. Deduplicates by product ID
 * 4. Ranks by hit count: products appearing in multiple query results score higher
 * 5. Applies price filter if priceMax specified
 */
export async function retrieve(
  plan: { queries: string[]; categories: string[]; priceMax: number | null },
  limit: number
): Promise<Array<Record<string, unknown>>> {
  const queries = plan.queries.slice(0, 6);

  const [ftsResults, catResult] = await Promise.all([
    // First query = most specific phrase → gets full limit of result slots
    // Subsequent queries get fewer slots to avoid diluting results
    Promise.allSettled(
      queries.map((q, i) => ftsSearch(q, i === 0 ? limit : Math.ceil(limit / queries.length) + 2))
    ),
    plan.categories.length > 0
      ? prisma.product
          .findMany({
            where: {
              available: true,
              price: { gt: 0 },
              category: { name: { in: plan.categories } },
            },
            take: limit,
            orderBy: { name: "asc" },
          })
          .catch(() => [] as Array<Record<string, unknown>>)
      : Promise.resolve([] as Array<Record<string, unknown>>),
  ]);

  // Deduplicate and count how many queries each product matched
  const deduped = new Map<string, Record<string, unknown>>();
  const hitCount = new Map<string, number>();

  for (const r of ftsResults) {
    if (r.status === "fulfilled") {
      for (const row of r.value) {
        const id = row.id as string;
        hitCount.set(id, (hitCount.get(id) || 0) + 1);
        if (!deduped.has(id)) deduped.set(id, row);
      }
    }
  }

  for (const p of catResult) {
    const row = p as Record<string, unknown>;
    const id = (row.id as string) || "";
    if (id && !deduped.has(id)) {
      deduped.set(id, {
        ...row,
        price: Number(row.price),
        originalPrice: row.originalPrice ? Number(row.originalPrice) : null,
      });
    }
  }

  // Products matching more queries rank higher (multi-hit boost)
  let products = Array.from(deduped.values()).sort((a, b) => {
    const hitsA = hitCount.get(a.id as string) || 0;
    const hitsB = hitCount.get(b.id as string) || 0;
    return hitsB - hitsA;
  });

  if (plan.priceMax) {
    const max = plan.priceMax;
    products = products.filter((p) => (p.price as number) <= max);
  }

  return products.slice(0, limit);
}

// ── Category name resolver (cached in-memory) ────────────────────

let categoryMap: Map<string, string> | null = null;

export async function getCategoryName(categoryId: string): Promise<string> {
  if (!categoryMap) {
    try {
      const cats = await prisma.category.findMany({
        select: { id: true, name: true },
      });
      categoryMap = new Map(cats.map((c) => [c.id, c.name]));
    } catch {
      categoryMap = new Map();
    }
  }
  return categoryMap.get(categoryId) || "General";
}
