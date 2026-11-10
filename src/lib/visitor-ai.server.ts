import { AIError, type ChatTurn } from "@/lib/google-ai";
import { budgetAlert, estimateCost, localDay, VISITOR_MODELS, type VisitorProvider } from "@/lib/visitor-policy";
import { decryptVisitorKey } from "@/lib/visitor-crypto.server";
import { z } from "zod";

export async function visitorIdentity(request: Request) {
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new AIError(401, "account_required", "An adult needs to sign in and connect their own AI account at /account.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new AIError(401, "account_required", "Please sign in again at /account.");
  const { data: settings, error: settingsError } = await supabaseAdmin.from("visitor_ai_settings").select("*").eq("user_id", data.user.id).maybeSingle();
  if (settingsError) throw new AIError(503, "account_unavailable", "Account settings are unavailable. Please try again.");
  if (!settings) throw new AIError(403, "adult_required", "An adult needs to finish AI account setup at /account.");
  return { userId: data.user.id, settings };
}
export async function visitorKey(userId: string, provider: VisitorProvider) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("visitor_ai_keys").select("ciphertext").eq("user_id", userId).eq("provider", provider).maybeSingle();
  if (error) throw new AIError(503, "account_unavailable", "AI account connections are unavailable.");
  if (!data) throw new AIError(403, "connection_required", `An adult needs to connect ${provider === "chatgpt" ? "OpenAI" : provider === "claude" ? "Claude" : provider === "openrouter" ? "OpenRouter" : "Gemini"} API access at /account. Your host's credits will not be used.`);
  return decryptVisitorKey(data.ciphertext, `${userId}:${provider}`);
}
const completionSchema = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }), finish_reason: z.string().optional() })), usage: z.object({ prompt_tokens: z.number(), completion_tokens: z.number(), prompt_tokens_details: z.object({ cached_tokens: z.number().optional() }).optional() }).optional() });
const claudeSchema = z.object({ content: z.array(z.object({ type: z.string(), text: z.string().optional() })), stop_reason: z.string().nullable(), usage: z.object({ input_tokens: z.number(), output_tokens: z.number(), cache_read_input_tokens: z.number().optional() }) });
const geminiSchema = z.object({ candidates: z.array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string().optional(), thought: z.boolean().optional() })) }).optional(), finishReason: z.string().optional() })).optional(), usageMetadata: z.object({ promptTokenCount: z.number().optional(), candidatesTokenCount: z.number().optional(), thoughtsTokenCount: z.number().optional(), cachedContentTokenCount: z.number().optional() }).optional() });

