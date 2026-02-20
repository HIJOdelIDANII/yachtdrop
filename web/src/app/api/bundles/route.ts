import { prisma } from "@/lib/prisma";
import { BUNDLE_DEFINITIONS } from "@/lib/bundles/definitions";
import { NextResponse } from "next/server";

export async function GET() {
  const bundles = await Promise.all(
    BUNDLE_DEFINITIONS.map(async (def) => {
      const ilikeClauses = def.keywords.map(
        (kw) => `LOWER(name) LIKE LOWER('%${kw.replace(/'/g, "''")}%')`
      );

      let products: Array<Record<string, unknown>> = [];

      try {
        products = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
          `SELECT
            id, external_id AS "externalId", name, slug,
            short_desc AS "shortDesc",
            price::float, original_price::float AS "originalPrice",
            discount_percent AS "discountPercent", currency,
            stock_status AS "stockStatus", category_id AS "categoryId",
            images, thumbnail, available
          FROM products
          WHERE available = true
            AND price > 0
            AND (${ilikeClauses.join(" OR ")})
          ORDER BY price ASC
          LIMIT ${def.maxProducts}`
        );
      } catch {
        // Fallback to Prisma ORM
        const ormProducts = await prisma.product.findMany({
          where: {
            available: true,
            price: { gt: 0 },
            OR: def.keywords.map((kw) => ({
              name: { contains: kw, mode: "insensitive" as const },
            })),
          },
          take: def.maxProducts,
          orderBy: { price: "asc" },
        });
        products = ormProducts.map((p) => ({
          ...p,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        }));
      }

      const formattedProducts = products.map((p) => ({
        ...p,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        images: p.images || [],
      }));

      const totalPrice = formattedProducts.reduce(
        (sum, p) => sum + (p.price as number),
        0
      );

      return {
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        products: formattedProducts,
        totalPrice: Math.round(totalPrice * 100) / 100,
      };
    })
  );

  // Only return bundles that have products
  const populated = bundles.filter((b) => b.products.length > 0);

  const res = NextResponse.json({ data: populated });
  res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res;
}
