// Server-only shared AI service for every FamilyBuddy app.
// Calls Google Gemini directly with the owner's own Google AI Studio key
// (GEMINI_API_KEY, a server secret). The key is never sent to the browser.

export type ChatTurn = { role: "user" | "assistant"; content: string };

// Free-tier Gemini models. Chat uses the model with the largest free daily quota;
// diagrams use the slightly smarter one for accurate geometry.
export const GEMINI_MODELS = {
  chat: "gemini-2.5-flash-lite",
  diagram: "gemini-2.5-flash",
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
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new AIError(503, "server_not_configured", "The buddy's AI isn't set up yet. A grown-up needs to add the Google AI key.");
  }
  const model = options.model ?? GEMINI_MODELS.chat;
  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: options.system }] },
          contents: toGeminiContents(options.messages),
          generationConfig: {
            maxOutputTokens: options.maxTokens,
            thinkingConfig: { thinkingBudget: options.thinkingBudget ?? 0 },
          },
        }),
      },
    );
  } catch {
    throw new AIError(503, "upstream_error", "Couldn't reach Google's AI. Please try again.");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("Gemini error", res.status, body.slice(0, 300));
    throw classifyGoogleError(res.status, body);
  }
  const data = (await res.json().catch(() => null)) as any;
  if (data?.promptFeedback?.blockReason) {
    throw new AIError(400, "refused", "I can't help with that one. Let's talk about something else.");
  }
  const cand = data?.candidates?.[0];
  const text = (cand?.content?.parts ?? [])
    .map((p: any) => (typeof p?.text === "string" && !p.thought ? p.text : ""))
    .join("")
    .trim();
  if (!text) {
    if (cand?.finishReason === "SAFETY") {
      throw new AIError(400, "refused", "I can't help with that one. Let's talk about something else.");
    }
    throw new AIError(502, "empty_completion", "I didn't come up with an answer. Try asking in a different way.");
  }
  return { text, truncated: cand?.finishReason === "MAX_TOKENS" };
}
