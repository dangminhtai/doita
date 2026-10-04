begin;
create table private.action_receipts(
 user_id uuid not null references auth.users on delete cascade,
 request_id uuid not null, action text not null, args jsonb not null, couple_id uuid,
 result jsonb, created_at timestamptz not null default now(), primary key(user_id,request_id)
);
revoke all on private.action_receipts from public,anon,authenticated;

create function public.perform_authorized_action(p_action text,p_args jsonb,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare receipt private.action_receipts;f record;parts text[]:='{}';i integer;result jsonb;
begin
 if auth.uid() is null then raise exception 'session_expired';end if;
 if p_request_id is null or p_args is null or jsonb_typeof(p_args)<>'object' or p_action not in
 ('save_note','save_prayer','save_memory','save_special_date','log_activity','daily_reply','set_mood','answer_daily','toggle_note_item','note_action','prayer_action','delete_memory','delete_special_date','pair_couple','rotate_invite','repair_streak','leave_couple','update_settings') then raise exception 'invalid';end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||p_request_id::text));
 select * into receipt from private.action_receipts where user_id=auth.uid() and request_id=p_request_id;
 if found then
  if receipt.action<>p_action or receipt.args<>p_args then raise exception 'invalid';end if;
  if p_action not in ('pair_couple','leave_couple') and receipt.couple_id is distinct from private.my_couple() then raise exception 'forbidden';end if;
  return receipt.result;
 end if;
 select p.* into f from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=p_action;
 if not found then raise exception 'invalid';end if;
 if exists(select 1 from jsonb_object_keys(p_args) k where not k=any(coalesce(f.proargnames,'{}'))) then raise exception 'invalid';end if;
 if f.pronargs>0 then
  for i in 1..f.pronargs loop
   if p_args ? f.proargnames[i] then
    parts:=array_append(parts,format('%I => ($1->>%L)::%s',f.proargnames[i],f.proargnames[i],format_type(f.proargtypes[i-1],null)));
   end if;
  end loop;
 end if;
 execute format('select to_jsonb(public.%I(%s))',p_action,array_to_string(parts,',')) into result using p_args;
 insert into private.action_receipts(user_id,request_id,action,args,result,couple_id) values(auth.uid(),p_request_id,p_action,p_args,result,private.my_couple());
 return result;
end$$;
revoke all on function public.perform_authorized_action(text,jsonb,uuid) from public,anon;
grant execute on function public.perform_authorized_action(text,jsonb,uuid) to authenticated,service_role;

create or replace function public.prayer_action(p_id uuid,p_action text) returns void
language plpgsql security definer set search_path='' as $$begin
 if not exists(select 1 from public.prayers where id=p_id and author_id=auth.uid() and couple_id=private.my_couple()) then raise exception 'forbidden';end if;
 if p_action='archive' then update public.prayers set status='archived',resurface_at=null where id=p_id and status='released';
 elsif p_action='restore' then update public.prayers set status='released' where id=p_id and status='archived';
 elsif p_action='delete' then delete from public.memories where type='prayer' and source_id=p_id;delete from public.prayers where id=p_id;
 else raise exception 'invalid';end if;
end$$;

-- Store content-specific destinations while preserving generic notification text.
create or replace function private.record_notification() returns trigger
language plpgsql security definer set search_path='' as $$
declare target text:=new.url;source text:=split_part(new.dedupe,':',2);
begin
 if new.kind in ('daily','reaction','reply','prayer','note','activity','activity_like','activity_dislike','resurface','special','care') then
  if source ~ '^[0-9a-f-]{36}$' then
   if new.kind in ('reaction','reply') then source:=coalesce((select session_id::text from public.daily_feedback where id=source::uuid),source);end if;
   if new.kind in ('activity','activity_like','activity_dislike') then source:=coalesce((select activity_id from public.activity_sessions where id=source::uuid),source);end if;
   if source is not null then target:=new.url||'?item='||source;end if;
  end if;
 end if;
 insert into public.notifications(id,user_id,couple_id,actor_id,kind,url,created_at)
 select new.id,new.user_id,m.couple_id,new.actor_id,new.kind,target,new.created_at from public.couple_members m where m.user_id=new.user_id;
 update public.notification_outbox set url=target where id=new.id and url<>target;
 return null;
end$$;
do $$declare r record;source text;target text;begin
 for r in select n.id,n.kind,n.url,o.dedupe from public.notifications n join public.notification_outbox o on o.id=n.id
 where n.kind in ('daily','reaction','reply','prayer','note','activity','activity_like','activity_dislike','resurface','special','care') and n.url not like '%?item=%' loop
  source:=split_part(r.dedupe,':',2);
  if source ~ '^[0-9a-f-]{36}$' then
   if r.kind in ('reaction','reply') then source:=coalesce((select session_id::text from public.daily_feedback where id=source::uuid),source);end if;
   if r.kind in ('activity','activity_like','activity_dislike') then source:=coalesce((select activity_id from public.activity_sessions where id=source::uuid),source);end if;
   target:=r.url||'?item='||source;
   update public.notifications set url=target where id=r.id;
   update public.notification_outbox set url=target where id=r.id;
  end if;
 end loop;
end$$;
-- Use the same local-date boundary for reminder eligibility and the timeline.
do $$declare definition text;begin
 select pg_get_functiondef('public.daily_maintenance()'::regprocedure) into definition;
 execute replace(definition,'created_at::date<d','(created_at at time zone c.timezone)::date<d');
end$$;
notify pgrst,'reload schema';
commit;
