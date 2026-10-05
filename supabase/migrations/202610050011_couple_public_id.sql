begin;

create sequence private.couple_public_number minvalue 1 maxvalue 999999999 no cycle;
alter table public.couples add column public_id text not null unique
 default lpad(nextval('private.couple_public_number')::text,9,'0');
alter table public.couples add constraint couple_public_id_format check(public_id ~ '^[0-9]{9}$');
-- The legacy secret remains stored but is no longer readable or a join credential.
revoke select on public.couples from authenticated;
grant select(id,public_id,relationship_start_date,timezone,created_at) on public.couples to authenticated;

create table public.couple_join_requests (
 id uuid primary key default gen_random_uuid(),
 couple_id uuid not null references public.couples(id) on delete cascade,
 requester_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted','rejected','cancelled','expired','unavailable')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '7 days',
 resolved_at timestamptz
);
create unique index one_pending_join_per_user on public.couple_join_requests(requester_id) where status='pending';
create index pending_couple_requests on public.couple_join_requests(couple_id,created_at) where status='pending';
alter table public.couple_join_requests enable row level security;
revoke all on public.couple_join_requests from public,anon,authenticated;
grant select on public.couple_join_requests to authenticated;
grant all on public.couple_join_requests to service_role;
create policy join_request_read on public.couple_join_requests for select to authenticated
 using(requester_id=auth.uid() or private.is_member(couple_id));

create or replace function public.pair_couple(p_code text default null,p_timezone text default 'Asia/Ho_Chi_Minh') returns uuid
language plpgsql security definer set search_path='' as $$declare c uuid;begin
 if auth.uid() is null then raise exception 'unauthorized';end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if private.my_couple() is not null then raise exception 'already_paired';end if;
 -- Old clients cannot bypass approval with the former secret.
 if p_code is not null then return null;end if;
 if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'invalid_timezone';end if;
 update public.couple_join_requests set status='cancelled',resolved_at=now() where requester_id=auth.uid() and status='pending';
 insert into public.couples(timezone) values(p_timezone) returning id into c;
 insert into public.couple_members values(c,auth.uid(),'owner');
 insert into public.streaks(couple_id) values(c);return c;
end$$;

create or replace function public.rotate_invite() returns text
language plpgsql security definer set search_path='' as $$begin raise exception 'invalid';end$$;

-- Move legacy secrets out of public rows, including Realtime payloads.
create table private.couple_invites (
 couple_id uuid primary key references public.couples(id) on delete cascade,
 invite_code text not null unique,
 invite_expires_at timestamptz not null
);
insert into private.couple_invites select id,invite_code,invite_expires_at from public.couples;
revoke all on private.couple_invites from public,anon,authenticated;
alter table public.couples drop column invite_code,drop column invite_expires_at;
create function private.store_couple_invite() returns trigger
language plpgsql security definer set search_path='' as $$begin
 insert into private.couple_invites values(new.id,encode(extensions.gen_random_bytes(12),'hex'),now()+interval '7 days');
 return new;
end$$;
create trigger store_couple_invite after insert on public.couples for each row execute function private.store_couple_invite();
revoke all on function private.store_couple_invite() from public,anon,authenticated;

create function public.request_couple(p_public_id text) returns uuid
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();c uuid;n integer;r public.couple_join_requests;begin
 if u is null then raise exception 'unauthorized';end if;
 perform pg_advisory_xact_lock(hashtext(u::text));
 if private.my_couple() is not null then raise exception 'already_paired';end if;
 update public.couple_join_requests set status='expired',resolved_at=now() where requester_id=u and status='pending' and expires_at<=now();
 select * into r from public.couple_join_requests where requester_id=u and status='pending';
 if found then
  if (select public_id from public.couples where id=r.couple_id)=p_public_id then return r.id;end if;
  raise exception 'join_pending';
 end if;
 insert into private.invite_attempts(user_id) values(u) on conflict do nothing;
 update private.invite_attempts set attempts=case when window_at<now()-interval '15 minutes' then 1 else attempts+1 end,
 window_at=case when window_at<now()-interval '15 minutes' then now() else window_at end where user_id=u returning attempts into n;
 if n>10 or p_public_id !~ '^[0-9]{9}$' or p_public_id is null then return null;end if;
 select id into c from public.couples where public_id=p_public_id for update;
 if c is null or (select count(*) from public.couple_members where couple_id=c)<>1 then return null;end if;
 update public.couple_join_requests set status='expired',resolved_at=now() where couple_id=c and status='pending' and expires_at<=now();
 if (select count(*) from public.couple_join_requests where couple_id=c and status='pending')>=30 then return null;end if;
 insert into public.couple_join_requests(couple_id,requester_id) values(c,u) returning id into r.id;
 perform private.queue_partner(c,u,'join_request','/couple?panel=profile','join_request:'||r.id::text);
 return r.id;
