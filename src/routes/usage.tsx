import { createFileRoute, Link } from "@tanstack/react-router";
import { getMonthlyUsage } from "@/lib/usage.functions";

export const Route = createFileRoute("/usage")({
  head: () => ({
    meta: [
      { title: "AI usage this month — Family BuddyApps" },
      { name: "description", content: "How many answers the buddies gave this month, by AI helper, with an 80% budget alert." },
      { property: "og:title", content: "AI usage this month — Family BuddyApps" },
      { property: "og:description", content: "Monthly buddy answers by AI helper with an 80% budget alert." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: () => getMonthlyUsage(),
  component: UsagePage,
  errorComponent: ({ error }) => <p className="p-8">{error.message}</p>,
});

const NAMES: Record<string, string> = { claude: "Claude (explanations)", chatgpt: "ChatGPT (coding & reasoning)", gemini: "Google Gemini (everyday)" };

function UsagePage() {
  const { rows, used, budget, level } = Route.useLoaderData();
  const pct = Math.min(100, Math.round((used / budget) * 100));
  return (
    <main className="mx-auto max-w-xl p-6 space-y-5">
      <Link to="/" className="text-sm underline">← Home</Link>
      <h1 className="text-3xl font-bold">AI usage this month</h1>
      {level !== "ok" && (
        <div role="alert" className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {level === "over" ? "The monthly answer budget is used up." : `Heads up: ${pct}% of this month's answer budget is used.`}
        </div>
      )}
      <p>{used} of {budget} answers ({pct}%)</p>
      <div className="h-3 w-full rounded bg-muted"><div className="h-3 rounded bg-primary" style={{ width: pct + "%" }} /></div>
      <ul className="space-y-1">
        {["claude", "chatgpt", "gemini"].map((p) => (
          <li key={p} className="flex justify-between"><span>{NAMES[p]}</span><span>{rows.find((r) => r.provider === p)?.total ?? 0}</span></li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">Counts answers only. Your actual Lovable credit balance is shown in your workspace settings.</p>
    </main>
  );
}
