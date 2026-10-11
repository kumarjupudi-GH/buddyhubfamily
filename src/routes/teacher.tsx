import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher Dashboard — BrainBoost Buddy & ArtBuddy" },
      { name: "description", content: "See every student's homework questions and drawings, grouped by grade and subject." },
      { property: "og:title", content: "Teacher Dashboard — BrainBoost Buddy & ArtBuddy" },
      { property: "og:description", content: "See every student's homework questions and drawings, grouped by grade and subject." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeacherPage,
});

type Entry = { t: number; app?: string; role: string; text: string; subject: string; img?: string };
type Child = { id: string; name: string; grade?: string };
type Store = { pin?: string; teacherPin?: string; children: Child[]; log: Record<string, Entry[]> };
const KEY = "bb_progress_v1";
const WEEK = 7 * 24 * 3600 * 1000;
const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const gradeLabel = (g?: string) => (!g ? "No grade set" : g === "K" ? "Kindergarten" : `Grade ${g}`);

function read(): Store {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { ...d, children: d.children || [], log: d.log || {} };
  } catch {
    return { children: [], log: {} };
  }
}
async function hash(pin: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("bbt:" + pin));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
const when = (t: number) => new Date(t).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });

function TeacherPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("3");
  const [filter, setFilter] = useState("all");
  const [report, setReport] = useState(false);

  useEffect(() => setStore(read()), []);
  const update = (fn: (d: Store) => void) => {
    const d = read();
    fn(d);
    localStorage.setItem(KEY, JSON.stringify(d));
    setStore({ ...d });
  };

  const groups = useMemo(() => {
    if (!store) return [];
    const cut = Date.now() - WEEK;
    const byGrade: Record<string, Record<string, { child: Child; e: Entry }[]>> = {};
    [{ id: "__independent__", name: "Independent activity" }, ...store.children].forEach((c: Child) => {
      (store.log[c.id] || [])
        .filter((e) => e.t >= cut && (e.role === "user" || e.role === "drawing"))
        .filter((e) => filter === "all" || (filter === "art" ? e.role === "drawing" : e.role === "user"))
        .forEach((e) => {
          const g = gradeLabel(c.grade);
          const s = e.role === "drawing" ? "Art (ArtBuddy)" : e.subject || "General";
          ((byGrade[g] ||= {})[s] ||= []).push({ child: c, e });
        });
    });
    const order = (g: string) => (g === "Kindergarten" ? -1 : g.startsWith("Grade") ? Number(g.slice(6)) : 99);
    return Object.entries(byGrade)
      .sort((a, b) => order(a[0]) - order(b[0]))
      .map(([g, subs]) => [g, Object.entries(subs).sort((a, b) => b[1].length - a[1].length).map(([s, l]) => [s, l.sort((x, y) => y.e.t - x.e.t)] as const)] as const);
  }, [store, filter]);

  if (!store) return null;

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(pin)) return setErr("Use 4 to 8 digits.");
    const h = await hash(pin);
    if (!store) return;
    if (!store.teacherPin) {
      update((d) => (d.teacherPin = h));
      setUnlocked(true);
    } else if (store.teacherPin === h) setUnlocked(true);
    else setErr("Wrong PIN.");
    setPin("");
  }

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <form onSubmit={submitPin} className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="text-4xl">🍎</div>
          <h1 className="mt-3 text-2xl font-bold text-card-foreground">Teacher Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {store.teacherPin ? "Enter your teacher PIN." : "Create a teacher PIN (4–8 digits)."}
          </p>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => { setPin(e.target.value); setErr(""); }}
            className="mt-5 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg tracking-widest text-foreground"
            aria-label="Teacher PIN"
          />
          {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
          <button className="mt-4 w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">
            {store.teacherPin ? "Unlock" : "Set PIN"}
          </button>
          <p className="mt-4 text-xs text-muted-foreground">Work is kept for 7 days on this device.</p>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Teacher Dashboard</h1>
            <p className="text-muted-foreground">All students' questions and drawings from the last 7 days</p>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Home</Link>
        </div>
        <Button className="mt-6" onClick={() => { setStore(read()); setReport(true); }}>
          {report ? "Refresh progress report" : "Generate progress report"}
        </Button>
        {report && <>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold text-card-foreground">Students</h2>
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const n = name.trim().slice(0, 20);
              if (!n) return;
              update((d) => d.children.push({ id: crypto.randomUUID(), name: n, grade }));
              setName("");
            }}
          >
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Student name" className="min-w-40 flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground" />
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-foreground" aria-label="Grade">
              {GRADES.map((g) => <option key={g} value={g}>{gradeLabel(g)}</option>)}
            </select>
            <button className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">Add student</button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {store.children.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-foreground">
                {c.name}
                <select
                  value={c.grade || ""}
                  onChange={(e) => update((d) => { const x = d.children.find((k) => k.id === c.id); if (x) x.grade = e.target.value; })}
                  className="bg-transparent text-xs text-muted-foreground"
                  aria-label={`${c.name}'s grade`}
                >
                  <option value="">No grade</option>
                  {GRADES.map((g) => <option key={g} value={g}>{g === "K" ? "K" : `Gr ${g}`}</option>)}
                </select>
              </span>
            ))}
            {store.children.length === 0 && <p className="text-sm text-muted-foreground">No student profiles. Unassigned activity is grouped below.</p>}
          </div>
        </section>

        <div className="mt-6 flex gap-2">
          {([["all", "Everything"], ["questions", "🧠 Questions"], ["art", "🎨 Drawings"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-4 py-1.5 text-sm ${filter === k ? "bg-primary text-primary-foreground" : "border border-border text-foreground"}`}>{l}</button>
          ))}
        </div>

        {groups.length === 0 && <p className="mt-10 text-center text-muted-foreground">No work in the last 7 days yet.</p>}

        {groups.map(([g, subs]) => (
          <section key={g} className="mt-8">
            <h2 className="text-2xl font-bold text-foreground">{g}</h2>
            <div className="mt-3 space-y-3">
              {subs.map(([s, list]) => (
                <details key={s} open className="rounded-2xl border border-border bg-card p-4">
                  <summary className="cursor-pointer font-semibold text-card-foreground">{s} · {list.length}</summary>
                  {s.startsWith("Art") ? (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                      {list.map(({ child, e }, i) => (
                        <figure key={i} className="rounded-lg border border-border p-2">
                          {e.img && <img src={e.img} alt={`${child.name}'s ${e.text}`} className="aspect-square w-full rounded object-cover" />}
                          <figcaption className="mt-1 text-xs text-muted-foreground"><b className="text-foreground">{child.name}</b> · {e.text}<br />{when(e.t)}</figcaption>
                        </figure>
                      ))}
                    </div>
                  ) : (
                    <ul className="mt-3 divide-y divide-border">
                      {list.map(({ child, e }, i) => (
                        <li key={i} className="py-2 text-sm">
                          <span className="font-semibold text-foreground">{child.name}</span>
                          <span className="text-muted-foreground"> · {when(e.t)}</span>
                          <p className="whitespace-pre-wrap text-foreground">{e.text}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              ))}
            </div>
          </section>
        ))}
        </>}
      </div>
    </main>
  );
}
