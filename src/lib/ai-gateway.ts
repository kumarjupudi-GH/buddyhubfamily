// Server-only helper: calls the Lovable AI Gateway's native Claude Messages
// endpoint with streaming, and accumulates the final text reply.

export async function askClaude(options: {
  model: string;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens: number;
}): Promise<{ text: string; truncated: boolean }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    throw Object.assign(new Error("AI is not configured."), { status: 500 });
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens,
      system: options.system,
      messages: options.messages,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    let message = "The AI had a problem. Try again.";
    try {
      const data = (await res.json()) as { error?: { message?: string }; message?: string };
      message = data?.error?.message || data?.message || message;
    } catch {
      /* keep default */
    }
    throw Object.assign(new Error(message), { status: res.status });
  }

  // Consume the SSE stream and accumulate text deltas.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let truncated = false;

  const handleEvent = (raw: string) => {
    const dataLine = raw
      .split("\n")
      .find((l) => l.startsWith("data:"));
    if (!dataLine) return;
    const payload = dataLine.slice(5).trim();
    if (!payload || payload === "[DONE]") return;
    let evt: any;
    try {
      evt = JSON.parse(payload);
    } catch {
      return;
    }
    if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
      text += evt.delta.text;
    }
    if (evt.type === "message_delta" && evt.delta?.stop_reason === "max_tokens") {
      truncated = true;
    }
    if (evt.type === "error") {
      throw Object.assign(new Error(evt.error?.message || "AI stream error."), {
        status: 502,
      });
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      handleEvent(buffer.slice(0, idx));
      buffer = buffer.slice(idx + 2);
    }
  }
  if (buffer.trim()) handleEvent(buffer);

  return { text, truncated };
}

// Server-only helper: asks Google Gemini to double-check a buddy's answer to a
// child. Returns null when the review cannot be completed (the original answer
// is still shown without a check badge).
export async function checkAnswer(options: {
  question: string;
  answer: string;
}): Promise<{ ok: boolean; note: string | null } | null> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        max_tokens: 120,
        messages: [
          {
            role: "user",
            content: [
              "You are double-checking another AI buddy's answer to a child (ages 5-18).",
              "If the answer is accurate, safe and age-appropriate, reply with exactly: OK",
              "If anything is factually wrong, unsafe, or confusing, reply with: FIX: followed by one short, kind, kid-friendly sentence that corrects it.",
              "Never ask for personal information. No markdown.",
              "",
              "Child asked: " + options.question.slice(0, 500),
              "Buddy answered: " + options.answer.slice(0, 1500),
            ].join("\n"),
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const text: string = data?.choices?.[0]?.message?.content?.trim?.() || "";
    if (!text) return null;
    if (/^ok\b/i.test(text)) return { ok: true, note: null };
    const m = text.match(/^fix:\s*(.+)$/is);
    return { ok: false, note: (m && m[1] ? m[1] : text).trim().slice(0, 200) };
  } catch {
    return null;
  }
}

// Server-only helper: asks a Google Gemini model the same question (OpenAI
// chat-completions format on the gateway).
export async function askGemini(options: {
  model: string;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens: number;
}): Promise<{ text: string; truncated: boolean }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw Object.assign(new Error("AI is not configured."), { status: 500 });
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens,
      messages: [{ role: "system", content: options.system }, ...options.messages],
    }),
  });
  if (!res.ok) throw Object.assign(new Error("Google AI had a problem."), { status: res.status });
  const data = (await res.json()) as any;
  const choice = data?.choices?.[0];
  return {
    text: String(choice?.message?.content ?? "").trim(),
    truncated: choice?.finish_reason === "length",
  };
}

export type AnswerSource = "claude" | "google";

// Pure: parse the judge's reply ("WINNER: A" / "WINNER: B" then "OK" or "FIX: ...").
export function parseJudge(reply: string): { winner: "A" | "B"; ok: boolean; note: string | null } | null {
  const w = reply.match(/WINNER:\s*([AB])/i);
  if (!w) return null;
  const winner = w[1]!.toUpperCase() as "A" | "B";
  const fix = reply.match(/FIX:\s*(.+)/is);
  if (fix && fix[1]) return { winner, ok: false, note: fix[1].trim().slice(0, 200) };
  return { winner, ok: true, note: null };
}

async function judge(question: string, a: string, b: string) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        max_tokens: 150,
        messages: [
          {
            role: "user",
            content: [
              "Two AI buddies answered the same question from a family member (could be a child aged 5-18).",
              "Pick the answer that is MORE ACCURATE first, then easier to understand and more visual (clear steps, lists, tables, diagrams, examples), and safe and age-appropriate.",
              "Reply on the first line with exactly: WINNER: A  or  WINNER: B",
              "On the second line write OK if the winning answer is accurate and safe, otherwise FIX: and one short, kind sentence correcting it. No markdown.",
              "",
              "Question: " + question.slice(0, 600),
              "",
              "Answer A:\n" + a.slice(0, 2500),
              "",
              "Answer B:\n" + b.slice(0, 2500),
            ].join("\n"),
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    return parseJudge(String(data?.choices?.[0]?.message?.content ?? ""));
  } catch {
    return null;
  }
}

// Asks Claude and Google Gemini in parallel, has a judge pick the more accurate
// and easier-to-understand answer, and returns only that one.
export async function bestAnswer(options: {
  claudeModel: string;
  geminiModel: string;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens: number;
  question: string;
}): Promise<{
  text: string;
  truncated: boolean;
  source: AnswerSource;
  check: { ok: boolean; note: string | null } | null;
}> {
  const { claudeModel, geminiModel, question, ...rest } = options;
  const [c, g] = await Promise.allSettled([
    askClaude({ ...rest, model: claudeModel }),
    askGemini({ ...rest, model: geminiModel }),
  ]);
  const claude = c.status === "fulfilled" && c.value.text.trim() ? c.value : null;
  const google = g.status === "fulfilled" && g.value.text.trim() ? g.value : null;
  if (!claude && !google) {
    if (c.status === "rejected") throw c.reason;
    throw Object.assign(new Error("The AI sent an empty answer."), { status: 502 });
  }
  if (!claude || !google) {
    const only = (claude || google)!;
    const check = await checkAnswer({ question, answer: only.text });
    return { ...only, source: claude ? "claude" : "google", check };
  }
  const verdict = await judge(question, claude.text, google.text);
  if (!verdict) return { ...claude, source: "claude", check: null };
  const pick = verdict.winner === "A" ? claude : google;
  return {
    ...pick,
    source: verdict.winner === "A" ? "claude" : "google",
    check: { ok: verdict.ok, note: verdict.note },
  };
}
