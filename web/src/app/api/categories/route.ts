import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => {
      if (w === "&" || w === "-") return w;
      if (w.length <= 2) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { productCount: { gt: 0 } },
    orderBy: { productCount: "desc" },
  });

  const res = NextResponse.json({
    data: categories.map((c) => ({
      ...c,
      name: titleCase(c.name),
      productCount: Number(c.productCount),
    })),
  });
  res.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  );
  return res;
}
