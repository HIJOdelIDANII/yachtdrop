/**
 * POST /api/chat — Conversational AI shopping assistant.
 *
 * Two-model architecture:
 *   1. GPT-4o-mini (planner) — extracts search queries from natural language
 *   2. GPT-4o-mini (responder) — generates conversational response with product context
 *
 * Pipeline per request:
 *   User message → chitchat check → planner → FTS retrieval → relevance filter → responder
 *
 * Chitchat fast-path skips planner + retrieval entirely (regex-detected).
 * Planner outputs structured JSON {queries, categories, priceMax} for DB search.
 * If planner fails, keyword extraction fallback ensures search still works.
 * Post-retrieval filter removes false positives (e.g. "boathook" for "boat cover").
 * Responder gets full multi-turn history as real message turns, not flattened text.
 */
import { aiComplete, aiChatComplete } from "@/lib/ai";
import { getCatalogContext, retrieve, getCategoryName } from "@/lib/search";
import { NextRequest, NextResponse } from "next/server";

const MAX_EXCHANGES = 6; // Keep last 12 messages (6 user + 6 assistant)
const CHAT_MODEL = "gpt-4o-mini";

// ── Intent detection (no AI call needed) ──────────────────────────
// Regex-based chitchat detection saves ~2s + API cost per greeting/thanks.
// These messages don't need product search — go straight to responder.

const CHITCHAT_PATTERNS = [
  /^(hi|hey|hello|yo|sup|howdy|greetings|good\s*(morning|afternoon|evening))[\s!.?]*$/i,
  /^(thanks?|thank\s*you|thx|cheers|great|cool|ok(ay)?|got\s*it|perfect|nice|awesome)[\s!.?]*$/i,
  /^(bye|goodbye|see\s*you|later|cya)[\s!.?]*$/i,
  /^(yes|no|yeah|nah|yep|nope|sure)[\s!.?]*$/i,
];

function isChitChat(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return true;
  return CHITCHAT_PATTERNS.some((p) => p.test(trimmed));
}

// ── Keyword extraction ────────────────────────────────────────────
// Used as fallback when planner fails to parse, and for post-retrieval
// relevance scoring. Strips stop words to get product-relevant terms.

