import { createServerFn } from "@tanstack/react-start";
import { MONTHLY_ANSWER_BUDGET, usageAlert } from "@/lib/ai-router";

// Public: returns only anonymous monthly answer counts per AI provider.
export const getMonthlyUsage = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("monthly_ai_usage");
  if (error) throw new Error("Couldn't read usage right now.");
  const rows = (data ?? []) as Array<{ provider: string; total: number }>;
  const used = rows.reduce((a, r) => a + r.total, 0);
  return { rows, used, budget: MONTHLY_ANSWER_BUDGET, level: usageAlert(used) };
});
