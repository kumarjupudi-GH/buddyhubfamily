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
