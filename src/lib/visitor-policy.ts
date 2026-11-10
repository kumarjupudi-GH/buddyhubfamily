export type VisitorProvider = "claude" | "chatgpt" | "gemini";
export const VISITOR_MODELS = { claude: "claude-haiku-4-5-20251001", chatgpt: "gpt-6.1-terra", gemini: "gemini-3.1-flash-lite", diagram: "gemini-3.8-flash", picture: "gpt-image-2.5-sunburst" } as const;
export function budgetAlert(used: number, budget: number) {
  return used >= budget ? "over" : used >= budget * 0.8 ? "warn" : "ok";
}
export function localDay(date: string | Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));
}
// Standard public API list rates, USD per million tokens, not invoices or balances.
// Sources: ai.google.dev/gemini-api/docs/pricing and platform.claude.com/docs/en/about-claude/pricing,
// developers.openai.com/api/docs/models/gpt-6.1-terra and gpt-image-2.5-sunburst (checked 2026-11-10).
export function estimateCost(model: string, input: number | null, output: number | null, cached = 0, at = new Date()) {
  if (input === null || output === null) return null;
  const rates: Record<string, [number, number, number]> = {
    [VISITOR_MODELS.claude]: [1, 5, 0.1],
    [VISITOR_MODELS.chatgpt]: [1, 5, 0.05],
    [VISITOR_MODELS.gemini]: [0.25, 1.5, 0.025],
    [VISITOR_MODELS.diagram]: at < new Date("2027-01-01T00:00:00Z") ? [0.75, 3.75, 0.075] : [1.5, 7.5, 0.15],
    [VISITOR_MODELS.picture]: [5, 30, 1.25],
  };
  const rate = rates[model];
  if (!rate) return null;
  return (Math.max(0, input - cached) * rate[0] + cached * rate[2] + output * rate[1]) / 1e6;
}