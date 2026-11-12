CREATE TABLE public.feedback_submissions (
 id uuid PRIMARY KEY,
 user_id uuid,
 name text NOT NULL DEFAULT '',
 email text NOT NULL DEFAULT '',
 wants_response boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feedback_submissions TO authenticated;
GRANT ALL ON public.feedback_submissions TO service_role;
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY feedback_submission_admin_read ON public.feedback_submissions FOR SELECT TO authenticated USING (public.is_usage_admin());
CREATE TABLE public.app_feedback (
 id uuid PRIMARY KEY,
 submission_id uuid NOT NULL REFERENCES public.feedback_submissions(id),
 app_id text NOT NULL,
 category text NOT NULL,
 ratings jsonb NOT NULL DEFAULT '{}',
 description text NOT NULL DEFAULT '',
 helpful boolean,
 reason text,
 screenshot_path text,
 status text NOT NULL DEFAULT 'New' CHECK (status IN ('New','Under Review','In Progress','Resolved','Closed')),
 admin_notes text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_feedback TO authenticated;
GRANT UPDATE (status, admin_notes) ON public.app_feedback TO authenticated;
GRANT ALL ON public.app_feedback TO service_role;
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY feedback_admin_read ON public.app_feedback FOR SELECT TO authenticated USING (public.is_usage_admin());
CREATE POLICY feedback_admin_update ON public.app_feedback FOR UPDATE TO authenticated USING (public.is_usage_admin()) WITH CHECK (public.is_usage_admin());
CREATE INDEX feedback_created_idx ON public.app_feedback(created_at DESC);
CREATE INDEX feedback_app_idx ON public.app_feedback(app_id);
CREATE TABLE public.feedback_rate_limits (
 visitor text PRIMARY KEY,
 window_start timestamptz NOT NULL DEFAULT now(),
 count integer NOT NULL DEFAULT 0
);
GRANT ALL ON public.feedback_rate_limits TO service_role;
ALTER TABLE public.feedback_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.submit_app_feedback(_batch uuid, _name text, _email text, _response boolean, _entries jsonb, _visitor text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item jsonb; metric record; n integer;
BEGIN
 IF length(_name)>100 OR length(_email)>255 OR (_response AND _email='') OR jsonb_typeof(_entries)<>'array' OR jsonb_array_length(_entries) NOT BETWEEN 1 AND 10 OR length(_visitor)<>64 THEN RAISE EXCEPTION 'Invalid feedback'; END IF;
 IF EXISTS (SELECT 1 FROM public.feedback_submissions WHERE id=_batch) THEN RETURN; END IF;
 INSERT INTO public.feedback_rate_limits(visitor,count) VALUES(_visitor,1)
 ON CONFLICT(visitor) DO UPDATE SET count=CASE WHEN feedback_rate_limits.window_start<now()-interval '1 hour' THEN 1 ELSE feedback_rate_limits.count+1 END, window_start=CASE WHEN feedback_rate_limits.window_start<now()-interval '1 hour' THEN now() ELSE feedback_rate_limits.window_start END RETURNING count INTO n;
 IF n>20 THEN RAISE EXCEPTION 'Please try again later'; END IF;
 INSERT INTO public.feedback_submissions(id,user_id,name,email,wants_response) VALUES(_batch,auth.uid(),_name,_email,_response);
 FOR item IN SELECT value FROM jsonb_array_elements(_entries) LOOP
  IF length(item->>'app_id') NOT BETWEEN 1 AND 80 OR length(item->>'description')>3000 OR item->>'category' NOT IN ('General Feedback','Bug / Technical Issue','AI Response Quality','Incorrect or Confusing Explanation','Slow Response','Feature Suggestion','User Experience','Billing / Credits Issue','Appreciation') OR jsonb_typeof(item->'ratings')<>'object' THEN RAISE EXCEPTION 'Invalid feedback entry'; END IF;
  FOR metric IN SELECT * FROM jsonb_each(item->'ratings') LOOP
   IF metric.key NOT IN ('overall','ai_quality','accuracy','clarity','visuals','speed','ease','reliability','value') OR jsonb_typeof(metric.value)<>'number' OR metric.value::text NOT IN ('1','2','3','4','5') THEN RAISE EXCEPTION 'Invalid rating'; END IF;
  END LOOP;
  IF (item->>'helpful') IS NULL AND NOT (item->'ratings' ? 'overall') THEN RAISE EXCEPTION 'Overall rating required'; END IF;
  IF item->>'screenshot_path' IS NOT NULL AND item->>'screenshot_path'<>_batch::text||'/'||(item->>'id')||'.png' THEN RAISE EXCEPTION 'Invalid screenshot path'; END IF;
  INSERT INTO public.app_feedback(id,submission_id,app_id,category,ratings,description,helpful,reason,screenshot_path) VALUES((item->>'id')::uuid,_batch,item->>'app_id',item->>'category',item->'ratings',coalesce(item->>'description',''),(item->>'helpful')::boolean,item->>'reason',item->>'screenshot_path');
 END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_app_feedback(uuid,text,text,boolean,jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_app_feedback(uuid,text,text,boolean,jsonb,text) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.feedback_upload_allowed(_path text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.app_feedback WHERE screenshot_path=_path AND created_at>now()-interval '10 minutes'); $$;
REVOKE ALL ON FUNCTION public.feedback_upload_allowed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feedback_upload_allowed(text) TO anon,authenticated;
CREATE POLICY feedback_screenshot_insert ON storage.objects FOR INSERT TO anon,authenticated WITH CHECK(bucket_id='feedback-screenshots' AND public.feedback_upload_allowed(name) AND lower(storage.extension(name))='png');
CREATE POLICY feedback_screenshot_admin_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='feedback-screenshots' AND public.is_usage_admin());