import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      events: { orderBy: { createdAt: "asc" } },
      marina: true,
    },
  });

  if (!order) {
    return Response.json(
      { error: "Order not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return Response.json({
    data: {
      ...order,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      items: order.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
        productName: i.product?.name ?? null,
        productThumbnail: i.product?.thumbnail ?? null,
      })),
    },
  });
}
