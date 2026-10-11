import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

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
    <main className="flex min-h-screen min-w-0 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-6xl" aria-hidden="true">👋</div>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
        Welcome, Buddy!
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Ready to learn something awesome today? Get homework help or learn to draw — just pick your buddy below.
      </p>

      <div className="mt-10 flex w-full max-w-md flex-col gap-4 sm:max-w-xl sm:flex-row">
        <Button asChild className="h-auto flex-1 whitespace-normal rounded-lg px-6 py-5 text-xl font-bold">
        <a
          href="/apps/homework-buddy/index.html"
        >
          🧠 BrainBoost Buddy
        </a>
        </Button>
        <Button asChild variant="outline" className="h-auto flex-1 whitespace-normal rounded-lg px-6 py-5 text-xl font-bold">
        <a
          href="/apps/artbuddy/index.html"
        >
          🎨 ArtBuddy
        </a>
        </Button>
      </div>

    </main>
  );
}