const STOP_WORDS = new Set([
  "i", "me", "my", "we", "our", "you", "your", "the", "a", "an", "is", "are",
  "was", "were", "be", "been", "do", "does", "did", "have", "has", "had",
  "will", "would", "could", "should", "can", "may", "might", "shall",
  "not", "no", "nor", "but", "or", "and", "if", "then", "so", "than",
  "too", "very", "just", "about", "above", "after", "all", "also", "any",
  "because", "before", "between", "both", "by", "each", "for", "from",
  "get", "got", "here", "how", "in", "into", "it", "its", "like", "make",
  "more", "most", "much", "need", "of", "on", "one", "only", "other",
  "out", "over", "own", "same", "some", "such", "that", "their", "them",
  "there", "these", "they", "this", "to", "up", "us", "want", "what",
  "when", "where", "which", "while", "who", "with",
  "find", "show", "give", "looking", "something", "anything", "please",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s€$]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

// ── History truncation ────────────────────────────────────────────

function truncateHistory(
  messages: { role: string; content: string }[]
): { role: string; content: string }[] {
  if (messages.length <= MAX_EXCHANGES * 2) return messages;
  return messages.slice(-MAX_EXCHANGES * 2);
}

// ── Planner prompt ────────────────────────────────────────────────
// Converts natural language into structured search plan.
// Receives the full product catalog summary so it can match category names.
// Includes conversation history for context-dependent queries ("something cheaper").

function buildPlannerPrompt(
  messages: { role: string; content: string }[],
  catalog: string,
  previousProducts: string[]
): string {
  const latest = messages[messages.length - 1]?.content || "";
  const history = messages.length > 1
    ? "Conversation:\n" +
      messages.slice(-5, -1).map((m) => `${m.role}: ${m.content}`).join("\n") + "\n\n"
    : "";
  const prevContext = previousProducts.length > 0
    ? `Previously shown: ${previousProducts.join(", ")}\n`
    : "";

  return `You are a search query planner for YachtDrop, a marine/yacht supplies e-commerce store.

${catalog}
${prevContext}
${history}Customer: "${latest}"

Output ONLY valid JSON. No markdown, no explanation.
{"queries":["phrase1","phrase2"],"categories":["Cat Name"],"priceMax":null}

Rules:
1. queries = 1-4 search phrases for our product database. Keep multi-word terms together ("boat cover", "LED light", not "boat","cover")
2. categories = 0-3 category names from the list above (exact match)
3. priceMax = number if budget mentioned, else null
4. "something cheaper" / "alternatives" → use conversation context to search same product type
5. Brand queries ("3M", "PLASTIMO") → include brand name in queries`;
}

// ── Conversational system prompt ──────────────────────────────────
// GPT-4o-mini receives this + full multi-turn history + [PRODUCTS] block.
// Key constraint: NEVER invent products — only reference the provided list.

const SYSTEM_PROMPT = `You are YachtDrop's AI shopping assistant — a friendly, knowledgeable marine expert.

Rules:
- Be warm, conversational, concise (2-4 sentences max)
- When [PRODUCTS] are provided, recommend 2-4 items by name with € prices. ONLY mention products from the list — NEVER invent names or prices
- When no [PRODUCTS] are provided, chat naturally
- Remember the full conversation and reference earlier topics naturally
- End with a brief follow-up question or suggestion
- Use € for all prices`;

// ── Main handler ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawMessages: { role: string; content: string }[] = body.messages || [];
    const limit = Math.min(30, Math.max(1, Number(body.limit ?? 12)));
    const previousProducts: string[] = Array.isArray(body.previousProducts)
      ? body.previousProducts.slice(0, 12)
      : [];

    if (!rawMessages.length || !rawMessages[rawMessages.length - 1]?.content?.trim()) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const messages = truncateHistory(rawMessages);
    const userText = messages[messages.length - 1].content;

    // ── Fast path: chitchat ───────────────────────────────────────
    // Greetings, thanks, yes/no → skip planner + DB, go straight to GPT-4o-mini.
    // Saves ~2s latency and 1 API call.
    if (isChitChat(userText)) {
      const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: SYSTEM_PROMPT },
      ];
      for (const msg of messages) {
        chatMessages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
      const answer = await aiChatComplete({
        messages: chatMessages,
        maxTokens: 150,
        temperature: 0.7,
        deployment: CHAT_MODEL,
      });
      return NextResponse.json({
        message: answer || "Hey! How can I help you find marine supplies today?",
        products: [],
        marinas: [],
      });
    }

    // ── Step 1: Planner (GPT-4o-mini) ─────────────────────────────
    // Extracts structured search intent from natural language.
    // getCatalogContext() is cached for 10 min so subsequent calls are instant.
    const keywords = extractKeywords(userText);
    const catalog = await getCatalogContext();
    const plannerRaw = await aiComplete({
      system: "",
      user: buildPlannerPrompt(messages, catalog, previousProducts),
      maxTokens: 150,
      temperature: 0.1,
      deployment: CHAT_MODEL,
    });

    // ── Build search plan with keyword fallback ───────────────────
    // If planner returns valid JSON, use it. Otherwise, fall back to
    // keyword extraction: full phrase first (best FTS match), then
    // individual keywords for broader coverage.
    const fallbackQueries = keywords.length > 1
      ? [keywords.join(" "), ...keywords]
      : keywords.length > 0
        ? keywords
        : [userText];

    let plan = {
      queries: fallbackQueries,
      categories: [] as string[],
      priceMax: null as number | null,
    };

    if (plannerRaw) {
      try {
        // Extract JSON even if wrapped in markdown or extra text
        const jsonMatch = plannerRaw.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : plannerRaw);
        if (Array.isArray(parsed.queries) && parsed.queries.length > 0) {
          const planQueries = parsed.queries as string[];
          // Always prepend the user's full keyword phrase — planner may
          // rephrase it, but the original terms often match better in FTS.
          const fullPhrase = keywords.join(" ");
          if (fullPhrase && !planQueries.some((q: string) => q.toLowerCase() === fullPhrase.toLowerCase())) {
            planQueries.unshift(fullPhrase);
          }
          plan = {
            queries: planQueries.slice(0, 6),
            categories: Array.isArray(parsed.categories) ? parsed.categories : [],
            priceMax: typeof parsed.priceMax === "number" ? parsed.priceMax : null,
          };
        }
      } catch {
        // JSON parse failed — keyword fallback already set above
      }
    }

    // ── Step 2: DB Retrieval ──────────────────────────────────────
    let products = await retrieve(plan, limit);

    // ── Step 3: Post-retrieval relevance filter ───────────────────
    // FTS returns results matching ANY query term, which can include
    // false positives (e.g. "boathook" matching "boat" when user asked
    // for "boat cover"). We re-score results by counting how many
    // user keywords appear as whole words in the product text.
    //
    // Matching logic: exact word match + simple plural handling
    // (k="cover" matches "cover" and "covers").
    //
    // If enough products match 2+ keywords, we filter out single-
    // keyword matches to boost precision. Otherwise keep all matches.
    if (keywords.length > 0 && products.length > 3) {
      const scored = products.map((p) => {
        const words = `${p.name} ${p.brand || ""} ${p.shortDesc || ""}`
          .toLowerCase()
          .replace(/[^\w\s]/g, " ")
          .split(/\s+/);
        const hits = keywords.filter((k) =>
          words.some((w) => w === k || w.startsWith(k + "s") || w.startsWith(k + "es"))
        ).length;
        return { product: p, hits };
      });
      scored.sort((a, b) => b.hits - a.hits);

      const multiMatch = scored.filter((s) => s.hits >= 2);
      if (multiMatch.length >= 3 && keywords.length >= 2) {
        products = multiMatch.map((s) => s.product);
      } else {
        products = scored.filter((s) => s.hits > 0).map((s) => s.product);
        if (products.length < 3) {
          products = scored.map((s) => s.product);
        }
      }
    }

    // ── Step 4: Build product context for responder ───────────────
    // Products are injected as a [PRODUCTS] block in the last user message.
    // GPT-4o-mini is instructed to ONLY reference products from this list.
    let productContext = "";
    if (products.length > 0) {
      const summaries = await Promise.all(
        products.slice(0, 10).map(async (p) => {
          const cat = await getCategoryName(p.categoryId as string);
          const brand = p.brand ? ` by ${p.brand}` : "";
          const desc = p.shortDesc ? ` — ${p.shortDesc}` : "";
          return `- ${p.name}${brand} | €${(p.price as number).toFixed(2)} | ${cat}${desc}`;
        })
      );
      productContext = `\n[PRODUCTS found for this query]\n${summaries.join("\n")}\n[/PRODUCTS]`;
    }

    // ── Step 5: Conversational response (GPT-4o-mini) ─────────────
    // Full conversation history is passed as real user/assistant turns
    // (not flattened text), so GPT-4o-mini naturally tracks context.
    const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];
    for (const msg of messages.slice(0, -1)) {
      chatMessages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }
    chatMessages.push({
      role: "user",
      content: products.length > 0 ? `${userText}${productContext}` : userText,
    });

    const answerRaw = await aiChatComplete({
      messages: chatMessages,
      maxTokens: 250,
      temperature: 0.6,
      deployment: CHAT_MODEL,
    });

    const message =
      answerRaw ||
      (products.length > 0
        ? `Here are ${products.length} products I found for you!`
        : "Hey! I'm here to help you find marine supplies. What are you looking for?");

    return NextResponse.json({
      message,
      products,
      marinas: [],
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
