# Azure AI Configuration — YachtDrop

## Resource

| Field | Value |
|-------|-------|
| Account name | `yachtdrop-ai` |
| Kind | AIServices (S0) |
| Location | Sweden Central |
| Resource group | `yachtdrop-rg` |
| Subscription | Azure for Students |

## Deployments

| Deployment | Model | SKU | Use Case |
|------------|-------|-----|----------|
| `phi-4-mini` | Phi-4-mini-instruct (Microsoft) | GlobalStandard (cap 1) | AI search keyword extraction (`/api/search/ai`) |
| `gpt-4o-mini` | GPT-4o-mini (OpenAI) | GlobalStandard (cap 10) | Chat planner + conversational responder (`/api/chat`) |

## Two-Model Chat Architecture

```
User message
    │
    ├─ Chitchat? (regex) ──Yes──▶ GPT-4o-mini (responder only, no search)
    │                              └─▶ { message, products: [] }
    No
    │
    ▼
GPT-4o-mini (planner)
    │  Input: catalog context + conversation history + user message
    │  Output: { queries: ["boat cover", ...], categories: [...], priceMax: null }
    │  Fallback: keyword extraction if JSON parse fails
    │
    ▼
PostgreSQL FTS (search_vector)
    │  1. AND query (all words match) — highest precision
    │  2. OR fallback if AND returns 0 — broader recall
    │  3. ILIKE fallback if FTS throws
    │
    ▼
Post-retrieval relevance filter
    │  Tokenize product names → count keyword hits → rank multi-match first
    │  Removes false positives (e.g. "boathook" for "boat cover")
    │
    ▼
GPT-4o-mini (responder)
    │  Input: system prompt + full conversation history (real turns) + [PRODUCTS] block
    │  Output: natural language response referencing actual products
    │
    ▼
Response: { message, products[], marinas[] }
```

### Why Two Calls (Not One)

- **Planner** needs structured JSON output (search queries). Low temperature (0.1), short max_tokens (150).
- **Responder** needs creative natural language. Higher temperature (0.6), longer max_tokens (250).
- Splitting them lets us inject real DB products between the calls, so the responder never hallucinates product names.

### Chitchat Fast Path

Greetings, thanks, yes/no are detected by regex — no planner or DB call needed. Saves ~2s latency and 1 API call. The responder still sees full conversation history for context.

## Why Phi-4-mini (for AI Search)

Meta Llama models require Azure Marketplace subscription, blocked on Azure for Students (TN billing). Microsoft Phi-4-mini is first-party, no marketplace approval needed. Used only for `/api/search/ai` keyword extraction — fast and cheap for structured output.

## Why GPT-4o-mini (for Chat)

Phi-4-mini failed at conversation: returned garbage JSON ~40% of the time, couldn't track multi-turn context, generated repetitive responses, and ignored product lists in its answers. GPT-4o-mini handles all of this reliably at ~$0.15/1M input tokens.

## Endpoint Details

```
Base URL:   https://swedencentral.api.cognitive.microsoft.com/
Phi-4:      {base}openai/deployments/phi-4-mini/chat/completions?api-version=2024-10-21
GPT-4o-m:   {base}openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-10-21
Auth:       api-key header (NOT Bearer token)
```

## Rate Limits & Cost

### Phi-4-mini (AI Search)

| Metric | Value |
|--------|-------|
| TPM | ~200K |
| RPM | ~1000 |
| Input pricing | ~$0.00015 / 1K tokens |
| Output pricing | ~$0.0006 / 1K tokens |
| Latency | 200–500ms |

### GPT-4o-mini (Chat)

| Metric | Value |
|--------|-------|
| TPM | 10K |
| RPM | 100 |
| Input pricing | ~$0.15 / 1M tokens |
| Output pricing | ~$0.60 / 1M tokens |
| Avg tokens per chat call | ~300 input + ~100 output |
| Cost per chat message | ~$0.0001 (planner) + ~$0.0001 (responder) |
| Latency | 500ms–2s |

For a hackathon demo, both deployments are effectively unlimited and nearly free.

## Environment Variables

| Variable | Value | Where |
|----------|-------|-------|
| `AZURE_AI_ENDPOINT` | `https://swedencentral.api.cognitive.microsoft.com/` | `.env.local`, Vercel (prod + preview) |
| `AZURE_AI_API_KEY` | `y4Twnk...VmZ6` (86 chars) | `.env.local`, Vercel (prod + preview) |
| `AZURE_AI_DEPLOYMENT` | `phi-4-mini` | `.env.local`, Vercel (prod + preview) |
| `AZURE_AI_CHAT_DEPLOYMENT` | `gpt-4o-mini` | `.env.local`, Vercel (prod + preview) |

