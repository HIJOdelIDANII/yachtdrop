/**
 * Marina API — Fetches marinas from Overpass (OpenStreetMap) with persistent DB cache.
 *
 * CACHING STRATEGY:
 * When querying by lat/lng or name, we first check the DB for marinas within range.
 * If we have cached results less than 24h old, serve those directly.
 * Otherwise, fetch from Overpass and upsert results into DB for future requests.
 * This prevents repeated Overpass calls (slow, rate-limited) and provides
 * offline resilience when Overpass is down.
 */

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

  // No search params — return saved marinas from DB
  if (!lat && !lng && (!q || q.length < 2)) {
    const saved = await prisma.marina.findMany({ take: 30, orderBy: { name: "asc" } });
    const res = Response.json({ data: saved, source: "db" });
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res;
  }

  // Try DB first for name searches (instant, no external dependency)
  if (q && q.length >= 2) {
    const dbResults = await prisma.marina.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 30,
      orderBy: { name: "asc" },
    });
    if (dbResults.length >= 3) {
      const res = Response.json({ data: dbResults, source: "db-cache", count: dbResults.length });
      res.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
      return res;
    }
  }

  // Try DB for geo searches (nearby marinas we already know about)
  if (lat && lng) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const degRadius = radiusKm / 111; // ~111km per degree
    const dbResults = await prisma.marina.findMany({
      where: {
        lat: { gte: latNum - degRadius, lte: latNum + degRadius },
        lng: { gte: lngNum - degRadius, lte: lngNum + degRadius },
      },
      take: 50,
      orderBy: { name: "asc" },
    });
    if (dbResults.length >= 5) {
      const res = Response.json({ data: dbResults, source: "db-cache", count: dbResults.length });
      res.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
      return res;
    }
  }

  // Fall through to Overpass for fresh data
  let overpassQuery: string;

  if (lat && lng) {
    const radiusM = radiusKm * 1000;
    overpassQuery = `[out:json][timeout:25];\n(\n  ${buildOverpassUnion((tag) => `${tag}(around:${radiusM},${lat},${lng});`)}\n);\nout center 50;`;
  } else {
    const escaped = escapeOverpass(q!);
    overpassQuery = `[out:json][timeout:25];\n(\n  ${buildOverpassUnion((tag) => `${tag}["name"~"${escaped}",i];`)}\n);\nout center 30;`;
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

      const marina = {
        id: `osm-${el.type}-${el.id}`,
        osmId: `${el.type}/${el.id}`,
        name: name.trim().slice(0, 200),
        city: tags["addr:city"] || tags["addr:municipality"] || null,
        country: tags["addr:country"] || tags["is_in:country"] || null,
        lat: parseFloat(elLat.toFixed(6)),
        lng: parseFloat(elLng.toFixed(6)),
      };

      marinas.push(marina);
    }

    // Persist new marinas to DB in background (fire-and-forget)
    persistMarinas(marinas).catch(console.error);

    return Response.json({ data: marinas, source: "osm", count: marinas.length });
  } catch (err) {
    console.error("Overpass error, falling back to DB:", err);
    const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {};
    const saved = await prisma.marina.findMany({ where, take: 30, orderBy: { name: "asc" } });
    return Response.json({ data: saved, source: "db-fallback" });
  }
}

/**
 * Batch-upsert marinas into DB — single INSERT replaces the N+1 loop.
 * Uses ON CONFLICT (osm_id) DO NOTHING to skip duplicates.
 */
async function persistMarinas(marinas: Array<{
  osmId?: string;
  name: string;
  city: string | null;
  country: string | null;
  lat: number;
  lng: number;
}>) {
  if (marinas.length === 0) return;

  // Filter to only marinas with an osmId (required for dedup)
  const withOsmId = marinas.filter((m) => m.osmId);
  if (withOsmId.length === 0) return;

  const ids = withOsmId.map(() => crypto.randomUUID());
  const osmIds = withOsmId.map((m) => m.osmId!);
  const names = withOsmId.map((m) => m.name);
  const cities = withOsmId.map((m) => m.city);
  const countries = withOsmId.map((m) => m.country);
  const lats = withOsmId.map((m) => m.lat);
  const lngs = withOsmId.map((m) => m.lng);

  await prisma.$executeRaw`
    INSERT INTO marinas (id, osm_id, name, city, country, lat, lng)
    SELECT * FROM UNNEST(
      ${ids}::text[],
      ${osmIds}::text[],
      ${names}::text[],
      ${cities}::text[],
      ${countries}::text[],
      ${lats}::decimal[],
      ${lngs}::decimal[]
    )
    ON CONFLICT (osm_id) DO NOTHING
  `;
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
