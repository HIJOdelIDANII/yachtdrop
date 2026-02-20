import { prisma } from "@/lib/prisma";
import { aiComplete } from "@/lib/ai";
import { NextResponse } from "next/server";
import { isDev } from "@/lib/env";

export async function GET() {
  if (!isDev) {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
  }

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const sampleProducts = await prisma.product.findMany({
    where: { available: true, price: { gt: 0 } },
    select: { name: true, shortDesc: true },
    take: 50,
    orderBy: { name: "asc" },
  });

  const prompt = `Given these marine supply categories: ${categories.map((c) => c.name).join(", ")}

And sample products: ${sampleProducts.map((p) => p.name).join(", ")}

Generate 5 themed bundle kits for yacht/boat crew. For each bundle return JSON:
{ "id": "slug", "name": "Bundle Name", "description": "Short desc", "icon": "emoji", "keywords": ["keyword1", "keyword2", ...], "maxProducts": 6 }

Return ONLY a JSON array, no explanation.`;

  const result = await aiComplete({
    system: "You are a marine supply expert. Return only valid JSON.",
    user: prompt,
    maxTokens: 800,
    temperature: 0.5,
  });

  return NextResponse.json({ raw: result, categories, sampleCount: sampleProducts.length });
}
