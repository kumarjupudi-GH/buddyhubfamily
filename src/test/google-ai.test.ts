import { describe, it, expect } from "vitest";
import { classifyGoogleError, toGeminiContents } from "@/lib/google-ai";
import { AI_LIMITS, limitMessage } from "@/lib/ai-limits";

describe("Google free-tier errors", () => {
  it("turns a quota error into a friendly 429 rate limit", () => {
    const e = classifyGoogleError(429, '{"error":{"status":"RESOURCE_EXHAUSTED"}}');
    expect(e.status).toBe(429);
    expect(e.code).toBe("rate_limited");
  });
  it("treats a bad key as a setup problem, not a user error", () => {
    expect(classifyGoogleError(400, "API key not valid. Please pass a valid API key.").code).toBe("server_not_configured");
  });
});

describe("chat format", () => {
  it("sends buddy replies to Google as the model role", () => {
    expect(toGeminiContents([{ role: "user", content: "hi" }, { role: "assistant", content: "hello" }]).map((c) => c.role)).toEqual([
      "user",
      "model",
    ]);
  });
});

describe("usage limits", () => {
  it("allows 30 chat questions per visitor per hour and 900 per day site-wide", () => {
    expect(AI_LIMITS.chat).toEqual({ perVisitorPerHour: 30, sitePerDay: 900 });
  });
  it("keeps paid pictures to 5 per visitor per hour and 40 per day", () => {
    expect(AI_LIMITS.picture).toEqual({ perVisitorPerHour: 5, sitePerDay: 40 });
  });
  it("only blocks when the backend says a limit was reached", () => {
    expect(limitMessage("ok")).toBeNull();
    expect(limitMessage("visitor")).not.toBeNull();
    expect(limitMessage("site")).not.toBeNull();
  });
});
