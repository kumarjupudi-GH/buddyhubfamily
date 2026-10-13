import { createFileRoute, Link } from "@tanstack/react-router";
import { BUDDY_APPS } from "@/lib/buddy-catalog";

export const Route = createFileRoute("/coming-soon/$slug")({
  head: () => ({
    meta: [
      { title: "Coming soon — Family BuddyApps" },
      { name: "description", content: "This BuddyApp is still being built. Check back soon!" },
      { property: "og:title", content: "Coming soon — Family BuddyApps" },
      { property: "og:description", content: "This BuddyApp is still being built. Check back soon!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComingSoon,
});

function ComingSoon() {
  const { slug } = Route.useParams();
  const app = BUDDY_APPS.find((a) => a.slug === slug);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center font-display">
      <div className="text-7xl" aria-hidden="true">{app?.emoji ?? "🧩"}</div>
      <h1 className="mt-4 text-3xl font-bold text-foreground">{app?.name ?? "This buddy"} is coming soon</h1>
      <p className="mt-2 max-w-md text-muted-foreground">We're still building this piece of the puzzle. Check back soon!</p>
      <Link to="/" className="mt-8 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-md hover:opacity-90">
        🏠 Back to the puzzle
      </Link>
    </main>
  );
}
