import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PROVIDERS, type Provider } from "@/lib/visitor-ai-policy";

export const Route = createFileRoute("/my-ai")({ head: () => ({ meta: [
  { title: "My AI accounts — Family BuddyApps" }, { name: "description", content: "Connect your own AI account and choose the models available to your family." }, { property: "og:title", content: "My AI accounts — Family BuddyApps" }, { property: "og:description", content: "Private, visitor-funded AI connections for your family." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }
] }), component: MyAI });
const labels = { chatgpt: "OpenAI", claude: "Claude", gemini: "Gemini" };
const links = { chatgpt: "https://platform.openai.com/api-keys", claude: "https://console.anthropic.com/settings/keys", gemini: "https://aistudio.google.com/apikey" };
type Connection = { provider: Provider; connected: boolean; models: string[]; error?: string };
function MyAI() {
  const [signedIn, setSignedIn] = useState(false), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]), [provider, setProvider] = useState<Provider>("claude"), [key, setKey] = useState(""), [adult, setAdult] = useState(false), [message, setMessage] = useState("");
  async function request(body: object) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Please sign in first.");
    const response = await fetch("/api/public/ai-account", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "Could not update AI account.");
    setConnections(result.connections);
  }
  useEffect(() => { supabase.auth.getSession().then(async ({ data }) => { setSignedIn(!!data.session); if (data.session) try { await request({ action: "status" }); } catch(e) { setMessage(e instanceof Error ? e.message : "Could not load accounts."); } setLoading(false); }); }, []);
  async function update(action: "save" | "remove", selected = provider) {
    setBusy(true); setMessage("");
    try { await request({ action, provider: selected, ...(action === "save" ? { key: key.trim(), adult } : {}) }); setKey(""); setMessage(action === "save" ? `${labels[selected]} connected. Return to a buddy to choose your model.` : `${labels[selected]} disconnected.`); }
    catch(e) { setMessage(e instanceof Error ? e.message : "Connection failed."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-background px-4 py-10 font-display text-foreground"><div className="mx-auto max-w-2xl">
    <Button asChild variant="ghost"><a href="/">← Home</a></Button>
    <h1 className="mt-6 text-3xl font-bold">My AI accounts</h1>
    <p className="mt-3 text-muted-foreground">Your provider bills your AI usage. ChatGPT or Claude subscriptions do not include API credits. Your questions never fall back to the site’s AI credits.</p>
    {loading ? <p className="mt-6" role="status">Loading accounts…</p> : !signedIn ? <Button asChild className="mt-6"><a href="/auth">Sign in</a></Button> : <>
      <section className="mt-8 divide-y divide-border">{PROVIDERS.map(p => { const c = connections.find(c => c.provider === p); return <div key={p} className="flex items-center justify-between gap-4 py-4"><div><h2 className="text-lg font-semibold">{labels[p]}</h2><p className="text-sm text-muted-foreground">{c?.connected ? c.error || `${c.models.length} available text models` : "Not connected"}</p></div>{c?.connected && <Button variant="outline" disabled={busy} onClick={() => update("remove", p)}>Disconnect</Button>}</div>; })}</section>
      <form className="mt-8 space-y-4" onSubmit={e => { e.preventDefault(); update("save"); }}>
        <h2 className="text-xl font-semibold">Connect or replace an account</h2>
        <label className="block">Provider<select className="mt-2 block w-full rounded-md border border-input bg-background p-3" value={provider} onChange={e => { const p = PROVIDERS.find(p => p === e.target.value); if(p) setProvider(p); setKey(""); }} >{PROVIDERS.map(p => <option key={p} value={p}>{labels[p]}</option>)}</select></label>
        <p className="text-sm text-muted-foreground">Create a key in your <a href={links[provider]} target="_blank" rel="noreferrer" className="text-primary underline">{labels[provider]} account</a>, set its spending limit there, then paste it below. Keys are stored encrypted and never displayed.</p>
        <label className="block">Provider API key<input type="password" autoComplete="off" required value={key} onChange={e => setKey(e.target.value)} className="mt-2 block w-full rounded-md border border-input bg-background p-3" /></label>
        <label className="flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" required checked={adult} onChange={e => setAdult(e.target.checked)} />I am an adult managing this family’s AI account and accept my provider’s usage charges and privacy terms.</label>
        <Button type="submit" disabled={busy}>{busy ? "Checking account…" : "Connect account"}</Button>
      </form>
    </>}
    {message && <p className="mt-5 text-sm" role="status">{message}</p>}
  </div></main>;
}