import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/parent")({
  head: () => ({
    meta: [
      { title: "Parent Dashboard — BrainBoost Buddy" },
      { name: "description", content: "Track each child's questions, subjects, streaks and chats in BrainBoost Buddy." },
      { property: "og:title", content: "Parent Dashboard — BrainBoost Buddy" },
      { property: "og:description", content: "Track each child's questions, subjects, streaks and chats in BrainBoost Buddy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ParentPage,
});

type Entry = { t: number; role: "user" | "assistant"; text: string; subject: string };
type Child = { id: string; name: string };
type Store = { pin?: string; children: Child[]; log: Record<string, Entry[]> };
const KEY = "bb_progress_v1";

function read(): Store {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { pin: d.pin, children: d.children || [], log: d.log || {} };
  } catch {
    return { children: [], log: {} };
  }
}
function write(d: Store) {
  localStorage.setItem(KEY, JSON.stringify(d));
}
async function hash(pin: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("bb:" + pin));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
const dayKey = (t: number) => new Date(t).toLocaleDateString("en-CA");

function stats(entries: Entry[]) {
  const qs = entries.filter((e) => e.role === "user");
  const subjects: Record<string, number> = {};
  qs.forEach((q) => (subjects[q.subject || "General"] = (subjects[q.subject || "General"] || 0) + 1));
  const days = new Set(qs.map((q) => dayKey(q.t)));
  let streak = 0;
  const d = new Date();
  if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d.getTime()))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  const week: { label: string; n: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const x = new Date();
    x.setDate(x.getDate() - i);
    const k = dayKey(x.getTime());
    week.push({ label: x.toLocaleDateString(undefined, { weekday: "short" }), n: qs.filter((q) => dayKey(q.t) === k).length });
  }
  return { qs, subjects, activeDays: days.size, streak, week, last: qs.at(-1)?.t };
}

function ParentPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [newName, setNewName] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => setStore(read()), []);
  const update = (fn: (d: Store) => void) => {
    const d = read();
    fn(d);
    write(d);
    setStore({ ...d });
  };

  if (!store) return null;

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(pin)) return setErr("Use 4 to 8 digits.");
    const h = await hash(pin);
    if (!store!.pin) {
      update((d) => (d.pin = h));
      setUnlocked(true);
    } else if (store!.pin === h) setUnlocked(true);
    else setErr("Wrong PIN.");
    setPin("");
  }

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <form onSubmit={submitPin} className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="text-4xl">🔒</div>
          <h1 className="mt-3 text-2xl font-bold text-card-foreground">Parent Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {store.pin ? "Enter your parent PIN." : "Create a parent PIN (4–8 digits) to protect this page."}
          </p>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => { setPin(e.target.value); setErr(""); }}
            className="mt-5 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg tracking-widest text-foreground"
            aria-label="Parent PIN"
          />
          {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
          <button className="mt-4 w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">
            {store.pin ? "Unlock" : "Set PIN"}
          </button>
          <p className="mt-4 text-xs text-muted-foreground">Progress is saved on this device only.</p>
        </form>
      </main>
    );
  }

  const child = store.children.find((c) => c.id === sel);

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Parent Dashboard</h1>
            <p className="text-muted-foreground">BrainBoost Buddy learning progress (this device)</p>
          </div>
          <div className="flex gap-2">
            <a href="/apps/homework-buddy/index.html" className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Open BrainBoost Buddy</a>
            <Link to="/" className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Home</Link>
          </div>
        </div>

        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = newName.trim().slice(0, 20);
            if (!n) return;
            update((d) => d.children.push({ id: crypto.randomUUID(), name: n }));
            setNewName("");
          }}
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Child's name"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground"
          />
          <button className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">Add child</button>
        </form>

        {store.children.length === 0 && (
          <p className="mt-8 text-center text-muted-foreground">Add a child above. They'll pick their name when they open BrainBoost Buddy.</p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {store.children.map((c) => {
            const s = stats(store.log[c.id] || []);
            const max = Math.max(1, ...s.week.map((w) => w.n));
            return (
              <button
                key={c.id}
                onClick={() => setSel(c.id)}
                className={`rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:shadow-md ${sel === c.id ? "border-primary" : "border-border"}`}
              >
                <h2 className="text-xl font-bold text-card-foreground">{c.name}</h2>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Stat n={s.qs.length} l="Questions" />
                  <Stat n={s.activeDays} l="Active days" />
                  <Stat n={`${s.streak}🔥`} l="Streak" />
                </div>
                <div className="mt-4 flex h-16 items-end gap-1">
                  {s.week.map((w, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-sm bg-primary" style={{ height: `${(w.n / max) * 44 + 2}px` }} title={`${w.n} questions`} />
                      <span className="text-[10px] text-muted-foreground">{w.label}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {s.last ? `Last active ${new Date(s.last).toLocaleString()}` : "No activity yet"}
                </p>
              </button>
            );
          })}
        </div>

        {child && <ChildDetail child={child} entries={store.log[child.id] || []} onRemove={() => {
          if (!confirm(`Remove ${child.name} and all their history?`)) return;
          update((d) => { d.children = d.children.filter((x) => x.id !== child.id); delete d.log[child.id]; });
          setSel(null);
        }} />}
      </div>
    </main>
  );
}

function Stat({ n, l }: { n: React.ReactNode; l: string }) {
  return (
    <div className="rounded-lg bg-muted p-2">
      <div className="text-lg font-bold text-foreground">{n}</div>
      <div className="text-[11px] text-muted-foreground">{l}</div>
    </div>
  );
}

function ChildDetail({ child, entries, onRemove }: { child: Child; entries: Entry[]; onRemove: () => void }) {
  const s = useMemo(() => stats(entries), [entries]);
  const subj = Object.entries(s.subjects).sort((a, b) => b[1] - a[1]);
  const byDay = useMemo(() => {
    const m: Record<string, Entry[]> = {};
    entries.forEach((e) => (m[dayKey(e.t)] ||= []).push(e));
    return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);
  const total = Math.max(1, s.qs.length);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-card-foreground">{child.name}'s learning</h2>
        <button onClick={onRemove} className="text-sm text-destructive">Remove child</button>
      </div>

      <h3 className="mt-6 font-semibold text-card-foreground">Subjects practiced</h3>
      {subj.length === 0 ? <p className="text-sm text-muted-foreground">Nothing yet.</p> : (
        <div className="mt-2 space-y-2">
          {subj.map(([k, v]) => (
            <div key={k}>
              <div className="flex justify-between text-sm text-foreground"><span>{k}</span><span>{v}</span></div>
              <div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${(v / total) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}

      <h3 className="mt-6 font-semibold text-card-foreground">Chat history</h3>
      {byDay.length === 0 && <p className="text-sm text-muted-foreground">No chats yet.</p>}
      <div className="mt-2 space-y-3">
        {byDay.map(([day, list]) => (
          <details key={day} className="rounded-lg border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              {new Date(day + "T12:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })} · {list.filter((e) => e.role === "user").length} questions
            </summary>
            <div className="mt-3 space-y-2">
              {list.map((e, i) => (
                <div key={i} className={`rounded-lg p-3 text-sm ${e.role === "user" ? "bg-primary/10" : "bg-muted"}`}>
                  <div className="mb-1 text-xs text-muted-foreground">
                    {e.role === "user" ? child.name : "Buddy"} · {new Date(e.t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{e.subject ? ` · ${e.subject}` : ""}
                  </div>
                  <div className="whitespace-pre-wrap text-foreground">{e.text}</div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
