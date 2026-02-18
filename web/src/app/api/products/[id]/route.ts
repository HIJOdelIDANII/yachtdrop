import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) {
    return Response.json(
      { error: "Product not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return Response.json({
    data: {
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice
        ? Number(product.originalPrice)
        : null,
    },
  });
}
