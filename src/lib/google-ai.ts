// Server-only shared AI service for every FamilyBuddy app.
// One low-cost Google Gemini call per answer through Lovable AI (server key only).

export type ChatTurn = { role: "user" | "assistant"; content: string };

// Free-tier Gemini models. Chat uses the model with the largest free daily quota;
// diagrams use the slightly smarter one for accurate geometry.
export const GEMINI_MODELS = {
  chat: "google/gemini-3.1-flash-lite",
  diagram: "google/gemini-3.8-flash",
} as const;

export class AIError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Pure: turn a failed Google response into a kid-friendly error.
export function classifyGoogleError(status: number, bodyText: string): AIError {
  const t = bodyText || "";
  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(t)) {
    return new AIError(429, "rate_limited", "Buddy is resting for a moment (the free AI limit was reached). Please try again in a minute.");
  }
  if (/API_KEY_INVALID|API key not valid/i.test(t) || status === 401 || status === 403) {
    return new AIError(503, "server_not_configured", "The buddy's AI key isn't working right now. A grown-up needs to check the setup.");
  }
  if (status >= 500) {
    return new AIError(503, "upstream_error", "Google's AI is busy right now. Please try again in a moment.");
  }
  return new AIError(502, "upstream_error", "The AI had a problem. Please try again.");
}

// Pure: convert chat turns to Gemini's format (assistant -> model).
export function toGeminiContents(messages: ChatTurn[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

export async function askGoogle(options: {
  system: string;
  messages: ChatTurn[];
  maxTokens: number;
  model?: string;
  thinkingBudget?: number;
}): Promise<{ text: string; truncated: boolean }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    throw new AIError(503, "server_not_configured", "The buddy's AI isn't set up yet.");
  }
  let res: Response;
  try {
    res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: options.model ?? GEMINI_MODELS.chat,
        max_tokens: options.maxTokens,
        messages: [{ role: "system", content: options.system }, ...options.messages],
      }),
    });
  } catch {
    throw new AIError(503, "upstream_error", "Couldn't reach the AI. Please try again.");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("AI error", res.status, body.slice(0, 300));
    if (res.status === 402) throw new AIError(402, "rate_limited", "The buddies are out of AI credits for now. Please try again later.");
    throw classifyGoogleError(res.status, body);
  }
  const data = (await res.json().catch(() => null)) as any;
  const choice = data?.choices?.[0];
  const text = String(choice?.message?.content ?? "").trim();
  if (!text) throw new AIError(502, "empty_completion", "I didn't come up with an answer. Try asking in a different way.");
  return { text, truncated: choice?.finish_reason === "length" };
}