end$$;

create function public.review_join_request(p_id uuid,p_accept boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();r public.couple_join_requests;lock_user uuid;begin
 if u is null then raise exception 'unauthorized';end if;
 if p_accept is null then raise exception 'invalid';end if;
 select * into r from public.couple_join_requests where id=p_id;
 if not found then raise exception 'invalid';end if;
 -- Lock both people before the couple, matching membership mutations.
 for lock_user in select x from unnest(array[u,r.requester_id]) x order by x loop
  perform pg_advisory_xact_lock(hashtext(lock_user::text));
 end loop;
 perform 1 from public.couples where id=r.couple_id for update;
 select * into r from public.couple_join_requests where id=p_id for update;
 if not private.is_member(r.couple_id) or r.requester_id=u then raise exception 'forbidden';end if;
 if r.status<>'pending' then return r.status='accepted';end if;
 if r.expires_at<=now() then
  update public.couple_join_requests set status='expired',resolved_at=now() where id=p_id;return false;
 end if;
 if not p_accept then
  update public.couple_join_requests set status='rejected',resolved_at=now() where id=p_id;return false;
 end if;
 if exists(select 1 from public.couple_members where user_id=r.requester_id)
 or (select count(*) from public.couple_members where couple_id=r.couple_id)<>1 then
  update public.couple_join_requests set status='unavailable',resolved_at=now() where id=p_id;return false;
 end if;
 insert into public.couple_members values(r.couple_id,r.requester_id,'member');
 update public.couple_join_requests set status=case when id=p_id then 'accepted' else 'unavailable' end,resolved_at=now()
 where couple_id=r.couple_id and status='pending';
 return true;
end$$;

create function public.cancel_join_request(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'unauthorized';end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if not exists(select 1 from public.couple_join_requests where id=p_id and requester_id=auth.uid()) then raise exception 'forbidden';end if;
 update public.couple_join_requests set status='cancelled',resolved_at=now() where id=p_id and status='pending';
end$$;

create function public.list_join_requests() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from (
  select j.id,c.public_id,j.requester_id,p.display_name,
   case when j.status='pending' and j.expires_at<=now() then 'expired' else j.status end as status,
   j.created_at,j.expires_at
  from public.couple_join_requests j join public.couples c on c.id=j.couple_id
  join public.profiles p on p.id=j.requester_id
  where j.requester_id=auth.uid() or (private.is_member(j.couple_id) and j.status='pending' and j.expires_at>now())
  order by j.created_at desc,j.id desc limit 30
 ) r
$$;
revoke all on function public.request_couple(text),public.review_join_request(uuid,boolean),public.cancel_join_request(uuid),public.list_join_requests() from public,anon;
grant execute on function public.request_couple(text),public.review_join_request(uuid,boolean),public.cancel_join_request(uuid),public.list_join_requests() to authenticated,service_role;

-- Reuse mutation receipts so retries never create duplicate requests/decisions.
do $$declare definition text;begin
 select pg_get_functiondef('public.perform_authorized_action(text,jsonb,uuid)'::regprocedure) into definition;
 definition:=replace(definition,'''pair_couple'',''rotate_invite''','''pair_couple'',''request_couple'',''review_join_request'',''cancel_join_request'',''rotate_invite''');
 definition:=replace(definition,'(''pair_couple'',''leave_couple'')','(''pair_couple'',''request_couple'',''cancel_join_request'',''leave_couple'')');
 execute definition;
end$$;
do $$begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  alter publication supabase_realtime add table public.couple_join_requests;
 end if;
end$$;
notify pgrst,'reload schema';
commit;
