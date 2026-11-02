import { describe, it, expect } from "vitest";
import { parseJudge } from "@/lib/ai-gateway";

describe("parseJudge", () => {
  it("picks Google (B) when the judge says B", () => {
    expect(parseJudge("WINNER: B\nOK")).toEqual({ winner: "B", ok: true, note: null });
  });
  it("keeps the correction note when the winner needs a fix", () => {
    expect(parseJudge("WINNER: A\nFIX: 7 x 8 is 56.")).toEqual({ winner: "A", ok: false, note: "7 x 8 is 56." });
  });
  it("returns null when no winner is given", () => {
    expect(parseJudge("I like both")).toBeNull();
  });
});
