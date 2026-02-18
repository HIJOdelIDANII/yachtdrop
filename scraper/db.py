import uuid
import psycopg2
import psycopg2.extras
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))


def ensure_tables(conn):
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                slug TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                icon TEXT,
                image_url TEXT,
                product_count INT DEFAULT 0,
                display_order INT DEFAULT 0
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                external_id TEXT UNIQUE,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                description TEXT,
                short_desc TEXT,
                price DECIMAL(10,2) NOT NULL,
                original_price DECIMAL(10,2),
                discount_percent INT,
                currency TEXT DEFAULT 'EUR',
                stock_status TEXT DEFAULT 'IN_STOCK',
                category_id UUID REFERENCES categories(id),
                images TEXT[] DEFAULT '{}',
                thumbnail TEXT,
                available BOOLEAN DEFAULT TRUE,
                source_url TEXT,
                scraped_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS scraper_runs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                started_at TIMESTAMPTZ DEFAULT NOW(),
                finished_at TIMESTAMPTZ,
                products_scraped INT DEFAULT 0,
                errors INT DEFAULT 0,
                status TEXT DEFAULT 'running'
            )
        """)
    conn.commit()


def upsert_category(conn, slug, name, display_order=0):
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO categories (id, slug, name, display_order)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        """, (str(uuid.uuid4()), slug, name, display_order))
        conn.commit()
        return cur.fetchone()[0]


def upsert_product(conn, data, category_id=None):
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO products (
                id, external_id, name, slug, description, short_desc,
                price, original_price, discount_percent, currency,
                stock_status, category_id, images, thumbnail,
                available, source_url, scraped_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, NOW()
            )
            ON CONFLICT (external_id) DO UPDATE SET
                name = EXCLUDED.name,
                slug = EXCLUDED.slug,
                description = EXCLUDED.description,
                short_desc = EXCLUDED.short_desc,
                price = EXCLUDED.price,
                original_price = EXCLUDED.original_price,
                discount_percent = EXCLUDED.discount_percent,
                stock_status = EXCLUDED.stock_status,
                category_id = EXCLUDED.category_id,
                images = EXCLUDED.images,
                thumbnail = EXCLUDED.thumbnail,
                available = EXCLUDED.available,
                source_url = EXCLUDED.source_url,
                scraped_at = NOW()
            RETURNING id
        """, (
            str(uuid.uuid4()), data["external_id"], data["name"], data["slug"],
            data.get("description"), data.get("short_desc"),
            data.get("price", 0), data.get("original_price"),
            data.get("discount_percent"), data.get("currency", "EUR"),
            data.get("stock_status", "IN_STOCK"), category_id,
            data.get("images", []), data.get("thumbnail"),
            data.get("available", True), data.get("source_url"),
        ))
        conn.commit()
        return cur.fetchone()[0]


def update_category_counts(conn):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE categories c SET product_count = (
                SELECT COUNT(*) FROM products p WHERE p.category_id = c.id
            )
        """)
    conn.commit()


def start_run(conn):
    with conn.cursor() as cur:
        run_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO scraper_runs (id, status) VALUES (%s, 'running') RETURNING id
        """, (run_id,))
        conn.commit()
        return cur.fetchone()[0]


def finish_run(conn, run_id, products_scraped, errors, status="completed"):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE scraper_runs SET
                finished_at = NOW(),
                products_scraped = %s,
                errors = %s,
                status = %s
            WHERE id = %s
        """, (products_scraped, errors, status, str(run_id)))
    conn.commit()