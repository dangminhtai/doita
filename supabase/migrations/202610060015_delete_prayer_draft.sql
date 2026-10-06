begin;
-- A stale draft list must never delete a wish that has since been released.
create function public.delete_prayer_draft(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'unauthorized';end if;
 perform 1 from public.prayers where id=p_id and status='draft'
 and author_id=auth.uid() and couple_id=private.my_couple() for update;
 if not found then raise exception 'not_found';end if;
 perform public.prayer_action(p_id,'delete');
end$$;
revoke all on function public.delete_prayer_draft(uuid) from public,anon;
grant execute on function public.delete_prayer_draft(uuid) to authenticated,service_role;
do $$declare definition text;begin
 select pg_get_functiondef('public.perform_authorized_action(text,jsonb,uuid)'::regprocedure) into definition;
 definition:=replace(definition,'''prayer_action''','''prayer_action'',''delete_prayer_draft''');
 execute definition;
end$$;
notify pgrst,'reload schema';
commit;
