import re
import html
import argparse
import time
from collections import defaultdict

import requests
from db import get_connection, ensure_tables


def clean_html_entities(conn, dry_run=False):
    with conn.cursor() as cur:
        cur.execute("SELECT id, name, description, short_desc FROM products")
        rows = cur.fetchall()

    updated = 0
    for pid, name, desc, short_desc in rows:
        new_name = html.unescape(name) if name else name
        new_desc = html.unescape(desc) if desc else desc
        new_short = html.unescape(short_desc) if short_desc else short_desc

        if new_desc:
            new_desc = re.sub(r"<[^>]+>", " ", new_desc)
            new_desc = re.sub(r"\s{2,}", " ", new_desc).strip()
        if new_short:
            new_short = re.sub(r"<[^>]+>", " ", new_short)
            new_short = re.sub(r"\s{2,}", " ", new_short).strip()

        if (new_name != name) or (new_desc != desc) or (new_short != short_desc):
            updated += 1
            if not dry_run:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE products SET name=%s, description=%s, short_desc=%s WHERE id=%s",
                        (new_name, new_desc, new_short, pid),
                    )

    if not dry_run:
        conn.commit()
    print(f"  [html] Cleaned {updated} products")
    return updated


SKU_PREFIX_PATTERN = re.compile(
    r"^(?:[A-Z]{2,5}[\-_]\d+[\s\-–—]*|"
    r"\d{4,}[\s\-–—]+|"
    r"[A-Z]{1,3}\d{3,}[\s\-–—]+)",
    re.IGNORECASE,
)

TRAILING_SKU_PATTERN = re.compile(
    r"[\s\-–—]+(?:[A-Z]{2,5}[\-_]\d+|"
    r"\d{4,})$",
    re.IGNORECASE,
)


def normalize_name(name):
    if not name:
        return name
    cleaned = SKU_PREFIX_PATTERN.sub("", name.strip())
    cleaned = TRAILING_SKU_PATTERN.sub("", cleaned.strip())
    # Title case, but preserve acronyms (2+ uppercase letters together)
    words = cleaned.split()
    result = []
    for word in words:
        if word.isupper() and len(word) >= 2:
            result.append(word)
        else:
            result.append(word.capitalize())
    return " ".join(result).strip()


def clean_names(conn, dry_run=False):
    with conn.cursor() as cur:
        cur.execute("SELECT id, name FROM products")
        rows = cur.fetchall()

    updated = 0
    for pid, name in rows:
        new_name = normalize_name(name)
        if new_name and new_name != name:
            updated += 1
            if not dry_run:
                with conn.cursor() as cur:
                    cur.execute("UPDATE products SET name=%s WHERE id=%s", (new_name, pid))

    if not dry_run:
        conn.commit()
    print(f"  [names] Normalized {updated} product names")
    return updated


def _norm_key(name):
    key = name.lower().strip()
    key = re.sub(r"[^\w\s]", "", key)
    key = re.sub(r"\s+", " ", key)
    return key


def deduplicate_products(conn, dry_run=False):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, name, price, thumbnail, images, available FROM products ORDER BY name"
        )
        rows = cur.fetchall()

    groups = defaultdict(list)
    for pid, name, price, thumb, images, available in rows:
        key = _norm_key(name)
        groups[key].append({
            "id": pid,
            "name": name,
            "price": float(price) if price else 0,
            "thumbnail": thumb,
            "image_count": len(images) if images else 0,
            "available": available,
        })

    dupes_removed = 0
    for key, items in groups.items():
        if len(items) <= 1:
            continue

        def score(item):
            s = 0
            if item["available"]:
                s += 1000
            s += item["image_count"] * 10
            if item["thumbnail"]:
                s += 50
            if item["price"] > 0:
                s += 100
            return s

        items.sort(key=score, reverse=True)
        keep = items[0]
        remove = items[1:]

        for r in remove:
            dupes_removed += 1
            if not dry_run:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE products SET available = FALSE WHERE id = %s",
                        (r["id"],),
                    )

    if not dry_run:
        conn.commit()
    print(f"  [dedup] Marked {dupes_removed} duplicate products as unavailable")
    return dupes_removed


def validate_images(conn, dry_run=False, timeout=10, batch_size=50):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, name, thumbnail FROM products WHERE available = TRUE AND thumbnail IS NOT NULL"
        )
        rows = cur.fetchall()

    broken = 0
    checked = 0
    session = requests.Session()
    session.headers.update({
        "User-Agent": "YachtDrop-ImageValidator/1.0",
    })

    for pid, name, thumbnail in rows:
        checked += 1
        if checked % 50 == 0:
            print(f"    ... checked {checked}/{len(rows)} images")

        try:
            resp = session.head(thumbnail, timeout=timeout, allow_redirects=True)
            if resp.status_code >= 400:
                broken += 1
                print(f"    BROKEN ({resp.status_code}): {name[:50]} → {thumbnail[:80]}")
                if not dry_run:
                    with conn.cursor() as cur:
                        cur.execute(
                            "UPDATE products SET thumbnail = NULL WHERE id = %s",
                            (pid,),
                        )
        except requests.RequestException as e:
            broken += 1
            print(f"    TIMEOUT: {name[:50]} → {str(e)[:60]}")
            if not dry_run:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE products SET thumbnail = NULL WHERE id = %s",
                        (pid,),
                    )

        time.sleep(0.1)

    if not dry_run:
        conn.commit()
    print(f"  [images] Checked {checked}, broken {broken}")
    return broken


