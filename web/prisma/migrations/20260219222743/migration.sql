-- DropIndex
DROP INDEX IF EXISTS "marinas_lat_lng_idx";

-- DropIndex
DROP INDEX IF EXISTS "marinas_name_trgm_idx";

-- DropIndex
DROP INDEX IF EXISTS "idx_order_events_order_id";

-- DropIndex
DROP INDEX IF EXISTS "idx_order_items_order_id";

-- DropIndex
DROP INDEX IF EXISTS "idx_orders_created_at";

-- DropIndex
DROP INDEX IF EXISTS "idx_products_available_category";

-- DropIndex
DROP INDEX IF EXISTS "idx_products_brand";

-- DropIndex
DROP INDEX IF EXISTS "idx_products_category_id";

-- DropIndex
DROP INDEX IF EXISTS "idx_products_name_trgm";

-- DropIndex
DROP INDEX IF EXISTS "idx_products_offers";

-- DropIndex
DROP INDEX IF EXISTS "idx_products_search_vector";

-- DropIndex
DROP INDEX IF EXISTS "idx_products_trending";
