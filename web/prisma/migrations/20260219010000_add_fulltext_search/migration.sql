-- PostgreSQL Full-Text Search setup for instant product search.
--
-- WHY tsvector/tsquery over ILIKE or pg_trgm:
-- - Tokenizes words properly ("LED Navigation Light" → 3 searchable tokens)
-- - Language-aware stemming ("anchors" matches "anchor", "lights" matches "light")
-- - Prefix matching ("anch:*" matches "anchor") — perfect for as-you-type search
-- - ts_rank gives relevance scoring out of the box
-- - GIN index makes it O(log n) even on 100k+ rows
--
-- The search_vector column is a generated tsvector combining name (weight A),
-- short_desc (weight B), and sku (weight A). Weight A ranks higher than B,
-- so name/SKU matches surface above description matches.

-- Add the tsvector column
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate it for existing rows: name (A) + short_desc (B) + sku (A)
UPDATE products SET search_vector =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(short_desc, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(sku, '')), 'A');

-- GIN index on the tsvector column — this is what makes search fast
CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING gin (search_vector);

-- Trigger function to auto-update search_vector on INSERT or UPDATE.
-- This keeps the index in sync without any application-level code.
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_desc, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.sku, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop if exists to make migration idempotent
DROP TRIGGER IF EXISTS trg_products_search_vector ON products;

CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name, short_desc, sku
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_search_vector_update();
