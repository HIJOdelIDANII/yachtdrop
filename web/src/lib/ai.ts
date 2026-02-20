/**
 * Azure AI client for YachtDrop.
 *
 * Two deployments on Azure AI Services (Sweden Central):
 * - phi-4-mini: Used for AI search keyword extraction (cheap, fast, sufficient for structured output)
 * - gpt-4o-mini: Used for chat conversation (better at multi-turn, context tracking, natural language)
 *
 * Auth: Uses `api-key` header (NOT Bearer token — Azure AI Services uses this format).
 * API: OpenAI-compatible chat completions endpoint with api-version query param.
 *
 * Both functions return null on failure (network error, 401, rate limit, etc.)
 * so callers can gracefully degrade.
 */

const AZURE_AI_ENDPOINT = process.env.AZURE_AI_ENDPOINT;
const AZURE_AI_API_KEY = process.env.AZURE_AI_API_KEY;
const AZURE_AI_DEPLOYMENT = process.env.AZURE_AI_DEPLOYMENT || "phi-4-mini";
const AZURE_AI_CHAT_DEPLOYMENT = process.env.AZURE_AI_CHAT_DEPLOYMENT || "gpt-4o-mini";

interface AiCompletionOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  /** Override the default deployment. Use "gpt-4o-mini" for chat, "phi-4-mini" for extraction. */
  deployment?: string;
}

interface AiChatOptions {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
  /** Override the default deployment. */
  deployment?: string;
}

/**
 * Single-turn completion: system + user message → response.
 * If system is empty string, only the user message is sent
 * (Phi-4-mini ignores system prompts for structured extraction).
 */
export async function aiComplete({
  system,
  user,
  maxTokens = 200,
  temperature = 0.3,
  deployment,
}: AiCompletionOptions): Promise<string | null> {
  if (!AZURE_AI_ENDPOINT || !AZURE_AI_API_KEY) {
    console.warn("Azure AI not configured — AZURE_AI_ENDPOINT or AZURE_AI_API_KEY missing");
    return null;
  }

  const model = deployment || AZURE_AI_DEPLOYMENT;
  const url = `${AZURE_AI_ENDPOINT}openai/deployments/${model}/chat/completions?api-version=2024-10-21`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_AI_API_KEY,
      },
      body: JSON.stringify({
        messages: system
          ? [
              { role: "system", content: system },
              { role: "user", content: user },
            ]
          : [{ role: "user", content: user }],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Azure AI error: ${res.status} ${res.statusText}`, body);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.error("Azure AI request failed:", err);
    return null;
  }
}

/**
 * Multi-turn chat completion: full message array → response.
 * Used for conversational AI where the model needs to see
 * the full history to maintain context.
 */
export async function aiChatComplete({
  messages,
  maxTokens = 200,
  temperature = 0.3,
  deployment,
}: AiChatOptions): Promise<string | null> {
  if (!AZURE_AI_ENDPOINT || !AZURE_AI_API_KEY) {
    console.warn("Azure AI not configured — AZURE_AI_ENDPOINT or AZURE_AI_API_KEY missing");
    return null;
  }

  const model = deployment || AZURE_AI_DEPLOYMENT;
  const url = `${AZURE_AI_ENDPOINT}openai/deployments/${model}/chat/completions?api-version=2024-10-21`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_AI_API_KEY,
      },
      body: JSON.stringify({ messages, max_tokens: maxTokens, temperature }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Azure AI chat error: ${res.status} ${res.statusText}`, body);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.error("Azure AI chat request failed:", err);
    return null;
  }
}
