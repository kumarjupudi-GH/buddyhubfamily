import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ai-bridge")({
  head: () => ({ meta: [{ title: "Private AI connection — Family BuddyApps" }, { name: "description", content: "Private connection for your Family BuddyApps AI account." }, { property: "og:title", content: "Private AI connection — Family BuddyApps" }, { property: "og:description", content: "Private connection for your Family BuddyApps AI account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Bridge,
});
function Bridge() {
  useEffect(() => {
    const pending = new Map<string, AbortController>();
    const allowed = ["/api/public/ai-account", "/api/public/buddy-chat", "/api/public/chat", "/api/public/teach"];
    async function handle(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== window.parent || typeof event.data?.id !== "string") return;
      const { id, path, body, type } = event.data;
      if (type === "buddy-ai-cancel") { pending.get(id)?.abort(); return; }
      if (type !== "buddy-ai-request" || !allowed.includes(path)) return;
      const controller = new AbortController(); pending.set(id, controller);
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) { window.parent.postMessage({ type: "buddy-ai-result", id, status: 401, body: { error: { message: "Sign in and connect your own AI account in My AI." } } }, window.location.origin); return; }
        const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify(body), signal: controller.signal });
        const result = await response.json();
        window.parent.postMessage({ type: "buddy-ai-result", id, status: response.status, body: result }, window.location.origin);
      } catch { window.parent.postMessage({ type: "buddy-ai-result", id, status: 502, body: { error: { message: "The AI connection was interrupted. No other provider was used." } } }, window.location.origin); }
      finally { pending.delete(id); }
    }
    window.addEventListener("message", handle);
    window.parent.postMessage({ type: "buddy-ai-ready" }, window.location.origin);
    return () => { window.removeEventListener("message", handle); pending.forEach(c => c.abort()); };
  }, []);
  return null;
}