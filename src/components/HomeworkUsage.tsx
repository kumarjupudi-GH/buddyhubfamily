import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const LIMIT = 50;

export function HomeworkUsage() {
  const [usage, setUsage] = useState<{ q: number; usd: number } | null>(null);
  useEffect(() => {
    const load = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return setUsage(null);
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("homework_daily_usage")
        .select("questions, usd")
        .eq("user_id", u.user.id)
        .eq("day", today)
        .maybeSingle();
      setUsage({ q: data?.questions ?? 0, usd: Number(data?.usd ?? 0) });
    };
    load();
    const { data } = supabase.auth.onAuthStateChange(() => load());
    return () => data.subscription.unsubscribe();
  }, []);
  if (!usage) return null;
  const pct = Math.min(100, (usage.q / LIMIT) * 100);
  return (
    <div className="mr-3 w-56 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold">
      <div className="flex justify-between">
        <span>📚 Homework today: {usage.q}/{LIMIT}</span>
        <span className="text-muted-foreground">${usage.usd.toFixed(2)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
