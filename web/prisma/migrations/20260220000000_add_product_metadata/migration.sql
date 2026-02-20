-- Add brand, weight, and tags columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(8,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index on brand for filtered queries
CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand) WHERE brand IS NOT NULL;

-- Update search_vector to include brand (A) and tags (B)
UPDATE products SET search_vector =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(brand, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(short_desc, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(sku, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'B');

-- Update trigger to include brand + tags in search_vector
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_desc, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.sku, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to fire on brand/tags changes too
DROP TRIGGER IF EXISTS trg_products_search_vector ON products;

CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name, short_desc, sku, brand, tags
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_search_vector_update();
