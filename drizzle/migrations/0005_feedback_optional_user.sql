CREATE OR REPLACE FUNCTION public.save_feedback_request(_batch uuid, _user text, _name text, _email text, _response boolean, _entries jsonb, _visitor text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM public.save_feedback_batch(_batch,nullif(_user,'')::uuid,_name,_email,_response,_entries,_visitor);
END;
$$;
REVOKE ALL ON FUNCTION public.save_feedback_request(uuid,text,text,text,boolean,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_feedback_request(uuid,text,text,text,boolean,jsonb,text) TO service_role;