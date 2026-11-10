import { describe, expect, it } from "vitest";
import { DEFAULT_SPONSOR_POLICY, selectSponsorModel, SPONSOR_MODELS, reserveCost, sponsorCost } from "@/lib/sponsor-policy";
describe("Sponsored policy", () => {
  it("starts disabled with zero funding", () => { expect(DEFAULT_SPONSOR_POLICY.enabled).toBe(false); expect(DEFAULT_SPONSOR_POLICY.emergency_stop).toBe(true); expect(DEFAULT_SPONSOR_POLICY.intro_usd).toBe(0); expect(DEFAULT_SPONSOR_POLICY.total_usd).toBe(0); });
  it("uses OpenAI for normal tutoring", () => expect(selectSponsorModel({ ...DEFAULT_SPONSOR_POLICY, openai_enabled: true }, "tutoring")).toEqual({ provider: "chatgpt", model: SPONSOR_MODELS.standard }));
  it("avoids the standard model for simple tasks", () => expect(selectSponsorModel({ ...DEFAULT_SPONSOR_POLICY, openai_enabled: true }, "simple").model).toBe(SPONSOR_MODELS.simple));
  it("does not silently use a disabled Claude override", () => expect(() => selectSponsorModel({ ...DEFAULT_SPONSOR_POLICY, claude_tasks: ["diagram"] }, "diagram")).toThrow("Claude is disabled"));
  it("prices 1000 input and 500 output standard tokens at $0.0035", () => expect(sponsorCost(SPONSOR_MODELS.standard, 1000, 500)).toBe(0.0035));
  it("rejects models without an approved price", () => expect(() => sponsorCost("unknown", 1000, 500)).toThrow());
  it("reserves more than ordinary prompt cost", () => expect(reserveCost(SPONSOR_MODELS.standard, "Teach", [{ content: "2+2" }], 500)).toBeGreaterThan(sponsorCost(SPONSOR_MODELS.standard, 10, 500)));
});