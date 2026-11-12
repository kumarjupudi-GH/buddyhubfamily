import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FEEDBACK_APPS } from "@/lib/feedback";
import { submitFeedback } from "@/lib/feedback-client";
export const Route = createFileRoute("/feedback-quick")({
  head: () => ({ meta: [{title:"Response feedback — Family BuddyApps"},{name:"description",content:"Rate the helpfulness of a BuddyApp response."},{property:"og:title",content:"Response feedback — Family BuddyApps"},{property:"og:description",content:"Share quick feedback about a BuddyApp answer."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}] }),
  component: QuickFeedback,
});
function QuickFeedback() {
  const [app,setApp]=useState("");const [helpful,setHelpful]=useState(false);const [reason,setReason]=useState("");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [done,setDone]=useState(false);const ids=useRef({batch:"",id:""});const locked=useRef(false);
  useEffect(()=>{const params=new URLSearchParams(window.location.search);const selected=params.get("app")||"";if(FEEDBACK_APPS.some(a=>a.slug===selected))setApp(selected);setHelpful(params.get("helpful")==="true");ids.current={batch:crypto.randomUUID(),id:crypto.randomUUID()};},[]);
  async function save() {if(locked.current||!app)return;locked.current=true;setBusy(true);setMessage("");try{await submitFeedback({batch:ids.current.batch,name:"",email:"",wants_response:false,entries:[{id:ids.current.id,app_id:app,category:"AI Response Quality",ratings:{},description:"",helpful,reason:reason||null,screenshot_path:null}]});setDone(true);}catch(e){setMessage(e instanceof Error?e.message:"Please try again");}finally{locked.current=false;setBusy(false);}}
  return <main className="bg-background text-foreground p-3 text-sm">{done?<p role="status">Thank you for your feedback!</p>:<><p className="mb-3 font-semibold">{helpful?"👍 Helpful":"👎 Not Helpful"}</p>{!helpful&&<select aria-label="Why was it not helpful?" value={reason} onChange={e=>setReason(e.target.value)} className="mb-3 h-9 w-full rounded-md border border-input bg-background"><option value="">Reason (optional)</option>{["Incorrect answer","Explanation unclear","Diagram not helpful","Response too slow","Other"].map(r=><option key={r}>{r}</option>)}</select>}<Button disabled={busy||!app} size="sm" onClick={save}>{busy?"Saving…":"Send feedback"}</Button>{message&&<p role="alert" className="mt-2 text-destructive">{message}</p>}</>}</main>;
}