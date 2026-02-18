import sys
import time
import argparse
import traceback
from product import scrape_product, slugify
from sitemap import get_all_product_urls
from db import get_connection, ensure_tables, upsert_category, upsert_product, update_category_counts, start_run, finish_run
from config import RATE_LIMIT_SECONDS, MAX_RETRIES


def run_scraper(limit=None, max_pages=None, max_categories=None):
    conn = get_connection()
    ensure_tables(conn)
    run_id = start_run(conn)

    print(f"Scraper run started: {run_id}")

    product_entries = get_all_product_urls(
        max_pages_per_cat=max_pages,
        max_categories=max_categories,
    )
    if limit:
        product_entries = product_entries[:limit]

    scraped = 0
    errors = 0
    category_cache = {}

    for i, (external_id, url, cat_info) in enumerate(product_entries):
        print(f"[{i+1}/{len(product_entries)}] {url}")

        cat_slug = cat_info["slug"]
        if cat_slug not in category_cache:
            cid = upsert_category(conn, cat_slug, cat_info["name"], len(category_cache))
            category_cache[cat_slug] = cid
        category_id = category_cache[cat_slug]

        retries = 0
        while retries <= MAX_RETRIES:
            try:
                data = scrape_product(url, external_id)

                if not data.get("price"):
                    print(f"  SKIP: no price found")
                    break

                slug_suffix = 0
                original_slug = data["slug"]
                while True:
                    try:
                        upsert_product(conn, data, category_id)
                        break
                    except Exception as e:
                        if "slug" in str(e).lower() and "unique" in str(e).lower():
                            conn.rollback()
                            slug_suffix += 1
                            data["slug"] = f"{original_slug}-{slug_suffix}"
                        else:
                            raise

                scraped += 1
                print(f"  OK: {data['name'][:60]} | {data['price']} EUR | {data['stock_status']}")
                break

            except Exception as e:
                conn.rollback()
                if "429" in str(e):
                    retries += 1
                    wait = RATE_LIMIT_SECONDS * (retries + 1)
                    print(f"  RATE LIMITED, retry {retries}/{MAX_RETRIES} in {wait}s")
                    time.sleep(wait)
                elif "403" in str(e):
                    print(f"  BLOCKED (403). Stopping.")
                    finish_run(conn, run_id, scraped, errors, "blocked")
                    conn.close()
                    sys.exit(1)
                else:
                    retries += 1
                    if retries > MAX_RETRIES:
                        errors += 1
                        print(f"  FAIL after {MAX_RETRIES} retries: {e}")
                    else:
                        print(f"  ERROR, retry {retries}/{MAX_RETRIES}: {e}")
                        time.sleep(RATE_LIMIT_SECONDS)

        time.sleep(RATE_LIMIT_SECONDS)

    update_category_counts(conn)
    finish_run(conn, run_id, scraped, errors)
    print(f"\nDone. Scraped: {scraped}, Errors: {errors}")
    conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="YachtDrop product scraper")
    parser.add_argument("--limit", type=int, help="Max products to scrape")
    parser.add_argument("--max-pages", type=int, default=2, help="Max pages per category")
    parser.add_argument("--max-categories", type=int, help="Max categories to crawl")
    args = parser.parse_args()
    run_scraper(limit=args.limit, max_pages=args.max_pages, max_categories=args.max_categories)
