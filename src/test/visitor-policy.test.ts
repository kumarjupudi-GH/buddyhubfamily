import { describe, it, expect } from "vitest";
import { budgetAlert, localDay, estimateCost, VISITOR_MODELS } from "@/lib/visitor-policy";
describe("Visitor daily budget", () => {
  it("warns at exactly 80%", () => expect(budgetAlert(0.8, 1)).toBe("warn"));
  it("does not warn below 80%", () => expect(budgetAlert(0.799, 1)).toBe("ok"));
  it("reports a reached budget at 100%", () => expect(budgetAlert(1, 1)).toBe("over"));
  it("uses an adult's reporting timezone", () => expect(localDay("2026-11-10T01:00:00Z", "America/Chicago")).toBe("2026-11-09"));
  it("keeps unreported token costs unknown", () => expect(estimateCost(VISITOR_MODELS.gemini, null, 10)).toBeNull());
  it("prices Gemini input and output separately", () => expect(estimateCost(VISITOR_MODELS.gemini, 1000000, 1000000)).toBe(1.75));
});import { estimateCost as cost2, VISITOR_MODELS as M2 } from "@/lib/visitor-policy";
import { it as it2, expect as ex2 } from "vitest";
it2("OpenRouter uses only the free router and costs $0", () => { ex2(M2.openrouter).toBe("openrouter/free"); ex2(cost2(M2.openrouter, 5000, 2000)).toBe(0); });
