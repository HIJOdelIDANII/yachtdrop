import re
import requests
from bs4 import BeautifulSoup
from config import HEADERS, REQUEST_TIMEOUT, STOCK_MAP, BASE_URL


def fetch_page(url):
    resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    return resp.text


def parse_price(text):
    if not text:
        return None
    cleaned = re.sub(r"[^\d.,]", "", text.strip())
    cleaned = cleaned.replace(",", ".")
    parts = cleaned.split(".")
    if len(parts) > 2:
        cleaned = "".join(parts[:-1]) + "." + parts[-1]
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_stock(soup):
    stock_el = soup.select_one("#product-availability")
    if not stock_el:
        stock_el = soup.select_one(".product-availability")
    if stock_el:
        text = stock_el.get_text(strip=True).lower()
        for key, status in STOCK_MAP.items():
            if key in text:
                return status
    return "IN_STOCK"


def is_product_image(src):
    if not src:
        return False
    if src.endswith(".svg"):
        return False
    if "/img/l/" in src or "/img/p/" in src:
        return False
    if "/modules/" in src:
        return False
    if re.search(r"/\d+-\w+_default/", src):
        return True
    if "/img/p/" in src:
        return True
    return False


def normalize_image_url(src):
    if src.startswith("//"):
        return "https:" + src
    if src.startswith("/"):
        return BASE_URL + src
    return src


def get_large_image_url(src):
    import re
    return re.sub(r"-\w+_default/", "-large_default/", src)


def parse_images(soup):
    images = []
    seen = set()

    for img in soup.select("img"):
        src = img.get("src", "") or img.get("data-src", "")
        if is_product_image(src):
            src = normalize_image_url(src)
            large = get_large_image_url(src)
            if large not in seen:
                seen.add(large)
                images.append(large)

    for source in soup.select("source"):
        srcset = source.get("srcset", "")
        for part in srcset.split(","):
            url = part.strip().split(" ")[0]
            if is_product_image(url):
                url = normalize_image_url(url)
                large = get_large_image_url(url)
                if large not in seen:
                    seen.add(large)
                    images.append(large)

    return images


def parse_categories(soup):
    breadcrumbs = soup.select("nav.breadcrumb ol li a span, .breadcrumb li a span")
    cats = []
    for bc in breadcrumbs:
        name = bc.get_text(strip=True)
        if name.lower() not in ("home", ""):
            cats.append(name)
    return cats


def parse_sku(soup):
    ref_el = soup.select_one(".product-reference span")
    if ref_el:
        return ref_el.get_text(strip=True)
    return None


def slugify(text):
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


def scrape_product(url, external_id):
    html = fetch_page(url)
    soup = BeautifulSoup(html, "lxml")

    name_el = soup.select_one("h1.product-detail-name, h1[itemprop='name'], h1")
    name = name_el.get_text(strip=True) if name_el else "Unknown Product"

    current_price_el = soup.select_one(".current-price .current-price-value, .current-price [itemprop='price']")
    if current_price_el:
        price_attr = current_price_el.get("content")
        price = parse_price(price_attr) if price_attr else parse_price(current_price_el.get_text())
    else:
        price_el = soup.select_one("[itemprop='price']")
        price = parse_price(price_el.get("content", price_el.get_text())) if price_el else None

    original_price = None
    original_el = soup.select_one(".regular-price")
    if original_el:
        original_price = parse_price(original_el.get_text())

    discount_percent = None
    discount_el = soup.select_one(".discount-percentage, .discount-amount, .product-discount .discount")
    if discount_el:
        disc_text = discount_el.get_text(strip=True)
        disc_match = re.search(r"-?\s*(\d+)%", disc_text)
        if disc_match:
            discount_percent = int(disc_match.group(1))
    if not discount_percent and original_price and price and original_price > price:
        discount_percent = round((1 - price / original_price) * 100)

    desc_el = soup.select_one(".product-description, #product-description, [itemprop='description']")
    description = desc_el.get_text(strip=True) if desc_el else ""

    short_desc_el = soup.select_one(".product-description-short, #product-description-short")
    short_desc = short_desc_el.get_text(strip=True) if short_desc_el else (description[:200] if description else "")

    stock_status = parse_stock(soup)
    images = parse_images(soup)
    thumbnail = images[0] if images else None
    categories = parse_categories(soup)
    sku = parse_sku(soup)

    return {
        "external_id": external_id,
        "sku": sku,
        "name": name,
        "slug": slugify(name),
        "description": description,
        "short_desc": short_desc,
        "price": price,
        "original_price": original_price,
        "discount_percent": discount_percent,
        "currency": "EUR",
        "stock_status": stock_status,
        "images": images,
        "thumbnail": thumbnail,
        "categories": categories,
        "source_url": url,
        "available": stock_status != "ON_DEMAND",
    }
