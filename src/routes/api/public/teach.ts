import { createFileRoute } from "@tanstack/react-router";
import { bestAnswer } from "@/lib/ai-gateway";
import { buildArtSystem, getArtAge } from "@/lib/art-ages";

// ArtBuddy AI art teacher endpoint (public app API). Adapts to the learner's
// age group (kinder ... senior) for both guided lessons and free draw.

const clean = (s: unknown, n: number) => String(s || "").replace(/[<>]/g, "").slice(0, n);

function json(status: number, obj: unknown) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const KINDS = ["help", "chat", "free-idea", "free-skill", "free-help", "free-chat"] as const;
type Kind = (typeof KINDS)[number];

export const Route = createFileRoute("/api/public/teach")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return json(400, { error: "Bad JSON" });
        }
        const kind: Kind = KINDS.includes(body?.kind) ? body.kind : "help";
        const age = getArtAge(body?.age);
        const question = clean(body?.question, 200);
        const skill = clean(body?.skill, 80);

        let ctx: string;
        let task: string;
        let q: string;
        if (kind.startsWith("free")) {
          ctx = `Mode: Free draw (the learner draws anything they like on a blank canvas).${skill ? `\nSkill they are practicing: ${skill}` : ""}`;
          if (kind === "free-idea") {
            task = "Suggest ONE fun, specific thing to draw right now that suits this learner, and the first shape or line to start with.";
            q = "Give me a free-draw idea";
          } else if (kind === "free-skill") {
            task = `Teach one drawing skill${skill ? ` (${skill})` : ""} suited to this learner, with short steps they can try on their blank canvas now.`;
            q = `Teach me ${skill || "a drawing skill"}`;
          } else if (kind === "free-help") {
            task = "The learner pressed Help. They are stuck on a blank or unfinished free drawing. Give a gentle, simple way to get unstuck.";
            q = "I'm stuck on my free drawing";
          } else {
            task = `The learner asked:\n<learner_message>${question}</learner_message>\nAnswer helpfully about drawing.`;
            q = question;
          }
        } else {
          ctx = `Lesson: ${clean(body?.lesson, 40)}\nCurrent step: ${clean(body?.step, 60)}\nStep instruction: ${clean(body?.instruction, 160)}\nDifficulty: ${clean(body?.difficulty, 20)}`;
          task =
            kind === "help"
              ? 'The learner pressed "Help me!". Explain this step in a simpler, different way and encourage them.'
              : `The learner asked a question:\n<learner_message>${question}</learner_message>\nAnswer helpfully about drawing.`;
          q = kind === "chat" ? question : clean(body?.instruction, 160);
        }

        try {
          const { text, source, check } = await bestAnswer({
            claudeModel: "anthropic/claude-haiku-4-5",
            geminiModel: "google/gemini-3.1-flash-lite",
            question: q,
            system: buildArtSystem(age),
            messages: [{ role: "user", content: `${ctx}\n\n${task}` }],
            maxTokens: age.maxTokens,
          });
          let cleaned = text
            .replace(/[*_#`>\[\]]/g, "")
            .replace(/https?:\/\/\S+/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
          if (cleaned.length > age.maxChars) {
            // Cut at the last full sentence so answers never end mid-word.
            const cut = cleaned.slice(0, age.maxChars);
            const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf(".\n"));
            cleaned = end > 40 ? cut.slice(0, end + 1) : cut;
          }
          return json(200, { text: cleaned, source, ...(cleaned && check ? { check } : {}) });
        } catch {
          return json(502, { error: "AI unavailable" });
        }
      },
    },
  },
});
