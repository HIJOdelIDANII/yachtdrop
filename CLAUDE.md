# YachtDrop

## Rules
- Solo dev, vibe coding. Ship fast. No over-engineering unless asked. No lectures.
- NEVER commit, push, or create PRs unless explicitly asked.
- NEVER create docs, READMEs, or markdown files unless asked
- NEVER add comments, docstrings, or type annotations to code you didn't write.
- NEVER refactor, clean up, or "improve" code adjacent to your change.
- NEVER ask "should I proceed?" — just do it. Ask only when genuinely blocked on a decision.
- After any code change: run `cd web && npm run test`. Fix failures before reporting done.
- Responses: say what you did in 1-3 lines. No preamble, no "Sure!", no summaries of what you're about to do.
- Git: `feature/x` or `fix/x` branches. Lowercase imperative commit messages. No Co-Authored-By.

## Stack
Next.js 16 (App Router) · React 19 · TailwindCSS 4 · TanStack Query 5 · Zustand · Framer Motion · Prisma 7 (pg adapter) · PostgreSQL · Clerk · Vitest/MSW/Playwright · Vercel · Azure PostgreSQL

## Structure
```
web/src/
├── app/api/search/combined/  # Main search endpoint (products + marinas in 1 call)
├── app/api/search/ai/        # AI search (NL → Phi-4-mini keywords → FTS)
├── app/api/search/           # Legacy product-only search
├── app/api/bundles/          # AI crew essentials bundles
├── app/api/marinas/          # Marina DB + Overpass fallback
├── app/api/products/         # CRUD, trending, offers
├── app/api/orders/           # Order management
├── app/api/categories/       # Category list
├── app/browse/               # Browse page
├── app/search/               # Search page (main flow)
├── app/product/[id]/         # Product detail
├── app/orders/               # Order history
├── components/ui/            # shadcn — DO NOT edit directly
├── components/search/        # SearchBar, SearchResults
├── components/product/       # ProductCard, FilterSheet, BundleCard
├── components/checkout/      # CheckoutSheet
├── components/layout/        # BottomNav, Providers
├── lib/hooks/                # useCombinedSearch, useFilteredProducts, useSearchInput, useBundles
├── lib/ai.ts                 # Azure AI client (Phi-4-mini)
├── lib/bundles/definitions.ts # Static bundle configs
├── lib/prisma.ts             # Prisma singleton
├── lib/env.ts                # APP_ENV: development | preview | production
├── store/*.store.ts          # Zustand: cart, filter, ui
├── types/index.ts            # ALL types here. Don't create new type files.
└── test/                     # MSW mocks, fixtures, e2e specs
scraper/                      # Python scraper (separate)
```

## How Things Work

**Search flow:**
```
Input → useSearchInput (300ms debounce) → useCombinedSearch
  Short keywords ("anchor rope") → GET /api/search/combined?q=&limit=20
    Server: Promise.allSettled([productFTS, marinaSearch])
    Returns: { products[], marinas[] }
  Natural language (>3 words, "?", what/how/...) → GET /api/search/ai?q=&limit=20
    Server: Phi-4-mini extracts keywords → multi-keyword FTS search → dedupe
    Returns: { products[], marinas[], aiContext }
```

**AI integration (two-model architecture):**
```
Azure AI Services (Sweden Central)
  Phi-4-mini  → AI search keyword extraction (/api/search/ai)
  GPT-4o-mini → Chat planner + conversational responder (/api/chat)
  Auth: api-key header (NOT Bearer)
  URL: {endpoint}/openai/deployments/{model}/chat/completions?api-version=2024-10-21
  Env: AZURE_AI_ENDPOINT, AZURE_AI_API_KEY, AZURE_AI_DEPLOYMENT, AZURE_AI_CHAT_DEPLOYMENT
```