CATEGORY_MERGES = {
    "boat-engines": ["boat-engine", "engines", "engine"],
    "safety-equipment": ["safety", "life-jackets"],
    "deck-hardware": ["deck", "hardware"],
    "electronics": ["electronic", "marine-electronics"],
    "navigation": ["navigation-instruments", "nav-instruments"],
    "maintenance": ["maintenance-products", "boat-maintenance"],
    "cleaning": ["cleaning-products", "boat-cleaning"],
}


def standardize_categories(conn, dry_run=False):
    with conn.cursor() as cur:
        cur.execute("SELECT id, slug, name FROM categories")
        cats = {row[1]: {"id": row[0], "name": row[2]} for row in cur.fetchall()}

    merged = 0
    for target_slug, source_slugs in CATEGORY_MERGES.items():
        if target_slug not in cats:
            continue
        target_id = cats[target_slug]["id"]

        for src_slug in source_slugs:
            if src_slug not in cats or src_slug == target_slug:
                continue
            src_id = cats[src_slug]["id"]
            merged += 1
            print(f"    Merging '{src_slug}' → '{target_slug}'")

            if not dry_run:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE products SET category_id = %s WHERE category_id = %s",
                        (target_id, src_id),
                    )
                    cur.execute("DELETE FROM categories WHERE id = %s", (src_id,))

    if not dry_run:
        conn.commit()
    print(f"  [categories] Merged {merged} duplicate categories")
    return merged


def flag_zero_price(conn, dry_run=False):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FROM products WHERE (price IS NULL OR price <= 0) AND available = TRUE"
        )
        count = cur.fetchone()[0]

        if count > 0 and not dry_run:
            cur.execute(
                "UPDATE products SET available = FALSE WHERE (price IS NULL OR price <= 0) AND available = TRUE"
            )

    if not dry_run:
        conn.commit()
    print(f"  [zero-price] Flagged {count} zero/null-price products as unavailable")
    return count


def update_counts(conn, dry_run=False):
    if dry_run:
        print("  [counts] Skipped (dry run)")
        return 0
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE categories c SET product_count = (
                SELECT COUNT(*) FROM products p
                WHERE p.category_id = c.id AND p.available = TRUE
            )
        """)
    conn.commit()
    print("  [counts] Updated category product counts")
    return 0


BRAND_ALIASES = {
    "3m marine": "3M",
    "3m ": "3M",
    "osculati spa": "Osculati",
    "lalizas sa": "Lalizas",
    "lalizas s.a.": "Lalizas",
}


def normalize_brands(conn, dry_run=False):
    with conn.cursor() as cur:
        cur.execute("SELECT id, brand FROM products WHERE brand IS NOT NULL")
        rows = cur.fetchall()

    updated = 0
    for pid, brand in rows:
        new_brand = brand.strip()
        lower = new_brand.lower()
        for alias, canonical in BRAND_ALIASES.items():
            if lower == alias.lower() or lower.startswith(alias.lower()):
                new_brand = canonical
                break
        if not new_brand or new_brand != brand:
            updated += 1
            if not dry_run:
                with conn.cursor() as cur:
                    cur.execute("UPDATE products SET brand=%s WHERE id=%s", (new_brand or None, pid))

    if not dry_run:
        conn.commit()
    print(f"  [brands] Normalized {updated} brand names")
    return updated


STEPS = {
    "html":       ("Strip HTML entities", clean_html_entities),
    "names":      ("Normalize names", clean_names),
    "brands":     ("Normalize brands", normalize_brands),
    "dedup":      ("Deduplicate products", deduplicate_products),
    "images":     ("Validate images", validate_images),
    "categories": ("Standardize categories", standardize_categories),
    "zero-price": ("Flag zero-price", flag_zero_price),
    "counts":     ("Update counts", update_counts),
}


def main():
    parser = argparse.ArgumentParser(description="YachtDrop data cleaning pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    parser.add_argument(
        "--step",
        choices=list(STEPS.keys()),
        help="Run a single cleaning step",
    )
    parser.add_argument(
        "--skip-images",
        action="store_true",
        help="Skip image validation (slow network calls)",
    )
    args = parser.parse_args()

    conn = get_connection()
    ensure_tables(conn)

    print(f"{'DRY RUN — ' if args.dry_run else ''}Starting data cleaning pipeline\n")

    if args.step:
        label, fn = STEPS[args.step]
        print(f"Running: {label}")
        fn(conn, dry_run=args.dry_run)
    else:
        for key, (label, fn) in STEPS.items():
            if key == "images" and args.skip_images:
                print(f"Skipping: {label}")
                continue
            print(f"Running: {label}")
            fn(conn, dry_run=args.dry_run)
            print()

    conn.close()
    print("\nCleaning complete.")


if __name__ == "__main__":
    main()
