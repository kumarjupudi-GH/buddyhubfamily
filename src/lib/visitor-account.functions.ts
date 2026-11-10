import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getVisitorAccount = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { visitorSummary } = await import("@/lib/visitor-ai.server");
  const [settings, keys, roles, events] = await Promise.all([
    context.supabase.from("visitor_ai_settings").select("*").eq("user_id", context.userId).maybeSingle(),
    supabaseAdmin.from("visitor_ai_keys").select("provider,updated_at,key_hint").eq("user_id", context.userId),
    context.supabase.rpc("is_usage_admin"),
    context.supabase.from("visitor_ai_events").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(200),
  ]);
  if (settings.error || keys.error || roles.error || events.error) throw new Error("Account usage could not be loaded.");
  return { email: context.claims.email as string | undefined, settings: settings.data, keys: keys.data ?? [], admin: roles.data, events: events.data ?? [], summary: await visitorSummary(context.userId) };
});
export const saveVisitorSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ budget: z.number().positive().max(100000), timezone: z.string().max(100), adult: z.literal(true) })).handler(async ({ data, context }) => {
  try { new Intl.DateTimeFormat("en", { timeZone: data.timezone }).format(); } catch { throw new Error("Choose a valid timezone."); }
  const { error } = await context.supabase.from("visitor_ai_settings").upsert({ user_id: context.userId, daily_budget_usd: data.budget, timezone: data.timezone });
  if (error) throw new Error("Settings could not be saved.");
  return { ok: true };
});
export const saveVisitorConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ provider: z.enum(["claude", "chatgpt", "gemini", "openrouter"]), key: z.string().trim().min(10).max(500), adult: z.literal(true) })).handler(async ({ data, context }) => {
  const { data: settings } = await context.supabase.from("visitor_ai_settings").select("user_id").eq("user_id", context.userId).maybeSingle();
  if (!settings) throw new Error("Save adult account settings first.");
  const { encryptVisitorKey } = await import("@/lib/visitor-crypto.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("visitor_ai_keys").upsert({ user_id: context.userId, provider: data.provider, ciphertext: await encryptVisitorKey(data.key, `${context.userId}:${data.provider}`), key_hint: data.key.slice(-4), updated_at: new Date().toISOString() });
  if (error) throw new Error("Connection could not be saved.");
  return { ok: true };
});
export const removeVisitorConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.enum(["claude", "chatgpt", "gemini", "openrouter"])).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("visitor_ai_keys").delete().eq("user_id", context.userId).eq("provider", data);
  if (error) throw new Error("Connection could not be removed.");
  return { ok: true };
});
export const getVisitorAdmin = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: admin, error } = await context.supabase.rpc("is_usage_admin");
  if (error || !admin) throw new Error("Administrator access is required.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [users, events, visits] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    context.supabase.from("visitor_ai_events").select("*").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()).order("created_at", { ascending: false }).limit(5000),
    context.supabase.from("visitor_site_visits").select("*").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()).order("created_at", { ascending: false }).limit(5000),
  ]);
  if (users.error || events.error || visits.error) throw new Error("Daily reporting is unavailable.");
  return { users: users.data.users.map(u => ({ id: u.id, email: u.email ?? "No email", created: u.created_at })), events: events.data ?? [], visits: visits.data ?? [], partial: users.data.users.length >= 1000 || (events.data?.length ?? 0) >= 5000 || (visits.data?.length ?? 0) >= 5000 };
});
export const recordVisitorVisit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.string().max(200).regex(/^\/(?:apps\/[a-z-]+\/index\.html|account|usage|admin-usage|)$/)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("visitor_site_visits").insert({ user_id: context.userId, path: data });
  return { ok: true };
});