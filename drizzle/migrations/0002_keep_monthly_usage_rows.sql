CREATE OR REPLACE FUNCTION public.consume_ai_quota(_scope text, _visitor text, _per_hour integer, _per_day integer)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  h timestamptz := date_trunc('hour', now());
  d timestamptz := date_trunc('day', now());
  site_key text := 'site:' || _scope;
  vis_key text := 'v:' || _scope || ':' || _visitor;
  dc integer; vc integer;
BEGIN
  SELECT count INTO dc FROM ai_usage WHERE bucket = site_key AND window_start = d;
  IF coalesce(dc, 0) >= _per_day THEN RETURN 'site'; END IF;
  SELECT count INTO vc FROM ai_usage WHERE bucket = vis_key AND window_start = h;
  IF coalesce(vc, 0) >= _per_hour THEN RETURN 'visitor'; END IF;
  INSERT INTO ai_usage (bucket, window_start, count) VALUES (site_key, d, 1)
    ON CONFLICT (bucket, window_start) DO UPDATE SET count = ai_usage.count + 1;
  INSERT INTO ai_usage (bucket, window_start, count) VALUES (vis_key, h, 1)
    ON CONFLICT (bucket, window_start) DO UPDATE SET count = ai_usage.count + 1;
  IF random() < 0.05 THEN
    DELETE FROM ai_usage WHERE window_start < now() - interval '2 days' AND bucket NOT LIKE 'month:%';
  END IF;
  RETURN 'ok';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consume_ai_quota(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(text, text, integer, integer) TO service_role;
CREATE OR REPLACE FUNCTION public.monthly_ai_usage()
RETURNS TABLE(provider text, total integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT substr(bucket, 7), count FROM ai_usage WHERE bucket LIKE 'month:%' AND window_start = date_trunc('month', now())
$$;
REVOKE ALL ON FUNCTION public.monthly_ai_usage() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monthly_ai_usage() TO service_role;