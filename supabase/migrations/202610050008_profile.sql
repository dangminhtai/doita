alter table public.profiles add column gender text;
alter table public.profiles add constraint profile_gender check(gender is null or gender in ('male','female','other','undisclosed'));

create table public.avatar_assets (
 path text primary key,
 user_id uuid not null,
 digest text not null,
 state text not null default 'pending' check(state in ('pending','current','retired','deleting')),
 cleanup_after timestamptz default now()+interval '1 day',
 created_at timestamptz not null default now()
);
alter table public.avatar_assets enable row level security;
revoke all on public.avatar_assets from public,anon,authenticated;
grant all on public.avatar_assets to service_role;
-- Retain cleanup references even if the account disappears during an upload.
create function private.retire_account_avatars() returns trigger
language plpgsql security definer set search_path='' as $$begin
 update public.avatar_assets set state='retired',cleanup_after=now() where user_id=old.id;
 return old;
end$$;
create trigger retire_account_avatars before delete on public.profiles
for each row execute function private.retire_account_avatars();
revoke all on function private.retire_account_avatars() from public,anon,authenticated;
create table private.profile_receipts (
 user_id uuid not null references public.profiles(id) on delete cascade,
 request_id uuid not null, signature text not null, result jsonb not null,
 primary key(user_id,request_id)
);
revoke all on private.profile_receipts from public,anon,authenticated;

-- pair_couple already takes this same per-user lock. Include direct membership
-- writes and leaving, so the gender check and membership changes serialize.
create function private.lock_membership_profile() returns trigger
language plpgsql security definer set search_path='' as $$begin
 perform pg_advisory_xact_lock(hashtext(coalesce(new.user_id,old.user_id)::text));
 if tg_op='DELETE' then return old;end if;return new;
end$$;
create trigger membership_profile_lock before insert or update or delete on public.couple_members
for each row execute function private.lock_membership_profile();
create function private.guard_profile_gender() returns trigger
language plpgsql security definer set search_path='' as $$begin
 perform pg_advisory_xact_lock(hashtext(new.id::text));
 if new.gender is distinct from old.gender and exists(select 1 from public.couple_members where user_id=new.id) then
  raise exception 'gender_locked';
 end if;return new;
end$$;
create trigger profile_gender_guard before update on public.profiles
for each row execute function private.guard_profile_gender();
revoke all on function private.lock_membership_profile(),private.guard_profile_gender() from public,anon,authenticated;

create function public.update_profile(p_request_id uuid,p_name text,p_gender text,p_resurfacing boolean,p_avatar_mode text default 'keep',p_avatar_path text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); sig text; receipt private.profile_receipts; previous text; result jsonb;
begin
 if u is null then raise exception 'unauthorized';end if;
 perform pg_advisory_xact_lock(hashtext(u::text));
 if p_request_id is null or p_name is null or length(trim(p_name)) not between 1 and 60
 or p_resurfacing is null or p_avatar_mode not in ('keep','default','new') or p_avatar_mode is null
 or (p_gender is not null and p_gender not in ('male','female','other','undisclosed')) then raise exception 'invalid';end if;
 sig:=md5(jsonb_build_array(p_name,p_gender,p_resurfacing,p_avatar_mode,p_avatar_path)::text);
 select * into receipt from private.profile_receipts where user_id=u and request_id=p_request_id;
 if found then
  if receipt.signature<>sig then raise exception 'request_conflict';end if;
  return receipt.result;
 end if;
 select avatar_path into previous from public.profiles where id=u for update;
 if not found then raise exception 'unauthorized';end if;
 if p_avatar_mode='new' and (p_avatar_path is distinct from u::text||'/'||p_request_id::text||'.webp'
 or not exists(select 1 from public.avatar_assets where path=p_avatar_path and user_id=u and state='pending')) then raise exception 'invalid_avatar';end if;
 update public.profiles set display_name=trim(p_name),gender=p_gender,resurfacing=p_resurfacing,
 avatar_path=case p_avatar_mode when 'new' then p_avatar_path when 'default' then null else avatar_path end,
 updated_at=clock_timestamp() where id=u;
 if p_avatar_mode<>'keep' then
  update public.avatar_assets set state='retired',cleanup_after=now()+interval '10 minutes' where path=previous;
  if p_avatar_mode='new' then update public.avatar_assets set state='current',cleanup_after=null where path=p_avatar_path;end if;
 end if;
 select jsonb_build_object('display_name',display_name,'gender',gender,'avatar_path',avatar_path,'resurfacing',resurfacing,'updated_at',updated_at)
 into result from public.profiles where id=u;
 insert into private.profile_receipts values(u,p_request_id,sig,result);
 return result;
end$$;
revoke all on function public.update_profile(uuid,text,text,boolean,text,text) from public,anon;
grant execute on function public.update_profile(uuid,text,text,boolean,text,text) to authenticated,service_role;

create function public.update_couple_settings(p_start date) returns void
language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'not_paired';end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if private.my_couple() is null then raise exception 'not_paired';end if;
 update public.couples set relationship_start_date=p_start where id=private.my_couple();
end$$;
revoke all on function public.update_couple_settings(date) from public,anon;
grant execute on function public.update_couple_settings(date) to authenticated,service_role;

create function public.claim_avatar_cleanup(p_path text) returns boolean
language plpgsql security definer set search_path='' as $$declare owner_id uuid;begin
 select user_id into owner_id from public.avatar_assets where path=p_path;
 if not found then return false;end if;
 perform pg_advisory_xact_lock(hashtext(owner_id::text));
 if exists(select 1 from public.profiles where avatar_path=p_path) then return false;end if;
 update public.avatar_assets set state='deleting' where path=p_path and cleanup_after<=now();
 return found;
end$$;
revoke all on function public.claim_avatar_cleanup(text) from public,anon,authenticated;
grant execute on function public.claim_avatar_cleanup(text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',false,81920,array['image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy avatar_read on storage.objects for select to authenticated using(
 bucket_id='avatars' and exists(select 1 from public.profiles p where p.avatar_path=storage.objects.name)
);
-- The profiles SELECT policy restricts that subquery to self/current partner.
-- Upload/delete are server-owned; authenticated clients have no avatar write policy.
