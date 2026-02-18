import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://nautichandler.com"
SITEMAP_URL = f"{BASE_URL}/1_en_0_sitemap.xml"
DATABASE_URL = os.getenv("DATABASE_URL")

RATE_LIMIT_SECONDS = 3
MAX_RETRIES = 3
REQUEST_TIMEOUT = 30
BACKOFF_FACTOR = 2

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

EXCLUDE_PATTERNS = [
    "?search_query=",
    "?order=",
    "/cart",
    "/login",
    "/my-account",
    "/module/",
    "/contact-us",
    "/prices-drop",
    "/new-products",
    "/best-sales",
    "/stores",
]

PRODUCT_URL_PATTERN = r"/en/\d+-[\w-]+\.html$"

STOCK_MAP = {
    "in stock": "IN_STOCK",
    "last items in stock": "LOW_STOCK",
    "available under demand": "ON_DEMAND",
    "out of stock": "ON_DEMAND",
}
