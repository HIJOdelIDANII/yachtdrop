import sys
import time
import argparse
import traceback
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from product import scrape_product, slugify
from sitemap import get_all_product_urls, get_product_urls_from_category, get_top_categories
from db import (
    get_connection, ensure_tables, upsert_category, upsert_product,
    update_category_counts, start_run, finish_run,
    soft_delete_unseen, update_category_image, set_category_icon,
)
from config import RATE_LIMIT_SECONDS, MAX_RETRIES, BACKOFF_FACTOR

CATEGORY_ICONS = {
    "boat-engine":       "Ship",
    "boat-engines":      "Ship",
    "electronics":       "Monitor",
    "navigation":        "Compass",
    "safety":            "ShieldCheck",
    "safety-equipment":  "ShieldCheck",
    "deck-hardware":     "Anchor",
    "deck":              "Anchor",
    "hardware":          "Wrench",
    "plumbing":          "Droplet",
    "electrical":        "Zap",
    "paint":             "Paintbrush",
    "maintenance":       "Settings",
    "cleaning":          "Sparkles",
    "fishing":           "Fish",
    "water-sports":      "Waves",
    "clothing":          "Shirt",
    "accessories":       "Package",
    "lighting":          "Lightbulb",
    "rigging":           "Cable",
    "sails":             "Wind",
    "trailer":           "Truck",
    "fuel":              "Fuel",
    "ventilation":       "Fan",
    "comfort":           "Sofa",
    "anchoring":         "Anchor",
    "mooring":           "Anchor",
}


def scrape_category_chunk(category_chunk, worker_id, max_pages_per_cat, limit_per_worker):
    """Worker function: each worker processes its assigned categories independently."""
    conn = get_connection()
    category_cache = {}
    scraped = 0
    errors = 0
    product_count = 0
    
    print(f"[Worker {worker_id}] Starting: {len(category_chunk)} categories assigned")
    
    # Step 1: Crawl all categories assigned to this worker
    all_product_urls = []
    for cat_idx, cat in enumerate(category_chunk):
        try:
            print(f"[Worker {worker_id}] [{cat_idx+1}/{len(category_chunk)}] Crawling: {cat['name']}")
            urls = get_product_urls_from_category(cat["url"], max_pages=max_pages_per_cat)
            
            for ext_id, url in urls:
                all_product_urls.append((ext_id, url, cat))
                product_count += 1
            
            print(f"[Worker {worker_id}]   {len(urls)} products found (total: {product_count})")
            time.sleep(0.1)  # Minimal delay between categories within worker
        except Exception as e:
            print(f"[Worker {worker_id}] ERROR crawling {cat['name']}: {e}")
            errors += 1
    
    print(f"[Worker {worker_id}] Crawl complete: {product_count} products to scrape")
    
    # Step 2: Scrape products assigned to this worker
    if limit_per_worker:
        all_product_urls = all_product_urls[:limit_per_worker]
    
    for i, (external_id, url, cat_info) in enumerate(all_product_urls):
        print(f"[Worker {worker_id}] [{i+1}/{len(all_product_urls)}] {url}")
        
        cat_slug = cat_info["slug"]
        if cat_slug not in category_cache:
            try:
                cid = upsert_category(conn, cat_slug, cat_info["name"], i)
                category_cache[cat_slug] = cid
                icon = CATEGORY_ICONS.get(cat_slug, "Package")
                set_category_icon(conn, cat_slug, icon)
            except Exception as e:
                print(f"[Worker {worker_id}] ERROR upserting category {cat_slug}: {e}")
                conn.rollback()
                errors += 1
                continue
        
        category_id = category_cache[cat_slug]
        
        retries = 0
        while retries <= MAX_RETRIES:
            try:
                data = scrape_product(url, external_id)
                
                if not data.get("price"):
                    print(f"[Worker {worker_id}]   SKIP: no price found")
                    break
                
                upsert_product(conn, data, category_id)
                scraped += 1
                print(f"[Worker {worker_id}]   OK: {data['name'][:50]} | {data['price']} EUR | {data['stock_status']}")
                
                if data.get("thumbnail"):
                    try:
                        update_category_image(conn, category_id, data["thumbnail"])
                    except:
                        pass
                
                break
            
            except Exception as e:
                conn.rollback()
                if "429" in str(e) or "Too Many" in str(e):
                    retries += 1
                    wait = RATE_LIMIT_SECONDS * (BACKOFF_FACTOR ** retries)
                    print(f"[Worker {worker_id}]   RATE LIMITED, retry {retries}/{MAX_RETRIES} in {wait:.0f}s")
                    time.sleep(wait)
                elif "403" in str(e):
                    print(f"[Worker {worker_id}]   BLOCKED (403). Worker stopping.")
                    conn.close()
                    return {"status": "blocked", "scraped": scraped, "errors": errors, "worker": worker_id}
                else:
                    retries += 1
                    if retries > MAX_RETRIES:
                        errors += 1
                        print(f"[Worker {worker_id}]   FAIL after {MAX_RETRIES} retries: {e}")
                    else:
                        wait = RATE_LIMIT_SECONDS * (BACKOFF_FACTOR ** (retries - 1))
                        print(f"[Worker {worker_id}]   ERROR, retry {retries}/{MAX_RETRIES} in {wait:.0f}s")
                        time.sleep(wait)
        
        # No sleep here - let workers maximize throughput with concurrent requests
    
    conn.close()
    print(f"[Worker {worker_id}] Complete: scraped {scraped}, errors {errors}")
    return {"status": "ok", "scraped": scraped, "errors": errors, "worker": worker_id}


