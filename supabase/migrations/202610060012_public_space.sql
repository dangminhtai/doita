begin;
alter table public.profiles add column bio text not null default '' check(char_length(bio)<=300);
alter table public.couple_members add column public_profile_consent boolean not null default false;
alter table public.couple_members add column public_profile_consented_at timestamptz;
alter table public.couple_members add column public_avatar_ref uuid not null default gen_random_uuid();

create table private.profile_bio_receipts (
 user_id uuid not null references public.profiles(id) on delete cascade,
 request_id uuid not null,signature text not null,result jsonb not null,primary key(user_id,request_id)
);
revoke all on private.profile_bio_receipts from public,anon,authenticated;
create function public.update_profile_with_bio(p_request_id uuid,p_name text,p_gender text,p_resurfacing boolean,p_bio text,p_avatar_mode text default 'keep',p_avatar_path text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();sig text;r private.profile_bio_receipts;result jsonb;begin
 if u is null then raise exception 'unauthorized';end if;
 if p_request_id is null or p_bio is null or char_length(p_bio)>300 then raise exception 'invalid';end if;
 perform pg_advisory_xact_lock(hashtext(u::text));
 sig:=md5(jsonb_build_array(p_name,p_gender,p_resurfacing,p_bio,p_avatar_mode,p_avatar_path)::text);
 select * into r from private.profile_bio_receipts where user_id=u and request_id=p_request_id;
 if found then
  if r.signature<>sig then raise exception 'request_conflict';end if;return r.result;
 end if;
 perform public.update_profile(p_request_id,p_name,p_gender,p_resurfacing,p_avatar_mode,p_avatar_path);
 update public.profiles set bio=p_bio,updated_at=clock_timestamp() where id=u;
 select jsonb_build_object('display_name',display_name,'gender',gender,'bio',bio,'avatar_path',avatar_path,'resurfacing',resurfacing,'updated_at',updated_at)
 into result from public.profiles where id=u;
 insert into private.profile_bio_receipts values(u,p_request_id,sig,result);return result;
end$$;
revoke all on function public.update_profile_with_bio(uuid,text,text,boolean,text,text,text) from public,anon;
grant execute on function public.update_profile_with_bio(uuid,text,text,boolean,text,text,text) to authenticated,service_role;

create function public.set_public_consent(p_enabled boolean) returns void
language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'unauthorized';end if;
 if p_enabled is null then raise exception 'invalid';end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 update public.couple_members set public_profile_consent=p_enabled,
 public_profile_consented_at=case when p_enabled then now() else null end where user_id=auth.uid();
 if not found then raise exception 'not_paired';end if;
end$$;
revoke all on function public.set_public_consent(boolean) from public,anon;
grant execute on function public.set_public_consent(boolean) to authenticated,service_role;
do $$declare definition text;begin
 select pg_get_functiondef('public.perform_authorized_action(text,jsonb,uuid)'::regprocedure) into definition;
 definition:=replace(definition,'''rotate_invite''','''set_public_consent'',''rotate_invite''');
 execute definition;
end$$;

-- One MVCC snapshot checks all current members' consent before projecting.
-- Only the server can read storage paths; anonymous clients never call this RPC.
create function public.public_space_snapshot(p_public_id text) returns jsonb
language sql stable security definer set search_path='' as $$
 with space as (select id,public_id,timezone,relationship_start_date from public.couples where public_id=p_public_id),
 people as (
  select m.couple_id,m.user_id,m.role,m.public_avatar_ref,m.public_profile_consent,p.display_name,p.gender,p.bio,p.avatar_path
  from public.couple_members m join public.profiles p on p.id=m.user_id join space c on c.id=m.couple_id
 ), visible as (
  select c.* from space c where (select count(*) from people) between 1 and 2
  and not exists(select 1 from people where not public_profile_consent)
 )
 select jsonb_build_object('publicId',c.public_id,'timezone',c.timezone,'startDate',c.relationship_start_date,
 'members',(select jsonb_agg(jsonb_build_object('displayName',display_name,'gender',gender,'bio',bio,'memberRef',public_avatar_ref,'avatarPath',avatar_path) order by (role='owner') desc,user_id) from people),
 'streak',(select jsonb_build_object('current_streak',current_streak,'last_completed_date',last_completed_date) from public.streaks where couple_id=c.id))
 from visible c
$$;
revoke all on function public.public_space_snapshot(text) from public,anon,authenticated;
grant execute on function public.public_space_snapshot(text) to service_role;

create table private.public_read_limits(key text primary key,window_at timestamptz not null default now(),attempts integer not null default 0);
revoke all on private.public_read_limits from public,anon,authenticated;
create function public.consume_public_read(p_key text,p_limit integer) returns boolean
language plpgsql security definer set search_path='' as $$declare n integer;begin
 if p_key is null or length(p_key)<>64 or p_limit not between 1 and 240 then return false;end if;
 delete from private.public_read_limits where window_at<now()-interval '1 day';
 insert into private.public_read_limits(key,attempts) values(p_key,1)
 on conflict(key) do update set attempts=case when public_read_limits.window_at<now()-interval '1 minute' then 1 else public_read_limits.attempts+1 end,
 window_at=case when public_read_limits.window_at<now()-interval '1 minute' then now() else public_read_limits.window_at end returning attempts into n;
 return n<=p_limit;
end$$;
revoke all on function public.consume_public_read(text,integer) from public,anon,authenticated;
grant execute on function public.consume_public_read(text,integer) to service_role;
notify pgrst,'reload schema';
commit;
