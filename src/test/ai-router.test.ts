import { describe, it, expect } from "vitest";
import { pickProvider, usageAlert } from "@/lib/ai-router";

describe("AI routing", () => {
  it("sends coding questions to ChatGPT", () => expect(pickProvider("Help me fix my python loop", "buddy")).toBe("chatgpt"));
  it("sends BrainBoost tutoring to Claude", () => expect(pickProvider("What is 3 + 4?", "tutor")).toBe("claude"));
  it("sends explanation questions from buddies to Claude", () => expect(pickProvider("Why do we need sleep?", "buddy")).toBe("claude"));
  it("keeps simple buddy chat on cheap Gemini", () => expect(pickProvider("Give me a snack idea", "buddy")).toBe("gemini"));
});

describe("80% usage alert", () => {
  it("warns at 800 of 1000 answers", () => expect(usageAlert(800, 1000)).toBe("warn"));
  it("is fine at 799", () => expect(usageAlert(799, 1000)).toBe("ok"));
  it("is over at 1000", () => expect(usageAlert(1000, 1000)).toBe("over"));
});
