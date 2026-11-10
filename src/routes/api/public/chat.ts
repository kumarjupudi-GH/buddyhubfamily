import { createFileRoute } from "@tanstack/react-router";
import { pickProvider } from "@/lib/ai-router";
import { checkAILimit } from "@/lib/ai-limits";
import { AIError } from "@/lib/google-ai";

// BrainBoost Buddy homework chat endpoint (public app API).
const SYSTEM_PROMPT = [
  "You are a homework helper for students from kindergarten to grade 12 (ages about 5 to 18).",
  "For younger children (under about 11) use very simple words and encourage them to ask a parent, guardian or teacher for help.",
  "Keep everything age-appropriate. Never produce sexual, graphically violent or otherwise unsuitable content.",
  "Never ask for personal information such as full names, home addresses, school names, phone numbers or photos.",
  "Help students understand their work with hints and steps instead of writing graded assignments for them.",
  "If a student seems distressed or unsafe, respond kindly and encourage them to talk to a trusted adult;",
  "if they may be in immediate danger, suggest calling 911 (US) or calling or texting 988.",
  "\n\nHow to teach: be factually accurate and say so if you are unsure. First explain the concept simply with a real-life example.",
  "Then show a fully worked example, numbered step by step, saying WHY each step works.",
  "Only after that, give the student a similar practice problem to try (do not solve their graded assignment for them).",
  "When something is visual (shapes, graphs, orbits, cycles, body parts), describe it in an orderly way that matches a labeled diagram.",
  "Finish with one short follow-up question that checks understanding.",
].join(" ");

const MAX_TURNS = 40;

function normalizeMessages(raw: unknown) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const merged: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const m of raw) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) return null;
    if (typeof m.content !== "string" || !m.content.trim()) return null;
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += "\n\n" + m.content;
    else merged.push({ role: m.role, content: m.content });
  }
  const out = merged.slice(-MAX_TURNS);
  while (out.length && out[0]?.role !== "user") out.shift();
  while (out.length && out[out.length - 1]?.role !== "user") out.pop();
  return out.length ? out : null;
}

function json(status: number, obj: unknown) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/public/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { visitorIdentity, visitorText, usableProvider } = await import("@/lib/visitor-ai.server");
        let identity;
        try { identity = await visitorIdentity(request); } catch (e) { return json(e instanceof Error && "status" in e ? Number(e.status) : 503, { error: { code: "account_required", message: e instanceof Error ? e.message : "Account unavailable." } }); }
        let body: any;
        try {
          body = await request.json();
        } catch {
          return json(400, { error: { code: "invalid_request", message: "Invalid JSON." } });
        }
        const messages = normalizeMessages(body?.messages);
        if (!messages) {
          return json(400, {
            error: { code: "invalid_request", message: "messages must be a list of user/assistant turns." },
          });
        }
        const limited = await checkAILimit(request, "chat", identity.userId);
        if (limited) return json(429, { error: { code: "rate_limited", message: limited } });
        try {
          const { text, truncated, provider } = await visitorText({
            userId: identity.userId,
            fundingMode: identity.settings.funding_mode === "sponsored" ? "sponsored" : "visitor",
            requestId: request.headers.get("X-Request-ID") ?? undefined,
            buddy: "brainboost",
            provider: identity.settings.funding_mode === "sponsored" ? "chatgpt" : await usableProvider(identity.userId, pickProvider(messages[messages.length - 1]?.content ?? "", "tutor")),
            system: SYSTEM_PROMPT,
            messages,
            maxTokens: 2048,
          });
          return json(200, { text, truncated, source: provider });
        } catch (e: any) {
          const status = typeof e?.status === "number" ? e.status : 502;
          return json(status, {
            error: { code: e?.code || "upstream_error", message: e?.message || "The AI had a problem. Try again." },
          });
        }
      },
    },
  },
});
