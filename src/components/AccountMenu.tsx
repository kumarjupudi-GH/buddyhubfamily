import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export function AccountMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const feedbackCount = useQuery({ queryKey: ["new-feedback-count", user?.id], enabled: admin, queryFn: async () => {
    const { count, error } = await supabase.from("app_feedback").select("id", { count: "exact", head: true }).eq("status", "New");
    if (error) throw error;
    return count || 0;
  } });
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!user) return setAdmin(false);
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setAdmin(!!data));
  }, [user]);

  if (!user)
    return (
      <a href="/auth" className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold hover:border-primary">
        Sign in
      </a>
    );
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold">
        👤 {user.email?.split("@")[0]}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-border bg-card p-3 text-left text-sm shadow-lg">
          <p className="truncate text-muted-foreground">{user.email}</p>
          <p className="mt-1 font-semibold">{admin ? "Proprietor" : "Registered user"}</p>
          {admin && <Button asChild variant="outline" className="mt-3 w-full"><a href="/feedback-management">Feedback {feedbackCount.data !== undefined ? `(${feedbackCount.data} new)` : ""}</a></Button>}
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.replace("/");
            }}
            className="mt-3 w-full rounded-lg border border-border px-3 py-1.5 font-semibold hover:border-primary"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
