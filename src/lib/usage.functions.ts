import { createServerFn } from "@tanstack/react-start";
import { MONTHLY_ANSWER_BUDGET, usageAlert } from "@/lib/ai-router";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Public: returns only anonymous monthly answer counts per AI provider.
export const getMonthlyUsage = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: admin, error: roleError } = await context.supabase.rpc("is_usage_admin");
  if (roleError || !admin) throw new Error("Administrator access required.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("monthly_ai_usage");
  if (error) throw new Error("Couldn't read usage right now.");
  const rows = (data ?? []) as Array<{ provider: string; total: number }>;
  const used = rows.reduce((a, r) => a + r.total, 0);
  return { rows, used, budget: MONTHLY_ANSWER_BUDGET, level: usageAlert(used) };
});