**Chat flow:**
```
Message → regex chitchat check → GPT-4o-mini planner (JSON) → FTS retrieval
  → relevance filter → GPT-4o-mini responder (multi-turn history + [PRODUCTS])
  → { message, products[], marinas[] }
Chitchat (hello/thanks) → skip planner+DB → responder only
```

**Data flow rules:**
- Server state = TanStack Query. Client state = Zustand. Never mix.
- Parent fetches → pass as props. Don't re-fetch in children.
- API responses: `{ data: T }` or `{ products, marinas }` (combined). Errors: `{ error: string }`
- Prices: `Decimal(10,2)` in DB → `number` in API responses

**DB:**
- FTS/trgm queries = `prisma.$queryRaw` (Prisma has no tsvector support)
- Bulk writes = `INSERT ... ON CONFLICT (osm_id) DO NOTHING` with UNNEST arrays
- `search_vector` is `Unsupported("tsvector")` in schema — raw SQL only
- Migrations are hand-written SQL, not Prisma auto-generated

## Scripts (`cd web`)
| Script | Does |
|--------|------|
| `npm run dev` | Dev server :3000 |
| `npm run test` | Vitest unit/integration |
| `npm run test:e2e` | Playwright headless |
| `npm run migrate:dev` | Migrate local DB |
| `npm run migrate:prod` | Migrate Azure prod (uses `.env.production.local`) |
| `npx prisma generate` | Regen client after schema change |

## Env
- `NEXT_PUBLIC_APP_ENV`: `development` (local) · `preview` (Vercel preview) · `production` (Vercel prod)
- `AZURE_AI_ENDPOINT`: Azure AI Services base URL (server-side only)
- `AZURE_AI_API_KEY`: API key for Azure AI (server-side only)
- `AZURE_AI_DEPLOYMENT`: Model deployment name, default `phi-4-mini` (server-side only)
- `AZURE_AI_CHAT_DEPLOYMENT`: Chat model deployment, default `gpt-4o-mini` (server-side only)
- `prisma.config.ts` loads `.env.local` only if `DATABASE_URL` isn't already set
- Prod DB: Azure PostgreSQL (`sslmode=require`)
- CI: GitHub Actions → test → migrate → deploy

## Hard Rules (things that broke before)
- `CONCURRENTLY` in migrations = error (Prisma wraps in transactions)
- `pg_trgm` must be allow-listed on Azure before use
- `DATABASE_URL` must not have trailing `\n`
- `!` in passwords → URL-encode as `%21`
- New env vars → update `.env.local` AND Vercel dashboard (prod + preview)
- shadcn components (`components/ui/`) → use `npx shadcn@latest add`, never edit manually
- `cn()` lives in `@/lib/utils`, not `@/lib/utils/cn`
- Cache-Control on every new GET route: `public, s-maxage=60, stale-while-revalidate=300`
- Azure AI uses `api-key` header, NOT `Authorization: Bearer` — will 401 with wrong auth method
- Phi-4-mini ignores system prompts for structured extraction — use single user-message with examples
- Meta Llama models blocked on Azure for Students (TN billing) — use Microsoft models (Phi-4) instead

## When You Need More Context
- `HACKATHON_BRIEF.md` — **Read this first for product decisions.** The judging criteria and deliverables.

Read the relevant file in `internal_docs/`:
- `ARCHITECTURE.md` — full system design, data flow, component tree
- `DEPLOYMENT.md` — Vercel config, env vars, deploy process
- `azure-db-config.md` — Azure DB, firewall, migration history, troubleshooting
- `search-optimization.md` — FTS/trgm/ILIKE chain, combined endpoint, perf details
- `test-infrastructure.md` — Vitest/MSW/Playwright setup, mocks, CI integration
- `SCRAPER.md` — Python scraper, cleaning pipeline, dedup
- `azure-ai-config.md` — Phi-4-mini deployment, prompts, rate limits, troubleshooting
- `azure-resources.md` — All Azure resources, costs, CLI commands
