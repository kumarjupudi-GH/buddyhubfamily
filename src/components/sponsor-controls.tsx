import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getSponsorControls, saveSponsorControls } from "@/lib/sponsor.functions";
import { DEFAULT_SPONSOR_POLICY, type SponsorPolicy } from "@/lib/sponsor-policy";

export function SponsorControls() {
  const get = useServerFn(getSponsorControls), save = useServerFn(saveSponsorControls);
  const result = useQuery({ queryKey: ["sponsor-controls"], queryFn: () => get() });
  const [policy, setPolicy] = useState<SponsorPolicy>(DEFAULT_SPONSOR_POLICY), [note, setNote] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { if (result.data) setPolicy(result.data.policy); }, [result.data]);
  async function submit(value: SponsorPolicy) {
    setBusy(true); setNote("");
    try { await save({ data: value }); setPolicy(value); await result.refetch(); setNote("Funding controls saved."); }
    catch (e) { setNote(e instanceof Error ? e.message : "Could not save controls."); }
    finally { setBusy(false); }
  }
  if (result.isPending) return <p>Loading funding controls…</p>;
  if (result.error) return <p role="alert">{result.error.message}</p>;
  const numbers = [["intro_usd", "Introductory allowance per new adult (USD)"], ["daily_questions", "Daily sponsored questions (UTC)"], ["per_user_usd", "Maximum lifetime spend per user (USD)"], ["total_usd", "Total sponsored spending authorization (USD)"]] as const;
  const switches = [["enabled", "Enable introductory funding"], ["openai_enabled", "Enable OpenAI"], ["claude_enabled", "Enable Claude"], ["allow_fallback", "Allow one safe Claude fallback"]] as const;
  return <section className="my-8 border-y border-border py-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-semibold">Introductory AI funding</h2><Button variant="destructive" disabled={busy} onClick={() => submit({ ...policy, emergency_stop: true })}>Stop sponsored AI</Button></div>
    <p className="my-3">{policy.emergency_stop || !policy.enabled ? "Sponsored AI is off." : "Sponsored AI is enabled."} Remaining site budget: ${(result.data?.balance.siteRemaining ?? 0).toFixed(4)}</p>
    <p className="mb-4 text-sm text-muted-foreground">These allowances are paid by your connected provider accounts. No Lovable AI credits are used. Existing accounts do not receive introductory grants. Unknown request costs stay reserved.</p>
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); if (!policy.emergency_stop && policy.enabled && !window.confirm("Authorize paid requests against your connected provider accounts within these limits?")) return; submit(policy); }}>
      {numbers.map(([key, label]) => <label key={key}>{label}<input className="mt-1 w-full rounded-md border border-input bg-background p-2" type="number" min="0" max={key === "total_usd" ? 10000 : key === "daily_questions" ? 1000 : 100} step={key === "daily_questions" ? 1 : 0.01} value={policy[key]} onChange={e => setPolicy({ ...policy, [key]: Number(e.target.value) })} required /></label>)}
      {switches.map(([key, label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={policy[key]} onChange={e => setPolicy({ ...policy, [key]: e.target.checked })}/>{label}</label>)}
      <label className="flex items-center gap-2"><input type="checkbox" checked={policy.emergency_stop} onChange={e => setPolicy({ ...policy, emergency_stop: e.target.checked })}/>Emergency stop active</label>
      <fieldset className="space-y-2"><legend>Use Claude for</legend>{(["tutoring", "simple", "diagram", "art"] as const).map(task => <label key={task} className="flex items-center gap-2"><input type="checkbox" checked={policy.claude_tasks.includes(task)} onChange={e => setPolicy({ ...policy, claude_tasks: e.target.checked ? [...policy.claude_tasks, task] : policy.claude_tasks.filter(t => t !== task) })}/>{task}</label>)}</fieldset>
      <Button disabled={busy}>Save funding controls</Button>
    </form>{note && <p role="status" className="mt-4">{note}</p>}
    <h3 className="mt-6 font-semibold">One-time introductory grants</h3><p>{result.data?.wallets.length ?? 0} accounts granted · ${result.data?.wallets.reduce((sum, w) => sum + w.granted_usd, 0).toFixed(2)} allocated</p>
    {result.data?.partial && <p role="alert">Request accounting is a limited sample. Use the authoritative remaining site budget above.</p>}
    <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Account ID</th><th className="p-2">Granted USD</th><th className="p-2">Used / reserved USD</th><th className="p-2">Remaining USD</th></tr></thead><tbody>{result.data?.wallets.map(w => { const used = result.data.reservations.filter(r => r.user_id === w.user_id).reduce((sum, r) => sum + (r.settled_usd ?? r.reserved_usd), 0); return <tr key={w.user_id} className="border-b border-border"><td className="p-2">{w.user_id}</td><td className="p-2">{w.granted_usd.toFixed(4)}</td><td className="p-2">{used.toFixed(4)}</td><td className="p-2">{result.data.partial ? "Limited sample" : Math.max(0, Math.min(w.granted_usd, policy.per_user_usd) - used).toFixed(4)}</td></tr>; })}</tbody></table></div>
  </section>;
}