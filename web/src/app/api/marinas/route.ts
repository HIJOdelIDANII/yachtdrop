import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const MARINA_TAGS = [
  '["leisure"="marina"]',
  '["seamark:type"="harbour"]',
  '["seamark:type"="marina"]',
  '["leisure"="yacht_club"]',
  '["harbour"="yes"]',
];

function buildOverpassUnion(selector: (tag: string) => string) {
  return MARINA_TAGS.flatMap((tag) => [`node${selector(tag)}`, `way${selector(tag)}`]).join("\n  ");
}

function escapeOverpass(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\\\$&");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const q = searchParams.get("q")?.trim();
  const radiusKm = Math.min(100, Math.max(5, Number(searchParams.get("r") ?? 30)));

  let overpassQuery: string;

  if (lat && lng) {
    const radiusM = radiusKm * 1000;
    overpassQuery = `[out:json][timeout:25];\n(\n  ${buildOverpassUnion((tag) => `${tag}(around:${radiusM},${lat},${lng});`)}\n);\nout center 50;`;
  } else if (q && q.length >= 2) {
    const escaped = escapeOverpass(q);
    overpassQuery = `[out:json][timeout:25];\n(\n  ${buildOverpassUnion((tag) => `${tag}["name"~"${escaped}",i];`)}\n);\nout center 30;`;
  } else {
    const saved = await prisma.marina.findMany({ take: 20, orderBy: { name: "asc" } });
    return Response.json({ data: saved, source: "db" });
  }

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) throw new Error(`Overpass ${res.status}`);

    const json = await res.json();
    const seen = new Set<string>();
    const marinas = [];

    for (const el of (json.elements || [])) {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) continue;

      const tags = el.tags || {};
      const name = tags.name || tags["name:en"] || tags["name:fr"] || tags["name:es"] || tags["name:ar"] || tags["seamark:name"];
      if (!name) continue;

      const key = `${name.toLowerCase().trim()}-${elLat.toFixed(3)}-${elLng.toFixed(3)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      marinas.push({
        id: `osm-${el.type}-${el.id}`,
        osmId: `${el.type}/${el.id}`,
        name: name.trim().slice(0, 200),
        city: tags["addr:city"] || tags["addr:municipality"] || null,
        country: tags["addr:country"] || tags["is_in:country"] || null,
        lat: parseFloat(elLat.toFixed(6)),
        lng: parseFloat(elLng.toFixed(6)),
      });
    }

    return Response.json({ data: marinas, source: "osm", count: marinas.length });
  } catch (err) {
    console.error("Overpass error, falling back to DB:", err);
    const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {};
    const saved = await prisma.marina.findMany({ where, take: 20, orderBy: { name: "asc" } });
    return Response.json({ data: saved, source: "db-fallback" });
  }
}

export async function POST(request: NextRequest) {
  const { name, city, country, lat, lng } = await request.json();

  if (!name || lat == null || lng == null) {
    return Response.json({ error: "name, lat, and lng are required" }, { status: 400 });
  }

  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM marinas
    WHERE LOWER(name) = LOWER(${name})
      AND ABS(CAST(lat AS FLOAT) - ${lat}) < 0.001
      AND ABS(CAST(lng AS FLOAT) - ${lng}) < 0.001
    LIMIT 1
  `;

  if (existing.length > 0) {
    return Response.json({ data: { id: existing[0].id, name, city, country, lat, lng } });
  }

  const marina = await prisma.marina.create({
    data: { name: name.trim(), city: city || null, country: country || null, lat, lng },
  });

  return Response.json({ data: marina }, { status: 201 });
}
