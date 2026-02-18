import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { productCount: { gt: 0 } },
    orderBy: { displayOrder: "asc" },
  });

  return Response.json({
    data: categories.map((c) => ({
      ...c,
      productCount: Number(c.productCount),
    })),
  });
}
