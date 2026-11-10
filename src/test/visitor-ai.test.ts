import { afterEach, describe, expect, it, vi } from "vitest";
const query = vi.hoisted(() => ({ keyOwner: "", event: {}, updated: {} }));
vi.mock("@/lib/visitor-crypto.server", () => ({ decryptVisitorKey: async (_: string, owner: string) => { query.keyOwner = owner; return "test-only-key"; } }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: (name: string) => {
  if (name === "visitor_ai_keys") return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { ciphertext: "encrypted" }, error: null }) }) }) }) };
  return { insert: (data: unknown) => { query.event = data as object; return { select: () => ({ single: async () => ({ data: { id: "event" }, error: null }) }) }; }, update: (data: object) => { query.updated = data; return { eq: async () => ({ error: null }) }; } };
} } }));
import { visitorIdentity, visitorText } from "@/lib/visitor-ai.server";
afterEach(() => vi.unstubAllGlobals());
describe("Visitor-only AI funding", () => {
  it("rejects signed-out requests without any inference call", async () => {
    const network = vi.fn(); vi.stubGlobal("fetch", network);
    await expect(visitorIdentity(new Request("https://example.test"))).rejects.toMatchObject({ status: 401 });
    expect(network).not.toHaveBeenCalled();
  });
  it("binds credentials and usage to the signed-in adult", async () => {
    const network = vi.fn(async () => Response.json({ candidates: [{ content: { parts: [{ text: "Four" }] } }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 2 } })); vi.stubGlobal("fetch", network);
    const answer = await visitorText({ userId: "adult-123", buddy: "zen", provider: "gemini", system: "Teach", messages: [{ role: "user", content: "2+2" }], maxTokens: 100 });
    expect(query.keyOwner).toBe("adult-123:gemini");
    expect(query.event).toMatchObject({ user_id: "adult-123", provider: "gemini" });
    expect(answer.text).toBe("Four"); expect(network).toHaveBeenCalledTimes(1);
    expect(query.updated).toMatchObject({ input_tokens: 10, output_tokens: 2, estimated_usd: 0.0000055 });
  });
  it("does not retry with host credentials after quota exhaustion", async () => {
    const network = vi.fn(async () => new Response("quota", { status: 429 })); vi.stubGlobal("fetch", network);
    await expect(visitorText({ userId: "adult-123", buddy: "zen", provider: "gemini", system: "Teach", messages: [{ role: "user", content: "2+2" }], maxTokens: 100 })).rejects.toMatchObject({ status: 429 });
    expect(network).toHaveBeenCalledTimes(1);
  });
});