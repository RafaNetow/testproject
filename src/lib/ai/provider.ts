import "server-only";

/**
 * The one place that talks to the language model. Any OpenAI-compatible
 * endpoint works: DeepSeek's API today, an EU-hosted DeepSeek deployment
 * tomorrow — only the AI_* variables in .env.local change.
 *
 * The key is read here, on the server, and never sent to the browser.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class AiUnavailableError extends Error {}

export function aiConfigured() {
  return process.env.AI_ENABLED === "true" && Boolean(process.env.AI_API_KEY);
}

export function aiModel() {
  return process.env.AI_MODEL || "deepseek-chat";
}

export async function chat({ messages, maxTokens = 700 }: { messages: ChatMessage[]; maxTokens?: number }): Promise<string> {
  if (!aiConfigured()) throw new AiUnavailableError("The AI assistant is not configured.");

  const base = (process.env.AI_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.AI_API_KEY}` },
    body: JSON.stringify({ model: aiModel(), messages, temperature: 0.2, max_tokens: maxTokens, stream: false }),
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });

  if (!res.ok) {
    // Never echo the provider's response body to the user — it can include request details.
    console.error(`AI provider error ${res.status}`);
    throw new AiUnavailableError("The assistant couldn't answer right now. Please try again, or ask Axel.");
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new AiUnavailableError("The assistant returned an empty answer. Please try again.");
  return text;
}
