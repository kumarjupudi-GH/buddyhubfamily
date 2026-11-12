import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { FEEDBACK_APPS, CATEGORIES, STATUSES, METRICS, averageRating, csvCell } from "@/lib/feedback";

export const Route = createFileRoute("/feedback-management")({
  head: () => ({ meta: [ { title: "Feedback management — Family BuddyApps" }, { name: "description", content: "Private administrator feedback management for Family BuddyApps." }, { property: "og:title", content: "Feedback management — Family BuddyApps" }, { property: "og:description", content: "Private customer feedback reporting and review." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" } ] }),
  component: FeedbackManagement,
});
type Row = Tables<"app_feedback"> & { feedback_submissions: { name: string; email: string; wants_response: boolean } | null };
function FeedbackManagement() {
  const [identity, setIdentity] = useState<string | null | undefined>(undefined);
  const [app, setApp] = useState(""); const [category, setCategory] = useState(""); const [status, setStatus] = useState("");
  const [rating, setRating] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  useEffect(() => {
    supabase.auth.getUser().then(({data})=>setIdentity(data.user?.id || null));
    const { data } = supabase.auth.onAuthStateChange((event, session)=> { if (["SIGNED_IN","SIGNED_OUT","USER_UPDATED"].includes(event)) setIdentity(session?.user.id || null); });
    return ()=>data.subscription.unsubscribe();
  }, []);
  const access = useQuery({ queryKey: ["feedback-admin",identity], enabled: !!identity, queryFn: async () => {
    const { data, error } = await supabase.rpc("is_usage_admin"); if(error) throw error; return data;
  } });
  const query = useQuery({ queryKey: ["admin-feedback",identity], enabled: access.data === true, queryFn: async () => {
    const all: Row[] = [];
    for(let start=0;;start+=1000) {
      const { data,error } = await supabase.from("app_feedback").select("*, feedback_submissions(name,email,wants_response)").order("created_at",{ascending:false}).order("id").range(start,start+999);
      if(error) throw error;
      all.push(...data);
      if(data.length<1000) break;
    }
    return all;
  } });
  const all = query.data || [];
  const rows = all.filter(row=> (!app || row.app_id===app) && (!category || row.category===category) && (!status || row.status===status) && (!rating || (row.ratings as Record<string,unknown>)["overall"]===Number(rating)) && (!from || row.created_at.slice(0,10)>=from) && (!to || row.created_at.slice(0,10)<=to));
  const group = (key: "app_id"|"category"|"created_at") => Object.entries(rows.reduce<Record<string,number>>((counts,row)=>{ const value=key==="created_at"?row.created_at.slice(0,10):row[key];counts[value]=(counts[value]||0)+1;return counts;},{})).sort((a,b)=>key==="created_at"?a[0].localeCompare(b[0]):b[1]-a[1]);
  function exportCsv() {
    const headings=["Date (UTC)","BuddyApp","Category","Status","Name","Email","Response requested","Description","Helpful","Reason",...METRICS.map(([,label])=>label),"Internal notes"];
    const csv=[headings,...rows.map(row=>[row.created_at,row.app_id,row.category,row.status,row.feedback_submissions?.name,row.feedback_submissions?.email,row.feedback_submissions?.wants_response,row.description,row.helpful,row.reason,...METRICS.map(([key])=>(row.ratings as Record<string,unknown>)[key]),row.admin_notes])].map(line=>line.map(csvCell).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="family-feedback.csv";a.click();URL.revokeObjectURL(url);
  }
  return <main className="min-h-screen bg-background text-foreground px-4 py-8"><div className="mx-auto max-w-6xl">
    <Button variant="ghost" asChild><a href="/"><ArrowLeft />Family BuddyApps</a></Button>
    <header className="my-6 flex flex-wrap items-center justify-between gap-4"><h1 className="font-display text-3xl font-bold">Feedback management</h1>{access.data && <div className="flex gap-2"><Button variant="outline" aria-label="Refresh feedback" disabled={query.isFetching} onClick={()=>query.refetch()}><RefreshCw /></Button><Button variant="outline" onClick={exportCsv}><Download />CSV</Button></div>}</header>
    {identity===undefined || (identity && access.isPending) ? <p>Loading…</p> : !identity ? <Button asChild><a href="/auth">Sign in to manage feedback</a></Button> : access.error ? <p role="alert">Could not verify administrator access.</p> : !access.data ? <p>Feedback management is available only to authorized administrators.</p> : <>
      <p className="mb-4 text-sm text-muted-foreground">{all.filter(r=>r.status==="New").length} new · {new Set(all.map(r=>r.submission_id)).size} submissions · {all.length} feedback entries</p>
      <section className="grid gap-3 border-y border-border py-4 sm:grid-cols-3 lg:grid-cols-6">
        <label className="text-sm">Application<select className="mt-1 h-10 w-full rounded-md border border-input bg-background" value={app} onChange={e=>setApp(e.target.value)}><option value="">All apps</option>{FEEDBACK_APPS.map(a=><option key={a.slug} value={a.slug}>{a.name}</option>)}</select></label>
        <label className="text-sm">Category<select className="mt-1 h-10 w-full rounded-md border border-input bg-background" value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label>
        <label className="text-sm">Status<select className="mt-1 h-10 w-full rounded-md border border-input bg-background" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
        <label className="text-sm">Overall rating<select className="mt-1 h-10 w-full rounded-md border border-input bg-background" value={rating} onChange={e=>setRating(e.target.value)}><option value="">All ratings</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} stars</option>)}</select></label>
        <label className="text-sm">From (UTC)<Input className="mt-1" type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label><label className="text-sm">To (UTC)<Input className="mt-1" type="date" value={to} onChange={e=>setTo(e.target.value)} /></label>
      </section>
      {query.error && <p role="alert" className="mt-4 text-destructive">Could not load feedback. Please refresh.</p>}
      {query.isPending ? <p className="py-8">Loading feedback…</p> : <>
        <section className="grid grid-cols-2 gap-x-6 gap-y-4 py-6 sm:grid-cols-5">{[["Feedback",rows.length],["Average rating",averageRating(rows,"overall")?.toFixed(2)||"—"],["Positive",rows.filter(r=>r.helpful===true || (r.helpful===null && Number((r.ratings as Record<string,unknown>)["overall"])>=4)).length],["Negative",rows.filter(r=>r.helpful===false || (r.helpful===null && Number((r.ratings as Record<string,unknown>)["overall"])<=2)).length],["New",rows.filter(r=>r.status==="New").length]].map(([label,value])=><div key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}</section>
        <section className="border-t border-border py-6"><h2 className="font-display text-xl">Experience KPIs</h2><dl className="mt-4 grid gap-4 sm:grid-cols-3">{METRICS.map(([key,label])=><div key={key} className="flex justify-between gap-3"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-semibold">{averageRating(rows,key)?.toFixed(2)||"—"}</dd></div>)}</dl></section>
        <section className="grid gap-6 border-y border-border py-6 md:grid-cols-3">{([ ["By BuddyApp",group("app_id")], ["By category",group("category")], ["Daily trend (UTC)",group("created_at")] ] as [string,[string,number][]][]).map(([title,items])=><div key={title}><h2 className="font-display text-lg">{title}</h2>{items.length? <ul className="mt-3 space-y-2">{items.map(([label,count])=><li key={label} className="flex justify-between gap-4 text-sm"><span>{FEEDBACK_APPS.find(a=>a.slug===label)?.name||label}</span><strong>{count}</strong></li>)}</ul>:<p className="mt-3 text-sm text-muted-foreground">No feedback yet</p>}</div>)}</section>
        <section className="grid gap-6 border-b border-border py-6 md:grid-cols-2"><div><h2 className="font-display text-lg">Recent complaints</h2>{rows.filter(r=>["Bug / Technical Issue","Billing / Credits Issue","Incorrect or Confusing Explanation","Slow Response"].includes(r.category)||r.helpful===false).slice(0,5).map(r=><p key={r.id} className="mt-3 text-sm"><strong>{r.category}</strong> — {r.description||r.reason||"Not helpful"}</p>)}</div><div><h2 className="font-display text-lg">Requested features ({rows.filter(r=>r.category==="Feature Suggestion").length})</h2>{Object.entries(rows.filter(r=>r.category==="Feature Suggestion"&&r.description).reduce<Record<string,number>>((counts,r)=>{const text=r.description.trim();counts[text]=(counts[text]||0)+1;return counts;},{})).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([text,count])=><p key={text} className="mt-3 text-sm break-words">{text} <strong>({count})</strong></p>)}</div></section>
        <h2 className="my-6 font-display text-xl">Feedback ({rows.length})</h2>{!rows.length && <p className="py-8 text-muted-foreground">No feedback matches these filters.</p>}<div className="space-y-4">{rows.map(row=><FeedbackRecord key={row.id} row={row} />)}</div>
      </>}
    </>}
  </div></main>;
}
function FeedbackRecord({row}:{row:Row}) {
  const [status,setStatus]=useState(row.status);const [notes,setNotes]=useState(row.admin_notes);const [busy,setBusy]=useState(false);const [message,setMessage]=useState(""); const client=useQueryClient();
  useEffect(()=>{setStatus(row.status);setNotes(row.admin_notes);},[row.status,row.admin_notes]);
  async function save() {if(busy || !STATUSES.includes(status as typeof STATUSES[number]) || notes.length>5000)return;setBusy(true);setMessage("");const {error}=await supabase.from("app_feedback").update({status,admin_notes:notes}).eq("id",row.id);setBusy(false);setMessage(error?"Could not save":"Saved");if(!error)client.invalidateQueries({queryKey:["admin-feedback"]});}
  async function screenshot() {if(!row.screenshot_path)return;const {data,error}=await supabase.storage.from("feedback-screenshots").createSignedUrl(row.screenshot_path,60);if(error){setMessage("Screenshot unavailable");return;}window.open(data.signedUrl,"_blank","noopener,noreferrer");}
  return <article className="rounded-lg border border-border bg-card p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{FEEDBACK_APPS.find(a=>a.slug===row.app_id)?.name||row.app_id} · {row.category}</h3><time className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()} (local)</time></div>
    <p className="mt-2 text-sm text-muted-foreground">{row.feedback_submissions?.name||"Anonymous"}{row.feedback_submissions?.email?` · ${row.feedback_submissions.email}`:""}{row.feedback_submissions?.wants_response?" · Response requested":""}</p>
    <p className="mt-3 whitespace-pre-wrap break-words text-sm">{row.description||row.reason||(row.helpful===true?"Helpful":row.helpful===false?"Not helpful":"No comment")}</p>
    <p className="mt-2 text-sm">{METRICS.flatMap(([key,label])=>{const value=(row.ratings as Record<string,unknown>)[key];return typeof value==="number"?[`${label}: ${value}/5`]:[];}).join(" · ")}</p>
    {row.screenshot_path && <Button variant="link" onClick={screenshot}>View screenshot</Button>}
    <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto]"><label className="text-sm">Status<select className="mt-1 h-10 w-full rounded-md border border-input bg-background" value={status} onChange={e=>setStatus(e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></label><label className="text-sm">Internal notes<Textarea className="mt-1" value={notes} onChange={e=>setNotes(e.target.value)} maxLength={5000} /></label><Button className="self-end" disabled={busy} onClick={save}><Save />{busy?"Saving…":"Save"}</Button></div>{message && <p role="status" className="mt-2 text-sm">{message}</p>}
  </article>;
}