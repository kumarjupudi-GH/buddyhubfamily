import { describe, it, expect } from "vitest";
import { ART_AGES, getArtAge, buildArtSystem } from "@/lib/art-ages";

describe("ArtBuddy age groups", () => {
  it("offers the six age groups the user asked for", () => {
    expect(ART_AGES.map((a) => a.id)).toEqual(["kinder", "elementary", "middle", "high", "adult", "senior"]);
  });
  it("falls back to elementary for an unknown age", () => {
    expect(getArtAge("toddler").id).toBe("elementary");
  });
  it("keeps kindergarten answers shorter than adult answers", () => {
    expect(getArtAge("kinder").maxWords).toBeLessThan(getArtAge("adult").maxWords);
  });
  it("tells the teacher who the learner is", () => {
    expect(buildArtSystem(getArtAge("senior"))).toContain("Senior");
  });
});
