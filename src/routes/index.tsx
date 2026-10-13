import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BUDDY_APPS, type BuddyApp } from "@/lib/buddy-catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Family BuddyApps — One Connected Buddy Ecosystem" },
      { name: "description", content: "Ten friendly AI buddies for homework, art, wellness, budgets, repairs, travel, reminders, gardening, cooking and cleaning." },
      { property: "og:title", content: "Family BuddyApps — One Connected Buddy Ecosystem" },
      { property: "og:description", content: "Smart little buddies helping your family every day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const S = 100; // piece size in SVG units

// One jigsaw edge from (x0,y0) to (x1,y1); sign 0 = flat, ±1 = tab direction.
function edge(x0: number, y0: number, x1: number, y1: number, sign: number) {
  if (!sign) return `L${x1},${y1}`;
  const dx = x1 - x0, dy = y1 - y0;
  const nx = -dy * sign, ny = dx * sign;
  const p = (t: number, h: number) => `${(x0 + dx * t + nx * h).toFixed(1)},${(y0 + dy * t + ny * h).toFixed(1)}`;
  return `L${p(0.36, 0)} C${p(0.28, 0.26)} ${p(0.72, 0.26)} ${p(0.64, 0)} L${x1},${y1}`;
}

// Deterministic tab directions so neighbours always interlock.
const hTab = (c: number, r: number) => ((c + r) % 2 ? 1 : -1); // edge below cell (c,r)
const vTab = (c: number, r: number) => ((c + r) % 2 ? -1 : 1); // edge right of cell (c,r)

function piecePath(c: number, r: number, cols: number, rows: number) {
  const x = c * S, y = r * S;
  const top = r === 0 ? 0 : hTab(c, r - 1);
  const right = c === cols - 1 ? 0 : vTab(c, r);
  const bottom = r === rows - 1 ? 0 : hTab(c, r);
  const left = c === 0 ? 0 : vTab(c - 1, r);
  // Walking clockwise; normal (-dy,dx) points outward on top? We orient: top edge
  // left->right with normal pointing up when sign=-1.
  return [
    `M${x},${y}`,
    edge(x, y, x + S, y, top),
    edge(x + S, y, x + S, y + S, right),
    edge(x + S, y + S, x, y + S, -bottom),
    edge(x, y + S, x, y, -left),
    "Z",
  ].join(" ");
}

function Piece({ app, c, r, cols, rows }: { app: BuddyApp; c: number; r: number; cols: number; rows: number }) {
  const href = app.href ?? `/coming-soon/${app.slug}`;
  return (
    <a href={href} className="puzzle-piece group" aria-label={`${app.name}: ${app.blurb}`}>
      <title>{`${app.name} — ${app.blurb}`}</title>
      <path d={piecePath(c, r, cols, rows)} style={{ fill: `var(${app.color})` }} className="stroke-background" strokeWidth={2.5} />
    </a>
  );
}

function Label({ app, c, r }: { app: BuddyApp; c: number; r: number }) {
  const cx = c * S + S / 2, cy = r * S + S / 2;
  const words = app.name.replace(" Buddy", "").split(" ");
  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={30}>{app.emoji}</text>
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize={words.join(" ").length > 12 ? 9.5 : 11.5} fontWeight={700} className="fill-puzzle-ink">
        {words.join(" ")}
      </text>
      <text x={cx} y={cy + 33} textAnchor="middle" fontSize={8} fontWeight={600} className="fill-puzzle-ink opacity-70">Buddy</text>
    </g>
  );
}

function Puzzle({ cols, className }: { cols: number; className: string }) {
  const rows = Math.ceil(BUDDY_APPS.length / cols);
  const pad = 30;
  return (
    <svg viewBox={`${-pad} ${-pad} ${cols * S + pad * 2} ${rows * S + pad * 2}`} className={className} role="list" aria-label="BuddyApps puzzle">
      {BUDDY_APPS.map((app, i) => (
        <g role="listitem" key={app.slug}>
          <Piece app={app} c={i % cols} r={Math.floor(i / cols)} cols={cols} rows={rows} />
        </g>
      ))}
      {BUDDY_APPS.map((app, i) => (
        <Label key={app.slug} app={app} c={i % cols} r={Math.floor(i / cols)} />
      ))}
    </svg>
  );
}

const MEMBERS = ["Everyone", "Parent", "Kid", "Teen", "Grandparent"];

function Index() {
  const [member, setMember] = useState("Everyone");
  useEffect(() => {
    const m = localStorage.getItem("fb-member");
    if (m && MEMBERS.includes(m)) setMember(m);
  }, []);
  const pick = (m: string) => {
    setMember(m);
    localStorage.setItem("fb-member", m);
  };
  return (
    <main className="min-h-screen bg-background px-4 py-10 font-display text-foreground sm:px-8">
      <header className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">🧩 Family BuddyApps</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">Your Family, One Connected Buddy Ecosystem!</h1>
        <p className="mt-3 text-lg text-muted-foreground">Smart little buddies helping your family every day.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Who's using BuddyApps?">
          <span className="text-sm text-muted-foreground">Who's here?</span>
          {MEMBERS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => pick(m)}
              aria-pressed={member === m}
              className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${member === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </header>
      <section className="mx-auto mt-6 max-w-5xl">
        <Puzzle cols={5} className="hidden w-full md:block" />
        <Puzzle cols={2} className="mx-auto w-full max-w-md md:hidden" />
        <p className="mt-4 text-center text-sm text-muted-foreground">Tap a puzzle piece to open that buddy. Every buddy has a Home button to come back here.</p>
      </section>
    </main>
  );
}
