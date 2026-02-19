/**
 * Batch orders API — fetches multiple orders in a single DB query.
 *
 * Fixes the N+1 problem on the orders page where each order ID
 * triggered a separate API call. Now the client sends all IDs at once
 * and gets all orders back in one round trip.
 */
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return Response.json({ data: [] });
  }

  // Cap at 20 most recent orders to prevent abuse
  const ids = idsParam.split(",").slice(0, 20);
  if (ids.length === 0) {
    return Response.json({ data: [] });
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: ids } },
    include: {
      items: { include: { product: { select: { name: true, thumbnail: true } } } },
      events: { orderBy: { createdAt: "asc" } },
      marina: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    data: orders.map((order) => ({
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
    })),
  });
}
