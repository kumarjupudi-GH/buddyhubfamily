REVOKE EXECUTE ON FUNCTION public.submit_app_feedback(uuid,text,text,boolean,jsonb,text) FROM anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_app_feedback(uuid,text,text,boolean,jsonb,text) TO service_role;
CREATE OR REPLACE FUNCTION public.save_feedback_batch(_batch uuid, _user uuid, _name text, _email text, _response boolean, _entries jsonb, _visitor text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM public.submit_app_feedback(_batch,_name,_email,_response,_entries,_visitor);
 UPDATE public.feedback_submissions SET user_id=_user WHERE id=_batch AND user_id IS NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.save_feedback_batch(uuid,uuid,text,text,boolean,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_feedback_batch(uuid,uuid,text,text,boolean,jsonb,text) TO service_role;
ALTER TABLE public.app_feedback ADD CONSTRAINT feedback_note_length CHECK(length(admin_notes)<=5000);
ALTER TABLE public.feedback_submissions ADD CONSTRAINT feedback_contact_lengths CHECK(length(name)<=100 AND length(email)<=255);