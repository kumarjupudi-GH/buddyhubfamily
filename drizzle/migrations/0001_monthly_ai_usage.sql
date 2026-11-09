CREATE OR REPLACE FUNCTION public.bump_monthly_usage(_provider text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _start timestamptz := date_trunc('month', now()); _n integer;
BEGIN
  INSERT INTO public.ai_usage(bucket, count, window_start)
  VALUES ('month:' || _provider, 1, _start)
  ON CONFLICT (bucket, window_start) DO UPDATE SET count = public.ai_usage.count + 1
  RETURNING count INTO _n;
  RETURN _n;
END $$;
REVOKE ALL ON FUNCTION public.bump_monthly_usage(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_monthly_usage(text) TO service_role;