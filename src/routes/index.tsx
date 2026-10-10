import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Buddy Apps — BrainBoost Buddy & ArtBuddy" },
      {
        name: "description",
        content: "Welcome! Friendly AI buddies for kids: BrainBoost Buddy for homework help and ArtBuddy for learning to draw.",
      },
      { property: "og:title", content: "Buddy Apps — BrainBoost Buddy & ArtBuddy" },
      {
        property: "og:description",
        content: "Welcome! Friendly AI buddies for kids: BrainBoost Buddy for homework help and ArtBuddy for learning to draw.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <div className="text-6xl" aria-hidden="true">👋</div>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
        Welcome, Buddy!
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Ready to learn something awesome today? Get homework help or learn to draw — just pick your buddy below.
      </p>

      <div className="mt-10 flex w-full max-w-md flex-col gap-4 sm:max-w-xl sm:flex-row">
        <a
          href="/apps/homework-buddy/index.html"
          className="flex-1 rounded-2xl bg-primary px-6 py-5 text-xl font-bold text-primary-foreground shadow-md transition hover:-translate-y-1 hover:shadow-lg"
        >
          🧠 BrainBoost Buddy
        </a>
        <a
          href="/apps/artbuddy/index.html"
          className="flex-1 rounded-2xl border-2 border-primary bg-card px-6 py-5 text-xl font-bold text-card-foreground shadow-md transition hover:-translate-y-1 hover:shadow-lg"
        >
          🎨 ArtBuddy
        </a>
      </div>

      <div className="mt-10 flex gap-6 text-sm text-muted-foreground">
        <Link to="/parent" className="underline underline-offset-4">Parent Dashboard</Link>
        <Link to="/teacher" className="underline underline-offset-4">Teacher Dashboard</Link>
      </div>
    </main>
  );
}
