import { createFileRoute } from "@tanstack/react-router";
import { bestAnswer } from "@/lib/ai-gateway";
import { BUDDY_PROMPTS } from "@/lib/buddies";

// Family buddies chat endpoint (public app API). Persona comes from BUDDY_PROMPTS.
const SAFETY = [
  "Safety: keep everything age-appropriate, because kids may use this site.",
  "Never ask for personal information such as full names, addresses, school names, phone numbers or photos.",
  "If someone seems distressed or unsafe, respond kindly and encourage them to talk to a trusted adult;",
  "if they may be in immediate danger, suggest calling 911 or calling or texting 988.",
  "Say honestly that you are an AI and not a doctor, financial advisor, licensed repair professional or other professional.",
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

export const Route = createFileRoute("/api/public/buddy-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return json(400, { error: { code: "invalid_request", message: "Invalid JSON." } });
        }
        const buddy = typeof body?.buddy === "string" ? body.buddy : "";
        if (!Object.prototype.hasOwnProperty.call(BUDDY_PROMPTS, buddy)) {
          return json(400, { error: { code: "invalid_request", message: "Unknown buddy." } });
        }
        const messages = normalizeMessages(body?.messages);
        if (!messages) {
          return json(400, {
            error: { code: "invalid_request", message: "messages must be a list of user/assistant turns." },
          });
        }
        try {
          const { text, truncated, source, check } = await bestAnswer({
            claudeModel: "anthropic/claude-sonnet-5",
            geminiModel: "google/gemini-3.8-flash",
            system: BUDDY_PROMPTS[buddy] + "\n\n" + SAFETY,
            messages,
            maxTokens: 1024,
            question: messages[messages.length - 1]?.content ?? "",
          });
          return json(200, { text, truncated, source, ...(check ? { check } : {}) });
        } catch (e: any) {
          const status = typeof e?.status === "number" ? e.status : 502;
          return json(status, {
            error: { code: "upstream_error", message: e?.message || "The AI had a problem. Try again." },
          });
        }
      },
    },
  },
});