def run_scraper_parallel(limit=None, max_pages=None, max_categories=None, num_workers=5):
    """Main scraper with parallel category distribution."""
    conn = get_connection()
    ensure_tables(conn)
    run_id = start_run(conn)
    run_started_at = datetime.now(timezone.utc)
    
    print(f"Scraper run started: {run_id}")
    print(f"Using {num_workers} parallel workers\n")
    
    # Step 1: Get all categories once
    all_categories = get_top_categories()
    if max_categories:
        all_categories = all_categories[:max_categories]
    
    print(f"Total categories: {len(all_categories)}\n")
    
    # Step 2: Divide categories into non-overlapping chunks
    chunk_size = (len(all_categories) + num_workers - 1) // num_workers
    category_chunks = []
    
    for worker_id in range(num_workers):
        start = worker_id * chunk_size
        end = min(start + chunk_size, len(all_categories))
        if start < len(all_categories):
            chunk = all_categories[start:end]
            category_chunks.append((chunk, worker_id))
            print(f"Worker {worker_id}: categories [{start}:{end}] ({len(chunk)} categories)")
    
    print()
    
    # Step 3: Execute workers in parallel
    total_scraped = 0
    total_errors = 0
    blocked = False
    
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = {
            executor.submit(scrape_category_chunk, chunk, wid, max_pages, 
                          (limit // num_workers) if limit else None): wid
            for chunk, wid in category_chunks
        }
        
        for future in as_completed(futures):
            result = future.result()
            worker_id = result["worker"]
            
            total_scraped += result["scraped"]
            total_errors += result["errors"]
            
            if result["status"] == "blocked":
                print(f"\n⚠️  Worker {worker_id} was BLOCKED (403). Stopping all workers.")
                blocked = True
                executor.shutdown(wait=False)
                break
            
            print(f"Worker {worker_id} finished\n")
    
    # Step 4: Cleanup
    if blocked:
        finish_run(conn, run_id, total_scraped, total_errors, "blocked")
        conn.close()
        sys.exit(1)
    
    stale = []
    if not limit and not max_categories:
        stale = soft_delete_unseen(conn, run_started_at)
        if stale:
            print(f"\nSoft-deleted {len(stale)} stale products not seen in this run")
    else:
        print("\nPartial run — skipping soft delete")
    
    update_category_counts(conn)
    finish_run(conn, run_id, total_scraped, total_errors)
    print(f"\n✅ Done. Scraped: {total_scraped}, Errors: {total_errors}, Stale: {len(stale) if stale else 0}")
    conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="YachtDrop product scraper (parallel)")
    parser.add_argument("--limit", type=int, help="Max products to scrape")
    parser.add_argument("--max-pages", type=int, help="Max pages per category (default: all)")
    parser.add_argument("--max-categories", type=int, help="Max categories to crawl (default: all)")
    parser.add_argument("--workers", type=int, default=5, help="Number of parallel workers (default: 5)")
    args = parser.parse_args()
    run_scraper_parallel(limit=args.limit, max_pages=args.max_pages, max_categories=args.max_categories, num_workers=args.workers)
