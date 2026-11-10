import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/visitor-session")({ server: { handlers: {
  GET: async ({ request }) => {
    const { visitorIdentity, visitorSummary } = await import("@/lib/visitor-ai.server");
    try { const identity = await visitorIdentity(request); return Response.json(await visitorSummary(identity.userId), { headers: { "Cache-Control": "no-store" } }); }
    catch (e) { return Response.json({ error: e instanceof Error ? e.message : "Sign in at /account." }, { status: 401, headers: { "Cache-Control": "no-store" } }); }
  },
  POST: async ({ request }) => {
    const { visitorIdentity } = await import("@/lib/visitor-ai.server");
    try {
      const identity = await visitorIdentity(request);
      const { z } = await import("zod");
      const { path } = z.object({ path: z.string().max(200).regex(/^\/apps\/[a-z-]+\/index\.html$/) }).parse(await request.json());
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("visitor_site_visits").insert({ user_id: identity.userId, path });
      return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    } catch { return Response.json({ error: "Account required." }, { status: 401 }); }
  }
} } });