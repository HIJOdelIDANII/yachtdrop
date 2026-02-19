import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { orderRateLimiter } from "@/lib/rate-limit";
import { validateOrderInput } from "@/lib/validation";

export async function POST(request: NextRequest) {
  // Rate limit: 5 order creations per minute per IP
  const rateLimit = orderRateLimiter.check(request);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many requests. Please wait a moment.", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const body = await request.json();

  // Validate all input fields
  const errors = validateOrderInput(body);
  if (errors.length > 0) {
    return Response.json(
      { error: "Validation failed", code: "VALIDATION_ERROR", details: errors },
      { status: 400 }
    );
  }

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

  const deliveryFee = deliveryType === "DELIVERY" ? Number(process.env.NEXT_PUBLIC_DELIVERY_FEE ?? 5) : 0;

  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  // Verify all requested products exist
  if (products.length !== productIds.length) {
    const found = new Set(products.map((p) => p.id));
    const missing = productIds.filter((id: string) => !found.has(id));
    return Response.json(
      { error: `Products not found: ${missing.join(", ")}`, code: "PRODUCT_NOT_FOUND" },
      { status: 400 }
    );
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  let subtotal = 0;
  const orderItems = items.map(
    (item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId)!;
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
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
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

  return Response.json(
    { data: order },
    {
      status: 201,
      headers: { "X-RateLimit-Remaining": String(rateLimit.remaining) },
    }
  );
}
