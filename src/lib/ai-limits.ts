// Server-only usage limits shared by every AI endpoint. Counts are kept in the
// backend (consume_ai_quota) so they hold across all servers.

export const AI_LIMITS = {
  chat: { perVisitorPerHour: 30, sitePerDay: 900 },
  diagram: { perVisitorPerHour: 10, sitePerDay: 200 },
  picture: { perVisitorPerHour: 5, sitePerDay: 40 },
} as const;

export type AIScope = keyof typeof AI_LIMITS;

// Pure: the message shown when a limit is reached.
export function limitMessage(result: string): string | null {
  if (result === "visitor") return "You've asked a lot this hour! Take a little break and try again later.";
  if (result === "site") return "The buddies have answered lots of questions today and are resting. Please come back tomorrow.";
  return null;
}

async function visitorId(request: Request): Promise<string> {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    (request.headers.get("x-forwarded-for") || "").split(",")[0]!.trim() ||
    "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("fb-ai:" + ip));
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Returns null when allowed, or a 429 message when the limit is reached.
// Free Google calls fail open (Google's own free cap still applies); pictures,
// which use paid credits, fail closed.
export async function checkAILimit(request: Request, scope: AIScope): Promise<string | null> {
  const limits = AI_LIMITS[scope];
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("consume_ai_quota", {
      _scope: scope,
      _visitor: await visitorId(request),
      _per_hour: limits.perVisitorPerHour,
      _per_day: limits.sitePerDay,
    });
    if (error) throw error;
    return limitMessage(String(data));
  } catch (e) {
    console.error("AI limit check failed", e);
    return scope === "picture" ? "Pictures are taking a short break. Please try again soon." : null;
  }
}
