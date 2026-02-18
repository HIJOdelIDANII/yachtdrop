import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  const where = q
    ? { name: { contains: q, mode: "insensitive" as const } }
    : {};

  const marinas = await prisma.marina.findMany({
    where,
    take: 20,
    orderBy: { name: "asc" },
  });

  return Response.json({ data: marinas });
}
