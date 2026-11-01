import { createFileRoute } from "@tanstack/react-router";

// Public endpoint for BrainBoost Buddy: Google Gemini draws an accurate,
// labeled SVG diagram (geometry, graphs, number lines, fractions...) that
// explains the answer. Returns { svg } or { error }.
const MODEL = "google/gemini-3.8-flash";

const INSTRUCTIONS = [
  "You draw clear teaching diagrams for kids (ages 5-18) as a single SVG.",
  "Reply with ONLY the SVG markup: start with <svg and end with </svg>. No markdown, no prose.",
  'Use viewBox="0 0 480 360", a white background rect, thick strokes (2-3px), and a few bright friendly colors.',
  "Be mathematically accurate: draw shapes to scale where possible, mark right angles with a small square,",
  "label vertices, side lengths, angles and axes with short <text> labels (font-family sans-serif, font-size 14-18) that do not overlap.",
  "For graphs draw labeled axes with tick marks and plot points/lines exactly. For fractions use equal parts.",
  "Add a short title at the top. Never use <script>, <image>, <foreignObject>, <use>, href, or event handlers. Keep it under 9000 characters.",
].join("\n");

function json(status: number, obj: unknown) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function cleanSvg(text: string): string | null {
  const m = text.match(/<svg[\s\S]*<\/svg>/i);
  if (!m) return null;
  const svg = m[0];
  if (svg.length > 12000) return null;
  if (/<script|<foreignObject|<iframe|<image|<use[\s>]|javascript:|\son[a-z]+\s*=|href\s*=|<!ENTITY|<!DOCTYPE/i.test(svg)) return null;
  return svg;
}

export const Route = createFileRoute("/api/public/diagram")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return json(400, { error: "Invalid request." });
        }
        const question = typeof body?.question === "string" ? body.question.trim().slice(0, 500) : "";
        const answer = typeof body?.answer === "string" ? body.answer.trim().slice(0, 2000) : "";
        if (!question) return json(400, { error: "Invalid request." });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return json(500, { error: "AI is not configured." });

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 6000,
            messages: [
              { role: "system", content: INSTRUCTIONS },
              {
                role: "user",
                content: "Student asked: " + question + "\n\nTutor's answer (draw what it explains):\n" + answer,
              },
            ],
          }),
        });
        if (!res.ok) {
          const msg =
            res.status === 402
              ? "Out of AI credits for diagrams right now."
              : res.status === 429
                ? "Lots of diagrams right now — try again in a minute."
                : "Couldn't draw a diagram this time.";
          return json(res.status, { error: msg });
        }
        const data = (await res.json()) as any;
        const text: string = data?.choices?.[0]?.message?.content || "";
        const svg = cleanSvg(text);
        if (!svg) return json(502, { error: "Couldn't draw a clear diagram for that one." });
        return json(200, { svg });
      },
    },
  },
});
