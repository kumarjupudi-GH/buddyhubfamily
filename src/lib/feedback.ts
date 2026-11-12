import { z } from "zod";
import { BUDDY_APPS } from "@/lib/buddy-catalog";

export const FEEDBACK_APPS = [{ slug: "family", name: "Family BuddyApps", href: "/", emoji: "🧩" }, ...BUDDY_APPS];
export const CATEGORIES = ["General Feedback", "Bug / Technical Issue", "AI Response Quality", "Incorrect or Confusing Explanation", "Slow Response", "Feature Suggestion", "User Experience", "Billing / Credits Issue", "Appreciation"] as const;
export const STATUSES = ["New", "Under Review", "In Progress", "Resolved", "Closed"] as const;
export const METRICS = [
  ["overall", "Overall experience"], ["ai_quality", "AI response quality"],
  ["accuracy", "Answer accuracy"], ["clarity", "Explanation clarity"],
  ["visuals", "Diagrams & visuals"], ["speed", "Response speed"],
  ["ease", "Ease of use"], ["reliability", "Reliability"], ["value", "Billing & credits experience"],
] as const;
const ratings = z.object(Object.fromEntries(METRICS.map(([key]) => [key, z.number().int().min(1).max(5).optional()]))).strict();
export const feedbackEntrySchema = z.object({
  id: z.string().uuid(),
  app_id: z.string().refine(value => FEEDBACK_APPS.some(app => app.slug === value), "Choose a BuddyApp"),
  category: z.enum(CATEGORIES), ratings,
  description: z.string().trim().max(3000), helpful: z.boolean().nullable().default(null),
  reason: z.enum(["Incorrect answer", "Explanation unclear", "Diagram not helpful", "Response too slow", "Other"]).nullable().default(null),
  screenshot_path: z.string().max(200).nullable().default(null),
}).superRefine((entry, ctx) => {
  if (entry.helpful === null && !entry.ratings["overall"]) ctx.addIssue({ code: "custom", message: "Choose an overall experience rating", path: ["ratings"] });
});
export const feedbackSchema = z.object({
  batch: z.string().uuid(), name: z.string().trim().max(100),
  email: z.union([z.literal(""), z.string().trim().email().max(255)]), wants_response: z.boolean(),
  entries: z.array(feedbackEntrySchema).min(1).max(10),
}).superRefine((data, ctx) => {
  if (data.wants_response && !data.email) ctx.addIssue({ code: "custom", message: "Enter an email address for a response", path: ["email"] });
  if (new Set(data.entries.map(e => e.id)).size !== data.entries.length) ctx.addIssue({ code: "custom", message: "Duplicate entry" });
  for (const e of data.entries) if (e.screenshot_path && e.screenshot_path !== `${data.batch}/${e.id}.png`) ctx.addIssue({ code: "custom", message: "Invalid screenshot" });
});
export type FeedbackEntry = z.infer<typeof feedbackEntrySchema>;
export function averageRating(entries: { ratings: unknown }[], key: string) {
  const values = entries.flatMap(e => {
    const value = e.ratings && typeof e.ratings === "object" ? (e.ratings as Record<string, unknown>)[key] : null;
    return typeof value === "number" ? [value] : [];
  });
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@\-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}