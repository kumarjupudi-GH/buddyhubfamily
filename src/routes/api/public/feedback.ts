import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { FEEDBACK_APPS, feedbackSchema } from "@/lib/feedback";

export const Route = createFileRoute("/api/public/feedback")({
  server: { handlers: {
    GET: () => Response.json({ apps: FEEDBACK_APPS }),
    POST: async ({ request }) => {
      const origin = request.headers.get("origin");
      if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin" }, { status: 403 });
      if (Number(request.headers.get("content-length") || 0) > 50000) return Response.json({ error: "Feedback is too large" }, { status: 413 });
      try {
        const raw = await request.text();
        if (raw.length > 50000) return Response.json({ error: "Feedback is too large" }, { status: 413 });
        const parsed = feedbackSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Invalid feedback" }, { status: 400 });
        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) throw new Error("Feedback unavailable");
        const bearer = request.headers.get("authorization");
        const client = createClient<Database>(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: bearer ? { Authorization: bearer } : {}, fetch: (input, init) => {
            const headers = new Headers(init?.headers);
            if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
            headers.set("apikey", key);
            return fetch(input, { ...init, headers });
          } },
        });
        if (bearer) {
          const { data, error } = await client.auth.getUser(bearer.replace(/^Bearer /, ""));
          if (error || !data.user) return Response.json({ error: "Sign in again or submit signed out" }, { status: 401 });
        }
        const identity = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
        const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`feedback:${identity}`));
        const visitor = Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, "0")).join("");
        const value = parsed.data;
        const { error } = await client.rpc("submit_app_feedback", { _batch: value.batch, _name: value.name, _email: value.email, _response: value.wants_response, _entries: value.entries, _visitor: visitor });
        if (error) return Response.json({ error: "Could not save feedback. Please try again later." }, { status: 400 });
        return Response.json({ saved: true });
      } catch {
        return Response.json({ error: "Could not submit feedback. Please try again." }, { status: 400 });
      }
    },
  } },
});