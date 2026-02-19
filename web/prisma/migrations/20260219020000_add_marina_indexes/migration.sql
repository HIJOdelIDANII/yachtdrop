-- Enable pg_trgm extension for fuzzy/similarity search on marina names
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add osm_id column for deduplication of OpenStreetMap marinas
ALTER TABLE "marinas" ADD COLUMN "osm_id" TEXT;
ALTER TABLE "marinas" ADD CONSTRAINT "marinas_osm_id_key" UNIQUE ("osm_id");

-- GIN trigram index on marina name — powers similarity() and ILIKE searches
CREATE INDEX "marinas_name_trgm_idx" ON "marinas" USING GIN ("name" gin_trgm_ops);

-- B-tree composite index on (lat, lng) — speeds up geo bounding-box queries
CREATE INDEX "marinas_lat_lng_idx" ON "marinas" ("lat", "lng");
