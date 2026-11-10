import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { visitorIdentity, encryptKey, getVisitorKey, listProviderModels } from "@/lib/visitor-ai.server";
import { PROVIDERS, type Provider } from "@/lib/visitor-ai-policy";

export const Route = createFileRoute("/api/public/ai-account")({ server: { handlers: {
  POST: async ({ request }) => {
    try {
      const userId = await visitorIdentity(request);
      const input = z.object({ action: z.enum(["status", "save", "remove"]), provider: z.enum(PROVIDERS).optional(), key: z.string().min(10).max(4096).optional(), adult: z.boolean().optional() }).parse(await request.json());
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (input.action !== "status") {
        if (!input.provider) return Response.json({ error: { message: "Choose an AI provider." } }, { status: 400 });
        if (input.action === "remove") {
          const { error } = await supabaseAdmin.from("visitor_ai_keys").delete().eq("user_id", userId).eq("provider", input.provider);
          if (error) throw new Error("Could not remove connection.");
        } else {
          if (!input.key || input.adult !== true) return Response.json({ error: { message: "An adult must confirm and supply their own provider key." } }, { status: 400 });
          const models = await listProviderModels(input.provider, input.key);
          if (!models.length) return Response.json({ error: { message: "This account has no supported text models." } }, { status: 400 });
          const { error } = await supabaseAdmin.from("visitor_ai_keys").upsert({ user_id: userId, provider: input.provider, ciphertext: await encryptKey(input.key), key_hint: null, updated_at: new Date().toISOString() }, { onConflict: "user_id,provider" });
          if (error) throw new Error("Could not save private connection.");
        }
      }
      const { data, error } = await supabaseAdmin.from("visitor_ai_keys").select("provider").eq("user_id", userId);
      if (error) throw new Error("Could not read connections.");
      const connections = await Promise.all(PROVIDERS.map(async (provider: Provider) => {
        if (!data?.some(row => row.provider === provider)) return { provider, connected: false, models: [] as string[] };
        try { return { provider, connected: true, models: await listProviderModels(provider, await getVisitorKey(userId, provider)) }; }
        catch { return { provider, connected: true, models: [] as string[], error: "Check your provider access or reconnect." }; }
      }));
      return Response.json({ connections }, { headers: { "cache-control": "no-store" } });
    } catch (error) {
      const status = error instanceof z.ZodError ? 400 : error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 500;
      return Response.json({ error: { message: error instanceof z.ZodError ? "Check the connection details." : error instanceof Error ? error.message : "Could not manage AI connections." } }, { status, headers: { "cache-control": "no-store" } });
    }
  }
} } });