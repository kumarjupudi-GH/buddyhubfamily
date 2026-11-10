import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Family BuddyApps" },
      { name: "description", content: "Sign in or create your Family BuddyApps account." },
      { property: "og:title", content: "Sign in — Family BuddyApps" },
      { property: "og:description", content: "Sign in or create your Family BuddyApps account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const G = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.080 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.570.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>`;

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && nav({ to: "/" }));
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) nav({ to: "/" });
    });
    return () => data.subscription.unsubscribe();
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password: pw })
        : mode === "up"
          ? await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin } })
          : await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (r.error) return setMsg(r.error.message);
    if (mode === "up") setMsg("Check your email to confirm your account.");
    if (mode === "forgot") setMsg("Check your email for a reset link.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setMsg(r.error.message ?? "Google sign-in failed.");
  }

  const input = "w-full rounded-lg border border-border bg-card px-3 py-2";
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 font-display text-foreground">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <a href="/" className="text-sm text-muted-foreground">← Home</a>
        <h1 className="mt-2 text-2xl font-bold">
          {mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Reset password"}
        </h1>
        {mode !== "forgot" && (
          <button
            type="button"
            onClick={google}
            style={{ background: "#FFFFFF", color: "#1F1F1F", border: "1px solid #747775", padding: "10px 12px", gap: 10 }}
            className="mt-4 flex w-full items-center justify-center rounded-lg text-sm font-medium"
          >
            <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: G }} />
            Continue with Google
          </button>
        )}
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {mode !== "forgot" && (
            <input className={input} type="password" required minLength={6} placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
          )}
          <button disabled={busy} className="w-full rounded-lg bg-primary px-3 py-2 font-semibold text-primary-foreground disabled:opacity-60">
            {mode === "in" ? "Sign in" : mode === "up" ? "Sign up" : "Send reset link"}
          </button>
        </form>
        {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
        <div className="mt-4 flex justify-between text-sm">
          <button onClick={() => setMode(mode === "up" ? "in" : "up")} className="text-primary">
            {mode === "up" ? "Have an account? Sign in" : "New here? Sign up"}
          </button>
          {mode === "in" && <button onClick={() => setMode("forgot")} className="text-muted-foreground">Forgot password?</button>}
        </div>
      </div>
    </main>
  );
}
