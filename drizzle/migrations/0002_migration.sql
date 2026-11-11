CREATE TABLE public.homework_anon_usage (
  visitor text NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  questions integer NOT NULL DEFAULT 0,
  PRIMARY KEY (visitor, day)
);
GRANT ALL ON public.homework_anon_usage TO service_role;
ALTER TABLE public.homework_anon_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.take_anon_homework_question(_visitor text, _limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  INSERT INTO public.homework_anon_usage(visitor, day, questions)
  VALUES (_visitor, (now() AT TIME ZONE 'UTC')::date, 1)
  ON CONFLICT (visitor, day) DO UPDATE SET questions = homework_anon_usage.questions + 1
  WHERE homework_anon_usage.questions < _limit
  RETURNING questions INTO n;
  RETURN n IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.take_anon_homework_question(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.take_anon_homework_question(text, integer) TO service_role;