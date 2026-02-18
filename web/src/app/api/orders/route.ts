import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    deliveryType,
    marinaId,
    berthNumber,
    contactName,
    contactPhone,
    contactEmail,
    items,
    notes,
  } = body;

  if (!deliveryType || !contactName || !contactPhone || !contactEmail || !items?.length) {
    return Response.json(
      { error: "Missing required fields", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const deliveryFee = deliveryType === "DELIVERY" ? 5.0 : 0;

  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  let subtotal = 0;
  const orderItems = items.map(
    (item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      const unitPrice = Number(product.price);
      const total = unitPrice * item.quantity;
      subtotal += total;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        total,
      };
    }
  );

  const order = await prisma.order.create({
    data: {
      deliveryType,
      marinaId: marinaId || null,
      berthNumber: berthNumber || null,
      contactName,
      contactPhone,
      contactEmail,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      notes: notes || null,
      estimatedTime: "45-60 min",
      items: { create: orderItems },
      events: {
        create: { status: "PENDING", message: "Order placed" },
      },
    },
    include: { items: true, events: true },
  });

  return Response.json({ data: order }, { status: 201 });
}
