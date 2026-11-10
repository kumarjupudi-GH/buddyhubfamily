import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_SPONSOR_POLICY, sponsorPolicySchema, readBalance } from "@/lib/sponsor-policy";
import { z } from "zod";

export const getSponsorControls = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: admin, error } = await context.supabase.rpc("is_usage_admin");
  if (error || !admin) throw new Error("Administrator access is required.");
  const [policy, balances, reservations] = await Promise.all([
    context.supabase.from("ai_sponsor_policy").select("*").eq("id", true).maybeSingle(),
    context.supabase.from("ai_intro_wallets").select("*"),
    context.supabase.from("ai_spend_reservations").select("user_id,reserved_usd,settled_usd,state").limit(10000),
  ]);
  if (policy.error || balances.error || reservations.error) throw new Error("Allowance controls are unavailable.");
  const { data: balance, error: balanceError } = await context.supabase.rpc("sponsor_balance", { _user: context.userId });
  if (balanceError) throw new Error("Remaining budget is unavailable.");
  return { policy: sponsorPolicySchema.parse(policy.data ?? DEFAULT_SPONSOR_POLICY), balance: readBalance(balance), wallets: balances.data ?? [], reservations: reservations.data ?? [], partial: (reservations.data?.length ?? 0) >= 10000 };
});
export const saveSponsorControls = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(sponsorPolicySchema).handler(async ({ context, data }) => {
  const { data: admin, error } = await context.supabase.rpc("is_usage_admin");
  if (error || !admin) throw new Error("Administrator access is required.");
  const current = await context.supabase.from("ai_sponsor_policy").select("eligible_since").eq("id", true).maybeSingle();
  if (current.error) throw new Error("Controls are unavailable.");
  if (data.enabled && !data.emergency_stop) {
    if (data.total_usd <= 0 || data.intro_usd <= 0 || data.per_user_usd <= 0 || data.daily_questions <= 0) throw new Error("Set positive allowances and limits before enabling paid AI.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const keys = await supabaseAdmin.from("visitor_ai_keys").select("provider").eq("user_id", context.userId);
    if (keys.error || (!data.openai_enabled && !data.claude_enabled) || (data.openai_enabled && !keys.data?.some(k => k.provider === "chatgpt")) || (data.claude_enabled && !keys.data?.some(k => k.provider === "claude"))) throw new Error("Save your own enabled provider connections on My AI account before activating funding.");
  }
  const { error: saveError } = await context.supabase.from("ai_sponsor_policy").upsert({ ...data, id: true, key_owner: context.userId, eligible_since: current.data?.eligible_since ?? (data.enabled && !data.emergency_stop ? new Date().toISOString() : null), updated_at: new Date().toISOString() });
  if (saveError) throw new Error("Funding controls could not be saved.");
  return { ok: true };
});
export const chooseFundingMode = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.enum(["visitor", "sponsored"])).handler(async ({ context, data }) => {
  const { error } = await context.supabase.from("visitor_ai_settings").update({ funding_mode: data }).eq("user_id", context.userId);
  if (error) throw new Error("Funding preference could not be saved.");
  return { ok: true };
});