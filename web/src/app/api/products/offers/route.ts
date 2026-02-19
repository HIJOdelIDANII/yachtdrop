import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        available: true,
        discountPercent: { gt: 0 },
        thumbnail: { not: null },
        price: { gt: 0 },
      },
      orderBy: { discountPercent: "desc" },
      take: 12,
      include: { category: { select: { name: true } } },
    });

    const data = products.map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Offers error:", error);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}
