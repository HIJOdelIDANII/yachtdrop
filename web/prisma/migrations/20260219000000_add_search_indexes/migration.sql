-- Enable pg_trgm for fast trigram-based ILIKE searches on product names.
-- This turns O(n) sequential scans into indexed lookups for search queries.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram index on product name — powers the /api/search ILIKE query.
-- Without this, every search does a full table scan.
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING gin (name gin_trgm_ops);

-- B-tree index on category_id — speeds up category-filtered product listings.
CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON products (category_id);

-- Composite index for the most common product query pattern:
-- available products within a category, sorted by name.
CREATE INDEX IF NOT EXISTS idx_products_available_category
  ON products (available, category_id) WHERE available = true;

-- Index for trending products query (recently scraped, available, ordered by scraped_at).
CREATE INDEX IF NOT EXISTS idx_products_trending
  ON products (scraped_at DESC) WHERE available = true;

-- Index for offers query (available products sorted by discount).
CREATE INDEX IF NOT EXISTS idx_products_offers
  ON products (discount_percent DESC NULLS LAST) WHERE available = true AND discount_percent > 0;

-- Index for order lookups by creation time (orders page).
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders (created_at DESC);

-- Index for order items by order_id (loading order details).
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

-- Index for order events by order_id (loading order timeline).
CREATE INDEX IF NOT EXISTS idx_order_events_order_id
  ON order_events (order_id);