async function beginAttempt(userId: string, buddy: string, provider: VisitorProvider, model: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("visitor_ai_events").insert({ user_id: userId, buddy, provider, model }).select("id").single();
  if (error) throw new AIError(503, "usage_unavailable", "Usage recording is unavailable; no AI request was sent.");
  return data.id;
}
async function finishAttempt(id: string, model: string, outcome: string, input: number | null = null, output: number | null = null, cached = 0) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("visitor_ai_events").update({ outcome, input_tokens: input, output_tokens: output, estimated_usd: estimateCost(model, input, output, cached), rate_version: "standard-list-2026-11-10" }).eq("id", id);
  if (error) console.error("Visitor usage completion could not be recorded");
}
function providerFailure(status: number) {
  if (status === 401 || status === 403) return new AIError(403, "provider_access", "Your connected provider rejected access. An adult should check the API connection at /account.");
  if (status === 402 || status === 429) return new AIError(status, "rate_limited", "Today's free AI questions are used up, or the provider is busy. Please wait a minute or try again tomorrow. Your AI provider's credits or quota are unavailable. An adult should check their provider account; the host's credits will not be used.");
  return new AIError(502, "upstream_error", "Your AI provider could not complete this request. Please try again later.");
}
export async function visitorText(options: { userId: string; buddy: string; provider: VisitorProvider; system: string; messages: ChatTurn[]; maxTokens: number; diagram?: boolean }) {
  const model = options.provider === "openrouter" ? VISITOR_MODELS.openrouter : options.diagram ? VISITOR_MODELS.diagram : VISITOR_MODELS[options.provider];
  const key = await visitorKey(options.userId, options.provider);
  const id = await beginAttempt(options.userId, options.buddy, options.provider, model);
  try {
    let response: Response;
    if (options.provider === "claude") {
      response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model, system: options.system, messages: options.messages, max_tokens: options.maxTokens }) });
    } else if (options.provider === "openrouter") {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", signal: AbortSignal.timeout(45000), headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Title": "Family BuddyApps" }, body: JSON.stringify({ model, messages: [{ role: "system", content: options.system }, ...options.messages], max_tokens: options.maxTokens }) });
    } else if (options.provider === "chatgpt") {
      response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model, messages: [{ role: "system", content: options.system }, ...options.messages], max_completion_tokens: options.maxTokens }) });
    } else {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify({ systemInstruction: { parts: [{ text: options.system }] }, contents: options.messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })), generationConfig: { maxOutputTokens: options.maxTokens } }) });
    }
    if (!response.ok) { await finishAttempt(id, model, `provider_error_${response.status}`); throw providerFailure(response.status); }
    const raw: unknown = await response.json();
    let text = "", truncated = false, input: number | null = null, output: number | null = null, cached = 0;
    if (options.provider === "claude") {
      const data = claudeSchema.parse(raw);
      text = data.content.filter(b => b.type === "text").map(b => b.text ?? "").join(""); truncated = data.stop_reason === "max_tokens";
      cached = data.usage.cache_read_input_tokens ?? 0; input = data.usage.input_tokens + cached; output = data.usage.output_tokens;
    } else if (options.provider === "chatgpt" || options.provider === "openrouter") {
      const data = completionSchema.parse(raw); text = data.choices[0]?.message.content ?? ""; truncated = data.choices[0]?.finish_reason === "length";
      input = data.usage?.prompt_tokens ?? null; output = data.usage?.completion_tokens ?? null; cached = data.usage?.prompt_tokens_details?.cached_tokens ?? 0;
    } else {
      const data = geminiSchema.parse(raw); text = data.candidates?.[0]?.content?.parts.filter(p => !p.thought).map(p => p.text ?? "").join("") ?? ""; truncated = data.candidates?.[0]?.finishReason === "MAX_TOKENS";
      input = data.usageMetadata?.promptTokenCount ?? null;
      output = data.usageMetadata?.candidatesTokenCount === undefined ? null : data.usageMetadata.candidatesTokenCount + (data.usageMetadata.thoughtsTokenCount ?? 0);
      cached = data.usageMetadata?.cachedContentTokenCount ?? 0;
    }
    await finishAttempt(id, model, text.trim() ? "success" : "empty", input, output, cached);
    if (!text.trim()) throw new AIError(502, "empty_completion", "Your provider returned no answer. Please try a different question.");
    return { text: text.trim(), truncated, provider: options.provider };
  } catch (e) {
    if (e instanceof AIError) throw e;
    await finishAttempt(id, model, "unknown");
    throw new AIError(502, "upstream_error", "The request could not be confirmed. Your provider may have received it; no automatic retry was sent.");
  }
}
export async function visitorPicture(userId: string, prompt: string) {
  const key = await visitorKey(userId, "chatgpt");
  const model = VISITOR_MODELS.picture;
  const id = await beginAttempt(userId, "picture", "chatgpt", model);
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model, prompt, n: 1 }) });
    if (!response.ok) { await finishAttempt(id, model, `provider_error_${response.status}`); throw providerFailure(response.status); }
    const data = z.object({ data: z.array(z.object({ b64_json: z.string().optional(), url: z.string().optional() })), usage: z.object({ input_tokens: z.number().optional(), output_tokens: z.number().optional() }).optional() }).parse(await response.json());
    // Image modality/caching details are not yet fully priced: do not guess a blended image rate.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("visitor_ai_events").update({ outcome: "success", input_tokens: data.usage?.input_tokens ?? null, output_tokens: data.usage?.output_tokens ?? null, modality_usage: data.usage ?? null }).eq("id", id);
    return { data: data.data };
  } catch (e) {
    if (e instanceof AIError) throw e;
    await finishAttempt(id, model, "unknown");
    throw new AIError(502, "upstream_error", "The picture request could not be confirmed; no automatic retry was sent.");
  }
}
export async function visitorSummary(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: settings } = await supabaseAdmin.from("visitor_ai_settings").select("*").eq("user_id", userId).maybeSingle();
  if (!settings) return { level: "ok", estimated: 0, unknown: 0, budget: null };
  const { data, error } = await supabaseAdmin.from("visitor_ai_events").select("created_at,estimated_usd").eq("user_id", userId).gte("created_at", new Date(Date.now() - 48 * 3600000).toISOString());
  if (error) throw new Error("Daily usage is unavailable.");
  const day = localDay(new Date(), settings.timezone);
  const today = (data ?? []).filter(row => localDay(row.created_at, settings.timezone) === day);
  const estimated = today.reduce((sum, row) => sum + (row.estimated_usd ?? 0), 0);
  return { level: budgetAlert(estimated, settings.daily_budget_usd), estimated, unknown: today.filter(r => r.estimated_usd === null).length, budget: settings.daily_budget_usd };
}/** Use the routed provider when the adult saved that key; otherwise use another key they saved (never the host's). */
export async function usableProvider(userId: string, preferred: VisitorProvider): Promise<VisitorProvider> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("visitor_ai_keys").select("provider").eq("user_id", userId);
  const saved = (data ?? []).map(r => r.provider as VisitorProvider);
  if (saved.includes("openrouter")) return "openrouter"; // free models first
  if (saved.includes(preferred)) return preferred;
  return (["gemini", "claude", "chatgpt"] as VisitorProvider[]).find(p => saved.includes(p)) ?? preferred;
}
