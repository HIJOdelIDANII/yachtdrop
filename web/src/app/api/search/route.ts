import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const limit = Math.min(20, Number(request.nextUrl.searchParams.get("limit") ?? 10));

  if (!q) {
    return Response.json({ data: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      available: true,
      name: { contains: q, mode: "insensitive" },
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  return Response.json({
    data: products.map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    })),
  });
}
