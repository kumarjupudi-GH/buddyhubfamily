import { z } from "zod";

export const sponsorPolicySchema = z.object({
  enabled: z.boolean().default(false), emergency_stop: z.boolean().default(true),
  openai_enabled: z.boolean().default(false), claude_enabled: z.boolean().default(false),
  allow_fallback: z.boolean().default(false), intro_usd: z.number().min(0).max(100).default(0),
  daily_questions: z.number().int().min(0).max(1000).default(0),
  per_user_usd: z.number().min(0).max(100).default(0), total_usd: z.number().min(0).max(10000).default(0),
  claude_tasks: z.array(z.enum(["tutoring", "simple", "diagram", "art"])).default([]),
});
export const DEFAULT_SPONSOR_POLICY = sponsorPolicySchema.parse({});
export const SPONSOR_MODELS = { simple: "gpt-6-luna", standard: "gpt-6.1-terra", claude: "claude-haiku-4-5-20251001" } as const;
export type SponsorPolicy = z.infer<typeof sponsorPolicySchema>;
export type SponsorBalance = { granted: number; used: number; remaining: number; available: boolean; dailyLimit: number; siteRemaining: number | null };
export function readBalance(value: unknown): SponsorBalance {
  return z.object({ granted: z.number(), used: z.number(), remaining: z.number(), available: z.boolean(), dailyLimit: z.number(), siteRemaining: z.number().nullable() }).parse(value);
}
export function sponsorRate(model: string): [number, number, number] | null {
  if (model === SPONSOR_MODELS.simple) return [0.1, 0.5, 0.01];
  if (model === SPONSOR_MODELS.standard) return [1, 5, 0.05];
  if (model === SPONSOR_MODELS.claude) return [1, 5, 0.1];
  return null;
}
export function sponsorCost(model: string, input: number, output: number, cached = 0) {
  const rate = sponsorRate(model);
  if (!rate) throw new Error("This model has no approved price.");
  return (Math.max(0, input - cached) * rate[0] + cached * rate[2] + output * rate[1]) / 1e6;
}
// Reserve generously: UTF-8 bytes upper-bound ordinary text tokens, plus protocol overhead.
export function reserveCost(model: string, system: string, messages: { content: string }[], maxTokens: number) {
  const bytes = new TextEncoder().encode(system + messages.map(m => m.content).join("\n")).length;
  return sponsorCost(model, bytes + 4096 + messages.length * 256, maxTokens) * 1.1;
}
export function selectSponsorModel(policy: SponsorPolicy, task: string) {
  if (policy.claude_tasks.includes(task as SponsorPolicy["claude_tasks"][number])) {
    if (!policy.claude_enabled) throw new Error("Claude is disabled for this task.");
    return { provider: "claude" as const, model: SPONSOR_MODELS.claude };
  }
  if (!policy.openai_enabled) throw new Error("OpenAI is currently disabled.");
  return { provider: "chatgpt" as const, model: task === "simple" ? SPONSOR_MODELS.simple : SPONSOR_MODELS.standard };
}