All server-side only (no `NEXT_PUBLIC_` prefix) — never exposed to the browser.

## How It's Used

### AI Search (`/api/search/ai`)
User types natural language → Phi-4-mini extracts keywords → FTS search → results returned with AI context.

### Chat (`/api/chat`)
Two-model pipeline per message. See architecture diagram above.

### AI Bundles (`/api/bundles/generate` — dev only)
One-time generation of bundle definitions. Not used in production.

## Prompt Engineering Notes

### Phi-4-mini (AI Search)
- Ignores system prompts for structured extraction → use single user message
- Keep `max_tokens` low (50–60) for concise output
- `temperature: 0.1` for deterministic extraction
- Include examples in the prompt (few-shot)

### GPT-4o-mini (Chat Planner)
- Returns reliable JSON when prompted clearly
- Include the full catalog context so it can match real category names
- Include conversation history for context-dependent queries ("something cheaper")
- `temperature: 0.1` for structured output

### GPT-4o-mini (Chat Responder)
- Pass conversation as real multi-turn messages (not flattened text)
- Inject products as `[PRODUCTS]` block in last user message
- System prompt emphasizes: ONLY reference provided products, NEVER invent
- `temperature: 0.6` for natural conversation

## CLI Commands

```bash
# List deployments
az cognitiveservices account deployment list \
  --name yachtdrop-ai -g yachtdrop-rg -o table

# Check specific deployment
az cognitiveservices account deployment show \
  --name yachtdrop-ai -g yachtdrop-rg \
  --deployment-name gpt-4o-mini -o table

# Get API keys
az cognitiveservices account keys list \
  --name yachtdrop-ai -g yachtdrop-rg

# Regenerate key (if compromised)
az cognitiveservices account keys regenerate \
  --name yachtdrop-ai -g yachtdrop-rg --key-name key1

# Test phi-4-mini
curl -s "https://swedencentral.api.cognitive.microsoft.com/openai/deployments/phi-4-mini/chat/completions?api-version=2024-10-21" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_AI_API_KEY" \
  -d '{"messages":[{"role":"user","content":"Keywords for: anchor rope\n\nKeywords:"}],"max_tokens":30,"temperature":0.1}'

# Test gpt-4o-mini
curl -s "https://swedencentral.api.cognitive.microsoft.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-10-21" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_AI_API_KEY" \
  -d '{"messages":[{"role":"user","content":"say hello"}],"max_tokens":20}'

# Deploy a new model
az cognitiveservices account deployment create \
  -g yachtdrop-rg -n yachtdrop-ai \
  --deployment-name <name> --model-name <model> \
  --model-version <version> --model-format OpenAI \
  --sku-capacity 10 --sku-name "GlobalStandard"

# Delete deployment
az cognitiveservices account deployment delete \
  --name yachtdrop-ai -g yachtdrop-rg \
  --deployment-name <name>
```

## Files That Use Azure AI

| File | Purpose |
|------|---------|
| `web/src/lib/ai.ts` | Client wrapper — deployment routing, auth, error handling |
| `web/src/lib/search.ts` | Catalog context builder, FTS search, multi-query retrieval |
| `web/src/app/api/chat/route.ts` | Chat endpoint — two-model pipeline (planner + responder) |
| `web/src/app/api/search/ai/route.ts` | AI search endpoint — Phi-4-mini keyword extraction |
| `web/src/app/api/bundles/generate/route.ts` | Bundle generator (dev only) |
| `web/src/lib/hooks/useCombinedSearch.ts` | Routes NL queries to `/api/search/ai` |

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Wrong API key or Bearer auth | Check `AZURE_AI_API_KEY`, use `api-key` header (not `Authorization: Bearer`) |
| `404 DeploymentNotFound` | Wrong deployment name or missing api-version | Verify deployment exists: `az cognitiveservices account deployment list ...` |
| Planner returns garbage JSON | Model confused by long prompt | JSON regex extraction handles this; keyword fallback kicks in |
| Chat returns 0 products | FTS AND too strict | OR fallback handles multi-word queries; keyword extraction strips stop words |
| Irrelevant products in chat | FTS stem-matching false positives | Post-retrieval relevance filter scores by keyword overlap |
| `429 Too Many Requests` | Rate limit hit | Increase capacity: `az cognitiveservices account deployment create ... --sku-capacity 20` |
| Marketplace error on Llama | TN billing country restriction | Use Microsoft (Phi-4) or OpenAI (GPT-4o-mini) models instead |
| Chat responses hallucinate products | Responder ignoring [PRODUCTS] block | System prompt enforces "ONLY from the list"; lower temperature helps |
