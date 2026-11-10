import { AIError, type ChatTurn } from "@/lib/google-ai";
import { sponsorPolicySchema, reserveCost, selectSponsorModel, sponsorCost, SPONSOR_MODELS } from "@/lib/sponsor-policy";
import { z } from "zod";

const openaiResult = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }), finish_reason: z.string().optional() })), usage: z.object({ prompt_tokens: z.number().nonnegative(), completion_tokens: z.number().nonnegative(), prompt_tokens_details: z.object({ cached_tokens: z.number().nonnegative().optional() }).optional() }).optional() });
const claudeResult = z.object({ content: z.array(z.object({ type: z.string(), text: z.string().optional() })), stop_reason: z.string().nullable(), usage: z.object({ input_tokens: z.number().nonnegative(), output_tokens: z.number().nonnegative(), cache_read_input_tokens: z.number().nonnegative().optional() }) });
export type SponsoredOptions = { userId: string; buddy: string; system: string; messages: ChatTurn[]; maxTokens: number; diagram?: boolean; requestId?: string };

export async function sponsoredText(options: SponsoredOptions) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { visitorKey } = await import("@/lib/visitor-ai.server");
  const policyRow = await supabaseAdmin.from("ai_sponsor_policy").select("*").eq("id", true).maybeSingle();
  if (policyRow.error || !policyRow.data?.enabled || policyRow.data.emergency_stop || !policyRow.data.key_owner) throw new AIError(403, "funding_unavailable", "Introductory AI is currently off. You can use your own connected AI account instead.");
  const policy = sponsorPolicySchema.parse(policyRow.data);
  const owner = policyRow.data.key_owner;
  const last = options.messages.at(-1)?.content ?? "";
  const task = options.diagram ? "diagram" : options.buddy === "artbuddy" ? "art" : options.buddy === "brainboost" || /explain|why|how|code|solve/i.test(last) || last.length > 160 ? "tutoring" : "simple";
  const selected = selectSponsorModel(policy, task);
  const requestId = options.requestId ?? crypto.randomUUID();
  const maxTokens = Math.min(options.diagram ? 10000 : 2048, Math.max(150, options.maxTokens));
  const messages = options.messages.slice(-20);
  if (new TextEncoder().encode(options.system + messages.map(m => m.content).join("\n")).length > 24000) throw new AIError(400, "invalid_request", "This conversation is too long. Please start a new chat.");

  async function attempt(provider: "chatgpt" | "claude", model: string, number: number): Promise<{ text: string; truncated: boolean; provider: "chatgpt" | "claude" } | null> {
    const key = await visitorKey(owner, provider);
    const reservation = await supabaseAdmin.rpc("reserve_sponsor_spend", { _user: options.userId, _request: requestId, _attempt: number, _provider: provider, _model: model, _scope: options.diagram ? "diagram" : "chat", _cost: reserveCost(model, options.system, messages, maxTokens) });
    if (reservation.error || !reservation.data) throw new AIError(403, "budget_limit", reservation.error?.message ?? "Your allowance cannot cover this question.");
    const id = reservation.data;
    const event = await supabaseAdmin.from("visitor_ai_events").insert({ user_id: options.userId, buddy: options.buddy, provider, model, request_scope: options.diagram ? "diagram" : "chat", funding_source: "sponsored", request_id: requestId }).select("id").single();
    async function settle(cost: number | null, outcome: string, input: number | null = null, output: number | null = null) {
      const settled = await supabaseAdmin.rpc("settle_sponsor_spend", { _id: id, _cost: cost });
      if (settled.error) throw new AIError(503, "usage_unavailable", "Usage recording is unavailable. No retry will be sent.");
      if (event.data) await supabaseAdmin.from("visitor_ai_events").update({ outcome, estimated_usd: cost, input_tokens: input, output_tokens: output, rate_version: "standard-list-2026-11-10" }).eq("id", event.data.id);
    }
    if (event.error || !event.data) { await settle(0, "not_sent"); throw new AIError(503, "usage_unavailable", "Usage recording is unavailable; no AI request was sent."); }
    // Recheck the emergency switch immediately before dispatch; it cannot recall requests already sent.
    const latest = await supabaseAdmin.from("ai_sponsor_policy").select("enabled,emergency_stop,openai_enabled,claude_enabled,key_owner").eq("id", true).single();
    if (latest.error || !latest.data.enabled || latest.data.emergency_stop || latest.data.key_owner !== owner || !(provider === "chatgpt" ? latest.data.openai_enabled : latest.data.claude_enabled)) { await settle(0, "stopped"); throw new AIError(403, "funding_unavailable", "Sponsored AI has been stopped."); }
    try {
      const response = await fetch(provider === "chatgpt" ? "https://api.openai.com/v1/chat/completions" : "https://api.anthropic.com/v1/messages", {
        method: "POST", signal: AbortSignal.timeout(45000),
        headers: provider === "chatgpt" ? { "Content-Type": "application/json", Authorization: `Bearer ${key}` } : { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify(provider === "chatgpt" ? { model, messages: [{ role: "system", content: options.system }, ...messages], max_completion_tokens: maxTokens } : { model, system: options.system, messages, max_tokens: maxTokens }),
      });
      if (!response.ok) {
        // Auth/model rejection is definitive and does not run inference. Server failures/timeouts remain uncertain.
        const safe = [401, 403, 404].includes(response.status);
        await settle(safe ? 0 : null, `provider_error_${response.status}`);
        if (safe && provider === "chatgpt" && policy.allow_fallback && policy.claude_enabled) return null;
        throw new AIError(502, "upstream_error", "The enabled AI provider could not answer. No automatic retry was sent.");
      }
      const raw: unknown = await response.json();
      let text: string, truncated: boolean, input: number | null, output: number | null, cached = 0;
      if (provider === "chatgpt") {
        const parsed = openaiResult.parse(raw); text = parsed.choices[0]?.message.content ?? ""; truncated = parsed.choices[0]?.finish_reason === "length"; input = parsed.usage?.prompt_tokens ?? null; output = parsed.usage?.completion_tokens ?? null; cached = parsed.usage?.prompt_tokens_details?.cached_tokens ?? 0;
      } else {
        const parsed = claudeResult.parse(raw); text = parsed.content.filter(c => c.type === "text").map(c => c.text ?? "").join(""); truncated = parsed.stop_reason === "max_tokens"; cached = parsed.usage.cache_read_input_tokens ?? 0; input = parsed.usage.input_tokens + cached; output = parsed.usage.output_tokens;
      }
      await settle(input === null || output === null ? null : sponsorCost(model, input, output, cached), text.trim() ? "success" : "empty", input, output);
      if (!text.trim()) throw new AIError(502, "empty_completion", "The provider returned no answer. No additional paid request was sent.");
      return { text: text.trim(), truncated, provider };
    } catch (error) {
      if (error instanceof AIError) throw error;
      await settle(null, "unknown");
      throw new AIError(502, "upstream_error", "The request could not be confirmed. Its allowance remains reserved; no retry was sent.");
    }
  }
  const first = await attempt(selected.provider, selected.model, 1);
  if (first) return first;
  const fallback = await attempt("claude", SPONSOR_MODELS.claude, 2);
  if (!fallback) throw new AIError(502, "upstream_error", "No affordable answer is available.");
  return fallback;
}