import re
import time
import requests
from bs4 import BeautifulSoup
from config import BASE_URL, HEADERS, REQUEST_TIMEOUT, RATE_LIMIT_SECONDS, EXCLUDE_PATTERNS


def fetch_page(url):
    resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    return resp.text


def is_excluded(url):
    for pattern in EXCLUDE_PATTERNS:
        if pattern in url:
            return True
    return False


def get_top_categories():
    html = fetch_page(f"{BASE_URL}/en/")
    soup = BeautifulSoup(html, "lxml")
    categories = []
    seen = set()

    top_level_ids = set()
    top_level_map = {}

    for a in soup.select("a[href*='/en/']"):
        href = a.get("href", "").strip()
        text = a.get_text(strip=True)
        if not text or not href:
            continue
        match = re.search(r"/en/(\d+)-([a-z0-9-]+)$", href)
        if not match:
            continue
        if is_excluded(href):
            continue
        cat_id = match.group(1)
        slug = match.group(2)
        if cat_id in seen:
            continue
        seen.add(cat_id)
        full_url = href if href.startswith("http") else BASE_URL + href
        cat = {"id": cat_id, "slug": slug, "name": text, "url": full_url}
        categories.append(cat)

    print(f"Found {len(categories)} categories (including parents and leaves)")
    return categories


def has_products(url):
    try:
        html = fetch_page(url)
        soup = BeautifulSoup(html, "lxml")
        cards = soup.select("article.product-container, article.product-miniature, article[class*='product']")
        return len(cards) > 0
    except Exception:
        return False


def get_product_urls_from_category(category_url, max_pages=None):
    product_urls = []
    page = 1

    while True:
        url = category_url if page == 1 else f"{category_url}?page={page}"
        try:
            html = fetch_page(url)
        except Exception as e:
            print(f"  Page {page} fetch failed: {e}")
            break

        soup = BeautifulSoup(html, "lxml")
        cards = soup.select("article.product-container, article.product-miniature, article[class*='product']")

        if not cards:
            break

        for card in cards:
            link_el = card.select_one("a[href$='.html']")
            if not link_el:
                continue
            href = link_el.get("href", "")
            if not href:
                continue
            match = re.search(r"/en/(\d+)-", href)
            if match:
                ext_id = match.group(1)
                full = href if href.startswith("http") else BASE_URL + href
                product_urls.append((ext_id, full))

        has_next = soup.select_one("a.next, .pagination a[rel='next'], a[rel='next']")
        if not has_next:
            break
        if max_pages and page >= max_pages:
            break

        page += 1
        time.sleep(RATE_LIMIT_SECONDS)

    return product_urls


def get_all_product_urls(max_pages_per_cat=None, max_categories=None):
    categories = get_top_categories()
    if max_categories:
        categories = categories[:max_categories]

    all_urls = []
    seen_ids = set()

    for i, cat in enumerate(categories):
        print(f"[{i+1}/{len(categories)}] Crawling: {cat['name']} ({cat['url']})")
        urls = get_product_urls_from_category(cat["url"], max_pages=max_pages_per_cat)
        if not urls:
            print(f"  No products (parent category), skipping")
            time.sleep(RATE_LIMIT_SECONDS)
            continue
        new = 0
        for ext_id, url in urls:
            if ext_id not in seen_ids:
                seen_ids.add(ext_id)
                all_urls.append((ext_id, url, cat))
                new += 1
        print(f"  {new} new products (total: {len(all_urls)})")
        time.sleep(RATE_LIMIT_SECONDS)

    print(f"\nTotal unique products: {len(all_urls)}")
    return all_urls
