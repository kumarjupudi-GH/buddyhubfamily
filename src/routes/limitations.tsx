import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/limitations")({
  head: () => ({
    meta: [
      { title: "Limitations — Family BuddyApps" },
      { name: "description", content: "What our AI buddies can and cannot do: answers can be wrong, no professional advice, and how your family's privacy is protected." },
      { property: "og:title", content: "Limitations — Family BuddyApps" },
      { property: "og:description", content: "What our AI buddies can and cannot do." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Limitations,
});

const LIMITS = [
  {
    emoji: "🧠",
    title: "AI can make mistakes",
    body: "Our buddies are smart, but not perfect. Every answer is double-checked by Google AI, yet a check is not a guarantee. Always verify important facts with a teacher, parent or a trusted source.",
  },
  {
    emoji: "🖼️",
    title: "Pictures and diagrams can be off",
    body: "Illustrations, charts and geometry diagrams are AI-generated too. They can be mislabeled or slightly wrong — use them to understand, not as the final answer.",
  },
  {
    emoji: "🩺",
    title: "Not professional advice",
    body: "Buddies can share general wellness, budgeting, cooking or repair ideas, but they are not doctors, lawyers, financial advisors or mechanics. For anything serious, talk to a real professional.",
  },
  {
    emoji: "🔒",
    title: "Privacy: we keep it simple",
    body: "No accounts, no sign-up, no tracking dashboards. A nickname you type stays on your own device and is never sent anywhere. Buddies are instructed to never ask for personal information.",
  },
  {
    emoji: "🚨",
    title: "Buddies are not for emergencies",
    body: "If you feel unsafe, very sad or in danger, talk to a trusted adult right away. In an immediate emergency call 911 (or your local number). The 988 lifeline is there in the US for mental-health crises.",
  },
  {
    emoji: "📶",
    title: "Fair-use limits",
    body: "To keep things free and running for the whole family, each visitor has a daily limit of AI questions. If you hit it, the buddy will let you know and ask you to come back later.",
  },
  {
    emoji: "🧩",
    title: "Independent apps",
    body: "Every buddy app opens on its own and works without signing in. Some buddies are still being tested and may improve over time — feedback from the family helps.",
  },
];

function Limitations() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 font-display text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">🧩 Family BuddyApps</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">What our buddies can — and can't — do</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            A short, honest list of limitations so your family knows exactly how to use these apps safely.
          </p>
        </header>

        <ul className="mt-10 space-y-4">
          {LIMITS.map((l) => (
            <li key={l.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span aria-hidden="true">{l.emoji}</span>
                {l.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
          >
            🧩 Back to the puzzle
          </Link>
        </div>
      </div>
    </main>
  );
}
