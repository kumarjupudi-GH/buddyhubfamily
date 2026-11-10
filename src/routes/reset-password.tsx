import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Family BuddyApps" },
      { name: "description", content: "Choose a new password for your Family BuddyApps account." },
      { property: "og:title", content: "Set a new password — Family BuddyApps" },
      { property: "og:description", content: "Choose a new password for your Family BuddyApps account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setMsg(error.message);
    nav({ to: "/" });
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 font-display text-foreground">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <input className="w-full rounded-lg border border-border bg-card px-3 py-2" type="password" required minLength={6} placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="w-full rounded-lg bg-primary px-3 py-2 font-semibold text-primary-foreground">Save password</button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </form>
    </main>
  );
}
