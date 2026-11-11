CREATE TABLE public.homework_daily_usage (
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  questions integer NOT NULL DEFAULT 0,
  usd numeric NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
GRANT SELECT ON public.homework_daily_usage TO authenticated;
GRANT ALL ON public.homework_daily_usage TO service_role;
ALTER TABLE public.homework_daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_hw_usage_read ON public.homework_daily_usage FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.homework_used_today(_user uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT questions FROM public.homework_daily_usage WHERE user_id=_user AND day=(now() AT TIME ZONE 'UTC')::date),0);
$$;
CREATE OR REPLACE FUNCTION public.record_homework_question(_user uuid, _usd numeric)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.homework_daily_usage(user_id, day, questions, usd)
  VALUES (_user, (now() AT TIME ZONE 'UTC')::date, 1, _usd)
  ON CONFLICT (user_id, day) DO UPDATE SET questions = homework_daily_usage.questions + 1, usd = homework_daily_usage.usd + EXCLUDED.usd;
$$;
REVOKE ALL ON FUNCTION public.homework_used_today(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_homework_question(uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.homework_used_today(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_homework_question(uuid, numeric) TO service_role;