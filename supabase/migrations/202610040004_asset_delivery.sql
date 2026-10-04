begin;
create table public.memory_assets(
 path text primary key, user_id uuid not null references public.profiles on delete cascade,
 cleanup boolean not null default false, attempts integer not null default 0,
 created_at timestamptz not null default now()
);
alter table public.memory_assets enable row level security;
revoke all on public.memory_assets from public,anon,authenticated;
grant all on public.memory_assets to service_role;
-- Recover historical paths, including assets whose memory record is already gone.
insert into public.memory_assets(path,user_id)
select o.name,p.id from storage.objects o join public.profiles p on split_part(o.name,'/',2)=p.id::text
where o.bucket_id='memories' on conflict do nothing;
insert into public.memory_assets(path,user_id)
select photo_path,author_id from public.memories where photo_path is not null and author_id is not null
on conflict do nothing;
create function public.register_memory_asset(p_path text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or p_path not like private.my_couple()::text||'/'||auth.uid()::text||'/%' or p_path like '%..%' or private.my_couple() is null then raise exception 'forbidden';end if;
 insert into public.memory_assets(path,user_id) values(p_path,auth.uid()) on conflict do nothing;
end$$;
create function public.queue_memory_cleanup(p_path text) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.memory_assets set cleanup=true,attempts=0 where path=p_path and user_id=auth.uid();
 if not found then raise exception 'forbidden';end if;
end$$;
create function private.track_asset() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='memories' then
  if old.photo_path is not null and old.author_id is not null and exists(select 1 from public.profiles where id=old.author_id) then
   insert into public.memory_assets(path,user_id,cleanup) values(old.photo_path,old.author_id,true)
   on conflict(path) do update set cleanup=true;
  end if;
 elsif tg_op='DELETE' and old.bucket_id='memories' then
  delete from public.memory_assets where path=old.name;
 elsif tg_op='INSERT' and new.bucket_id='memories' then
  insert into public.memory_assets(path,user_id)
  select new.name,id from public.profiles where id::text=split_part(new.name,'/',2) on conflict do nothing;
 end if;
 return null;
end$$;
create trigger memory_asset_delete after delete on public.memories for each row execute function private.track_asset();
create trigger storage_asset_track after insert or delete on storage.objects for each row execute function private.track_asset();
revoke all on function private.track_asset() from public,anon,authenticated;
revoke all on function public.register_memory_asset(text),public.queue_memory_cleanup(text) from public,anon;
grant execute on function public.register_memory_asset(text),public.queue_memory_cleanup(text) to authenticated,service_role;
-- Also recover abandoned uploads when the browser closed before it could queue rollback.
create function public.queue_abandoned_assets() returns void language sql security definer set search_path='' as $$
 update public.memory_assets a set cleanup=true
 where not a.cleanup and a.created_at<now()-interval '24 hours'
 and not exists(select 1 from public.memories m where m.photo_path=a.path);
$$;
revoke all on function public.queue_abandoned_assets() from public,anon,authenticated;
grant execute on function public.queue_abandoned_assets() to service_role;

create table public.notification_deliveries(
 job_id uuid not null references public.notification_outbox on delete cascade,
 subscription_id uuid not null references public.push_subscriptions on delete cascade,
 delivered_at timestamptz, attempts integer not null default 0,
 next_attempt_at timestamptz, last_status integer,
 primary key(job_id,subscription_id)
);
alter table public.notification_deliveries enable row level security;
revoke all on public.notification_deliveries from public,anon,authenticated;
grant all on public.notification_deliveries to service_role;
-- Do not send expired reminders; completed receipt rows stop duplicate delivery.
create or replace function public.claim_notifications(p_actor uuid default null) returns setof public.notification_outbox
language plpgsql security definer set search_path='' as $$begin
 update public.notification_outbox set sent_at=now() where sent_at is null and created_at<now()-interval '24 hours';
 return query update public.notification_outbox set lease_until=now()+interval '2 minutes',attempts=attempts+1
 where id in(select id from public.notification_outbox where sent_at is null and attempts<5
 and (lease_until is null or lease_until<now()) and (p_actor is null or actor_id=p_actor or user_id=p_actor)
 order by created_at limit 50 for update skip locked) returning *;
end$$;
notify pgrst,'reload schema';
commit;
