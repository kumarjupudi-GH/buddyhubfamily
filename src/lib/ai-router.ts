// Server-only lightweight router: ONE AI call per answer, chosen by the question.
// Claude (Haiku) = tutoring/explanations, ChatGPT = coding & structured reasoning,
// Gemini = everyday answers and visuals. On failure, one fallback to Gemini.
import { askGoogle, AIError, type ChatTurn } from "@/lib/google-ai";

export type Provider = "claude" | "chatgpt" | "gemini";
export const ROUTER_MODELS = {
  claude: "anthropic/claude-haiku-4-5",
  chatgpt: "openai/gpt-6.1-terra",
  gemini: "google/gemini-3.1-flash-lite",
} as const;

// Monthly answer budget for the 80% alert (all providers together).
export const MONTHLY_ANSWER_BUDGET = 1000;

const CODE_RX = /\b(code|coding|python|javascript|java|html|css|sql|scratch|program(ming)?|function|algorithm|debug|bug|loop|variable)\b/i;
const REASON_RX = /\b(prove|proof|logic puzzle|step[- ]by[- ]step|compare and contrast|pros and cons|plan out)\b/i;
const TUTOR_RX = /\b(why|how (does|do|is|are|can|to)|explain|what is|what are|solve|equation|calculate|teach|understand|meaning of|homework|math|science|history|grammar|photosynthesis|fraction|planet|orbit)\b/i;

// Pure: pick the provider for the latest question.
export function pickProvider(question: string, mode: "tutor" | "buddy"): Provider {
  const q = question || "";
  if (CODE_RX.test(q)) return "chatgpt";
  if (REASON_RX.test(q)) return "chatgpt";
  if (mode === "tutor") return "claude";
  if (TUTOR_RX.test(q) || q.length > 220) return "claude";
  return "gemini";
}

async function askClaude(system: string, messages: ChatTurn[], maxTokens: number) {
  const { generateMessage, GatewayError } = await import("@lovable.dev/ai-gateway");
  try {
    const res = await generateMessage({ model: ROUTER_MODELS.claude, system, max_tokens: maxTokens, messages });
    const text = (res.content || []).map((b: { type: string; text?: string }) => (b.type === "text" ? b.text : "")).join("").trim();
    if (!text) throw new AIError(502, "empty_completion", "I didn't come up with an answer. Try asking in a different way.");
    return { text, truncated: res.stop_reason === "max_tokens" };
  } catch (e) {
    if (e instanceof GatewayError && e.httpStatus === 402) throw new AIError(402, "rate_limited", "The buddies are out of AI credits for now. Please try again later.");
    if (e instanceof AIError) throw e;
    throw new AIError(503, "upstream_error", "The AI is busy right now. Please try again in a moment.");
  }
}

async function call(p: Provider, system: string, messages: ChatTurn[], maxTokens: number) {
  if (p === "claude") return askClaude(system, messages, maxTokens);
  return askGoogle({ system, messages, maxTokens, model: ROUTER_MODELS[p] });
}

async function recordUsage(provider: Provider) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("bump_monthly_usage", { _provider: provider });
  } catch (e) {
    console.error("usage count failed", e);
  }
}

export async function routedAnswer(opts: { system: string; messages: ChatTurn[]; maxTokens: number; mode: "tutor" | "buddy" }) {
  const last = [...opts.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const primary = pickProvider(last, opts.mode);
  try {
    const r = await call(primary, opts.system, opts.messages, opts.maxTokens);
    await recordUsage(primary);
    return { ...r, provider: primary };
  } catch (e) {
    // Out of credits affects every provider; never fake an answer.
    if (e instanceof AIError && e.status === 402) throw e;
    if (primary === "gemini") throw e;
    const r = await call("gemini", opts.system, opts.messages, opts.maxTokens);
    await recordUsage("gemini");
    return { ...r, provider: "gemini" as Provider };
  }
}

// Pure: alert level for the monthly budget.
export function usageAlert(used: number, budget = MONTHLY_ANSWER_BUDGET): "ok" | "warn" | "over" {
  if (used >= budget) return "over";
  if (used >= budget * 0.8) return "warn";
  return "ok";
}
