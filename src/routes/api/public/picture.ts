import { createFileRoute } from "@tanstack/react-router";
import { generateImage } from "@/lib/image-gateway.server";
import { checkAILimit } from "@/lib/ai-limits";

// Public endpoint for the static buddy apps: draws a kid-safe picture or
// labeled diagram that explains a buddy's answer. Prompt is built server-side.
export const Route = createFileRoute("/api/public/picture")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid request", { status: 400 });
        }
        const question = typeof body?.question === "string" ? body.question.trim().slice(0, 300) : "";
        const answer = typeof body?.answer === "string" ? body.answer.trim().slice(0, 600) : "";
        if (!question && !answer) return new Response("Invalid request", { status: 400 });
        const limited = await checkAILimit(request, "picture");
        if (limited) return new Response(limited, { status: 429 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured.", { status: 500 });
        const prompt = [
          "Create one friendly, bright, simple educational picture for a child or family that helps explain the idea below.",
          "If the idea is a process, parts, steps or a comparison, draw a clear labeled diagram with a few short, correctly spelled labels.",
          "Otherwise draw a cheerful illustration. Keep it accurate, age-appropriate and kind: no scary, violent or unsafe content, no real people, no logos.",
          "",
          "Question: " + question,
          "Key idea from the answer: " + answer,
        ].join("\n");
        const stream = body?.stream !== false;
        const upstream = await generateImage(apiKey, prompt, stream);
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
