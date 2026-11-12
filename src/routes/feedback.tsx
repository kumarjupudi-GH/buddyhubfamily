import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, Plus, Send, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FEEDBACK_APPS, CATEGORIES, METRICS, type FeedbackEntry } from "@/lib/feedback";
import { submitFeedback, screenshotPng } from "@/lib/feedback-client";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/feedback")({
  head: () => ({ meta: [ { title: "Share feedback — Family BuddyApps" }, { name: "description", content: "Share ratings, suggestions and experiences across Family BuddyApps." }, { property: "og:title", content: "Share feedback — Family BuddyApps" }, { property: "og:description", content: "Your experiences help improve every Family BuddyApp." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" } ] }),
  component: FeedbackPage,
});
function fresh(app = "family"): FeedbackEntry {
  return { id: crypto.randomUUID(), app_id: app, category: "General Feedback", ratings: {}, description: "", helpful: null, reason: null, screenshot_path: null };
}
export function Stars({ label, value, onChange }: { label: string; value: number | undefined; onChange: (n: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 py-2"><span className="text-sm">{label}</span><div role="group" aria-label={label} className="flex shrink-0">{[1,2,3,4,5].map(n => <Button key={n} type="button" variant="ghost" size="icon" aria-label={`${label}: ${n} star${n>1?"s":""}`} aria-pressed={value === n} onClick={() => onChange(n)} className={value && n <= value ? "text-primary" : "text-muted-foreground"}><Star className={value && n <= value ? "fill-current" : ""} /></Button>)}</div></div>;
}
function FeedbackPage() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [reply, setReply] = useState(false);
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState("");
  const [files, setFiles] = useState<Record<string, Blob>>({});
  const batch = useRef(""); const locked = useRef(false); const saved = useRef(false);
  useEffect(() => {
    batch.current = crypto.randomUUID();
    const app = new URLSearchParams(window.location.search).get("app");
    setEntries([fresh(FEEDBACK_APPS.some(a => a.slug === app) ? app || "family" : "family")]);
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email || "");
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", data.user.id).maybeSingle();
      setName(profile?.display_name || "");
    });
  }, []);
  const update = (id: string, patch: Partial<FeedbackEntry>) => setEntries(all => all.map(e => e.id === id ? { ...e, ...patch } : e));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (locked.current) return; locked.current = true; setBusy(true); setError("");
    try {
      const payload = entries.map(e => ({ ...e, screenshot_path: files[e.id] ? `${batch.current}/${e.id}.png` : null }));
      if (!saved.current) { await submitFeedback({ batch: batch.current, name, email, wants_response: reply, entries: payload }); saved.current = true; }
      for (const entry of payload) {
        const file = files[entry.id];
        if (file && entry.screenshot_path) {
          const { error: uploadError } = await supabase.storage.from("feedback-screenshots").upload(entry.screenshot_path, file, { contentType: "image/png" });
          if (uploadError && !/already exists|duplicate/i.test(uploadError.message)) throw new Error("Feedback saved, but a screenshot failed. Retry within ten minutes, or remove the screenshot.");
        }
      }
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again"); }
    finally { locked.current = false; setBusy(false); }
  }
  return <main className="min-h-screen bg-background text-foreground px-4 py-8 font-display"><div className="mx-auto max-w-3xl">
    <Button asChild variant="ghost"><a href="/"><ArrowLeft /> Family BuddyApps</a></Button>
    <header className="my-6"><h1 className="text-3xl font-bold">Your voice, better buddies</h1><p className="mt-2 text-muted-foreground">Feedback for Family BuddyApps</p></header>
    {done ? <section className="py-12 text-center" role="status"><CheckCircle className="mx-auto size-12 text-primary" /><h2 className="mt-4 text-2xl">Thank you! Your feedback helps us make FamilyBuddy better.</h2><Button asChild className="mt-6"><a href="/">Back to buddies</a></Button></section> : <form onSubmit={submit} className="space-y-6">
      <fieldset disabled={busy || saved.current} className="grid gap-4 border-b border-border pb-6 sm:grid-cols-2"><label className="space-y-2 text-sm">Name (optional)<Input value={name} onChange={e=>setName(e.target.value)} maxLength={100} autoComplete="name" /></label><label className="space-y-2 text-sm">Email {reply ? "" : "(optional)"}<Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required={reply} maxLength={255} autoComplete="email" /></label></fieldset>
      {entries.map((entry, index) => <fieldset key={entry.id} disabled={busy || saved.current} className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Feedback {index+1}</h2>{entries.length>1 && <Button type="button" variant="ghost" size="icon" aria-label={`Remove feedback ${index+1}`} onClick={()=>setEntries(all=>all.filter(e=>e.id!==entry.id))}><Trash2 /></Button>}</div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">BuddyApp<select aria-label={`BuddyApp ${index+1}`} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-2" value={entry.app_id} onChange={e=>update(entry.id,{app_id:e.target.value})}>{FEEDBACK_APPS.map(a=><option key={a.slug} value={a.slug}>{a.emoji} {a.name}</option>)}</select></label><label className="text-sm">Category<select aria-label={`Category ${index+1}`} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-2" value={entry.category} onChange={e=>update(entry.id,{category:e.target.value as FeedbackEntry["category"]})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label></div>
        <div className="my-4 divide-y divide-border">{METRICS.filter(([key]) => entry.app_id !== "family" || !["ai_quality","accuracy","clarity","visuals"].includes(key)).map(([key,label])=><Stars key={key} label={label+(key==="overall"?" *":"")} value={entry.ratings[key]} onChange={n=>update(entry.id,{ratings:{...entry.ratings,[key]:n}})} />)}</div>
        <label className="text-sm">Tell us about your experience or suggestion.<Textarea aria-label={`Feedback description ${index+1}`} className="mt-2 min-h-28" value={entry.description} onChange={e=>update(entry.id,{description:e.target.value})} maxLength={3000} /></label>
        <p className="mt-2 text-xs text-muted-foreground">Do not include passwords, API keys or private conversations.</p>
        <label className="mt-4 block text-sm">Screenshot (optional, PNG / JPEG / WebP, up to 2 MB)<Input className="mt-2" type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files?.[0]; if(!file){setFiles(all=>{const next={...all};delete next[entry.id];return next;});return;} try {const blob=await screenshotPng(file);setFiles(all=>({...all,[entry.id]:blob}));setError("");}catch(err){e.target.value="";setError(err instanceof Error?err.message:"Invalid image");}}} /></label>
      </fieldset>)}
      <div className="flex flex-wrap items-center justify-between gap-4"><Button type="button" variant="outline" disabled={busy || saved.current || entries.length>=10} onClick={()=>setEntries(all=>[...all,fresh()])}><Plus /> Add another feedback</Button><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reply} disabled={busy || saved.current} onChange={e=>setReply(e.target.checked)} />I would like a response from the support team.</label></div>
      {error && <p role="alert" className="text-destructive text-sm break-words">{error}</p>}
      <Button type="submit" size="lg" disabled={busy || !entries.length} className="w-full sm:w-auto"><Send />{busy?"Saving…":saved.current?"Retry screenshots":"Submit all feedback"}</Button>
    </form>}
  </div></main>;
}