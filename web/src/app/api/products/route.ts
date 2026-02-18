import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const where: Record<string, unknown> = { available: true };
  if (category) {
    where.categoryId = category;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: page * limit,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.product.count({ where }),
  ]);

  return Response.json({
    data: products.map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    })),
    meta: {
      page,
      limit,
      total,
      hasMore: (page + 1) * limit < total,
    },
  });
}
