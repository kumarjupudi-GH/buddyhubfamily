import { describe, expect, it } from "vitest";
import { requireVisitorKey, isProvider, validModel } from "../lib/visitor-ai-policy";
describe("visitor-funded AI selection", () => {
  it("blocks missing visitor keys instead of using owner credits", () => {
    expect(() => requireVisitorKey(null)).toThrow("Connect your own AI account");
    expect(requireVisitorKey("test-only-credential")).toBe("test-only-credential");
  });
  it("supports OpenAI, Claude and Gemini only", () => {
    expect(isProvider("chatgpt")).toBe(true); expect(isProvider("claude")).toBe(true); expect(isProvider("gemini")).toBe(true); expect(isProvider("owner")).toBe(false);
  });
  it("rejects model/provider mismatches and path injection", () => {
    expect(validModel("claude", "claude-sonnet-5")).toBe(true);
    expect(validModel("chatgpt", "claude-sonnet-5")).toBe(false);
    expect(validModel("gemini", "gemini-test/../../other")).toBe(false);
  });
});