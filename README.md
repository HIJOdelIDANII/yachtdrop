# YachtDrop

Order boat parts as easily as ordering food delivery. A mobile-first online chandlery marketplace where yacht crews order supplies for delivery to their berth or pickup from the marina.

**Live:** [yachtdrop.vercel.app](https://yachtdrop.vercel.app)

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | TailwindCSS 4, Framer Motion 12, Radix UI, shadcn/ui |
| State | TanStack Query 5 (server), Zustand 5 (client) |
| Database | PostgreSQL (Azure) with Prisma 7, pg_trgm + tsvector FTS |
| AI | Azure AI Services — GPT-4o-mini (chat), Phi-4-mini (search) |
| Maps | Leaflet + OpenStreetMap Overpass API |
| Auth | Clerk |
| Scraper | Python 3, BeautifulSoup, 5 concurrent workers |
| Testing | Vitest, MSW, Playwright |
| CI/CD | GitHub Actions → Vercel |
| Infra | Vercel (app), Azure PostgreSQL (data), Azure AI (inference) |

## Architecture

Open [`architecture.drawio`](./architecture.drawio) at [app.diagrams.net](https://app.diagrams.net) for the full system diagram with Azure, framework, and library components.

### Data Flow

```
nautichandler.com ──[Python scraper]──> Azure PostgreSQL
                                              │
                    ┌─────────────────────────┤
                    │                         │
              Vercel (Next.js)          Azure AI Services
              ├─ App Router API         ├─ Phi-4-mini (search)
              ├─ React 19 SSR          └─ GPT-4o-mini (chat)
              └─ Edge caching
                    │
              Mobile browser
              (PWA-like UX)
```

### Search Pipeline

Two paths depending on query complexity:

**Keyword search** — short queries like "anchor rope":
```
Input → 300ms debounce → /api/search/combined
  → tsvector AND query → OR fallback → ILIKE fallback
  → { products[], marinas[] }
```

**AI search** — natural language like "what do I need for anchoring?":
```
Input → 300ms debounce → /api/search/ai
  → Phi-4-mini keyword extraction → multi-keyword FTS → dedup
  → { products[], marinas[], aiContext }
```

### Chat Pipeline

```
User message → chitchat regex (skip planner for greetings)
  → GPT-4o-mini planner → { queries, categories, priceMax }
  → FTS retrieval → relevance filter (keyword count scoring)
  → GPT-4o-mini responder (multi-turn history + [PRODUCTS])
  → { message, products[], marinas[] }
```

## Project Structure

```
web/src/
├── app/
│   ├── api/
│   │   ├── search/combined/   Combined product + marina FTS
│   │   ├── search/ai/         NL → Phi-4-mini → keywords → FTS
│   │   ├── chat/              Two-model conversational AI
│   │   ├── bundles/           AI crew essentials bundles
│   │   ├── marinas/           Marina DB + Overpass fallback (24hr cache)
│   │   ├── products/          CRUD, /trending, /offers
│   │   ├── orders/            Order creation (5/min rate limit)
│   │   └── categories/        Category list with counts
│   ├── browse/                Catalog with category tabs
│   ├── search/                Search with filters
│   ├── chat/                  AI assistant
│   ├── product/[id]/          Product detail
│   └── orders/                Order history + tracking
├── components/
│   ├── search/                SearchBar, SearchResults, Autosuggest
│   ├── product/               ProductCard, ProductRow, BundleCard
│   ├── cart/                  CartBar, CartDrawer, CartItem
│   ├── checkout/              CheckoutSheet (delivery/pickup, marina)
│   ├── chat/                  ChatMessage, ChatBubble
│   ├── category/              CategoryGrid (home), CategoryTabs (browse)
│   ├── layout/                AppShell, BottomNav, Providers
│   └── ui/                    shadcn (do not edit manually)
├── lib/
│   ├── hooks/                 useCombinedSearch, useFilteredProducts, useBundles
│   ├── bundles/               Static bundle definitions
│   ├── ai.ts                  Azure AI client
│   ├── prisma.ts              Prisma singleton
│   └── env.ts                 APP_ENV detection
├── store/                     Zustand: cart, filter, chat, ui
├── types/index.ts             All TypeScript types
└── test/                      MSW mocks, fixtures, e2e specs

scraper/
├── main.py                    Multi-worker orchestration (ThreadPoolExecutor)
├── product.py                 HTML + JSON-LD parsing, image extraction
├── sitemap.py                 Sitemap XML category discovery
├── db.py                      Bulk INSERT ON CONFLICT, soft deletes
├── clean.py                   Dedup, normalization, image validation
└── config.py                  Rate limits (3s), retries (3), backoff (2x)
```

## Database

PostgreSQL with full-text search:

- **tsvector** column with GIN index, maintained by trigger on INSERT/UPDATE
- **pg_trgm** for fuzzy similarity matching
- FTS fallback chain: AND query → OR query → ILIKE
- Bulk writes: `INSERT ... ON CONFLICT DO NOTHING` with UNNEST arrays
- Soft deletes: products not seen in scrape marked `available=FALSE`

| Table | Purpose |
|-------|---------|
| `products` | 2000+ marine parts with prices, images, FTS vectors |
| `categories` | 40+ categories with slugs and product counts |
| `marinas` | Cached marina data from OpenStreetMap |
| `orders` | Order management with status enum |
| `order_items` | Line items with quantity and unit pricing |
| `order_events` | Status change timeline |
| `scraper_runs` | Scraper execution history |

## AI Integration

Azure AI Services (Sweden Central), two-model architecture:

| Model | Deployment | Role |
|-------|-----------|------|
| Phi-4-mini | `phi-4-mini` | Keyword extraction from natural language queries |
| GPT-4o-mini | `gpt-4o-mini` | Chat planner (intent) + conversational responder |

Auth: `api-key` header (not Bearer). Endpoint:
```
{AZURE_AI_ENDPOINT}/openai/deployments/{model}/chat/completions?api-version=2024-10-21
```

## Scraper

Python multi-worker scraper for nautichandler.com:

1. Parse sitemap.xml for category URLs
2. Distribute categories across 5 concurrent threads
3. Extract: name, SKU, price, images, brand, weight, stock status
4. Clean: HTML decode, price normalize, dedup, image validate
5. Bulk upsert to PostgreSQL with conflict handling
6. Rate limited: 3s delay, exponential backoff on failure

```bash
cd scraper
python main.py        # Full scrape
python clean.py       # Clean + normalize existing data
```

## Development

```bash
cd web
npm install
npm run dev           # Dev server :3000
npm run test          # Vitest unit/integration
npm run test:e2e      # Playwright headless
npm run migrate:dev   # Migrate local DB
npm run migrate:prod  # Migrate Azure prod
npx prisma generate   # Regen client after schema change
```

## Environment Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Server | PostgreSQL connection string |
| `NEXT_PUBLIC_APP_ENV` | Public | `development` / `preview` / `production` |
| `NEXT_PUBLIC_APP_URL` | Public | Base URL |
| `NEXT_PUBLIC_DELIVERY_FEE` | Public | Delivery cost in EUR (default 5.00) |
| `AZURE_AI_ENDPOINT` | Server | Azure AI Services base URL |
| `AZURE_AI_API_KEY` | Server | Azure AI API key |
| `AZURE_AI_DEPLOYMENT` | Server | Phi-4-mini deployment name |
| `AZURE_AI_CHAT_DEPLOYMENT` | Server | GPT-4o-mini deployment name |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk auth |
| `CLERK_SECRET_KEY` | Server | Clerk server secret |

## CI/CD

GitHub Actions on push to `main`:

1. **Test** — Node 22, Vitest
2. **Migrate** — `prisma migrate deploy` to Azure PostgreSQL
3. **Deploy** — Vercel CLI production deploy

## UX Patterns

Modeled after Uber Eats mobile:

- Bottom tab navigation (Home, Browse, Search, AI Chat, Orders)
- Card-based browsing with floating quick-add buttons
- Horizontal scroll carousels for trending and offers
- Slide-in drawers for cart and checkout
- Skeleton loaders during data fetches
- Glassmorphism hero with search shortcut
- Dark/light theme toggle
- Staggered entrance animations (Framer Motion)

## Bundles

5 AI crew essentials bundles, auto-populated from inventory:

| Bundle | Keywords |
|--------|----------|
| Weekend Cruise Kit | sunscreen, rope, fender, cooler |
| Safety Essentials | life jacket, fire extinguisher, flare, first aid |
| Docking Package | dock line, fender, cleat, boat hook |
| Engine Care | oil, filter, spark plug, fuel, coolant |
| Deck Maintenance | cleaner, polish, wax, brush, teak |

## License

Private — Hackathon project for Marine Nanotech.
