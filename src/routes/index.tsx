import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Buddy Apps — BrainBoost Buddy & ArtBuddy" },
      {
        name: "description",
        content:
          "Two friendly AI buddy apps for kids: BrainBoost Buddy helps with homework, and ArtBuddy teaches drawing step by step.",
      },
      { property: "og:title", content: "Buddy Apps — BrainBoost Buddy & ArtBuddy" },
      {
        property: "og:description",
        content:
          "Two friendly AI buddy apps for kids: BrainBoost Buddy helps with homework, and ArtBuddy teaches drawing step by step.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Your buddy apps, hosted
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Pick a buddy to get started
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Both apps are live with their built-in AI helpers.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <a
            href="/apps/homework-buddy/index.html"
            className="group rounded-2xl border border-border bg-card p-8 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl" aria-hidden="true">
              🧠
            </div>
            <h2 className="mt-4 text-2xl font-bold text-card-foreground">BrainBoost Buddy</h2>
            <p className="mt-2 text-muted-foreground">
              Homework help for kindergarten to grade 12 — hints and steps, not just answers. Type or
              ask by voice.
            </p>
            <span className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition group-hover:opacity-90">
              Open BrainBoost Buddy →
            </span>
          </a>

          <a
            href="/apps/artbuddy/index.html"
            className="group rounded-2xl border border-border bg-card p-8 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl" aria-hidden="true">
              🎨
            </div>
            <h2 className="mt-4 text-2xl font-bold text-card-foreground">ArtBuddy</h2>
            <p className="mt-2 text-muted-foreground">
              A cheerful art teacher for kids aged 5–12, with step-by-step drawing lessons and a
              "Help me!" button.
            </p>
            <span className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition group-hover:opacity-90">
              Open ArtBuddy →
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
