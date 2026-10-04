begin;

create table public.notifications (
  id uuid primary key references public.notification_outbox(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null,
  url text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_inbox on public.notifications(user_id, created_at desc);
create index notifications_unread on public.notifications(user_id) where read_at is null;
alter table public.notifications enable row level security;
revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;
grant all on public.notifications to service_role;
create policy notifications_read on public.notifications for select to authenticated
using(user_id=auth.uid() and private.is_member(couple_id));

create function private.record_notification() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.notifications(id,user_id,couple_id,actor_id,kind,url,created_at)
  select new.id,new.user_id,m.couple_id,new.actor_id,new.kind,new.url,new.created_at
  from public.couple_members m where m.user_id=new.user_id;
  return null;
end$$;
create trigger outbox_inbox after insert on public.notification_outbox
for each row execute function private.record_notification();
revoke all on function private.record_notification() from public,anon,authenticated;

-- Only recent existing jobs from the recipient's current couple are imported.
insert into public.notifications(id,user_id,couple_id,actor_id,kind,url,created_at)
select o.id,o.user_id,m.couple_id,o.actor_id,o.kind,o.url,o.created_at
from public.notification_outbox o join public.couple_members m on m.user_id=o.user_id
where o.created_at>now()-interval '24 hours'
and (o.actor_id is null or exists(select 1 from public.couple_members a where a.user_id=o.actor_id and a.couple_id=m.couple_id));

create function public.mark_notifications_read(p_ids uuid[] default null,p_before timestamptz default null) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'unauthorized';end if;
  if coalesce(array_length(p_ids,1),0)>100 then raise exception 'invalid';end if;
  update public.notifications set read_at=now()
  where (id=any(p_ids) or (p_ids is null and created_at<=p_before))
  and user_id=auth.uid() and private.is_member(couple_id) and read_at is null;
end$$;
revoke all on function public.mark_notifications_read(uuid[],timestamptz) from public,anon;
grant execute on function public.mark_notifications_read(uuid[],timestamptz) to authenticated,service_role;

-- Notifications contain generic event types and links, never private message bodies.
create function private.notify_interaction() returns trigger
language plpgsql security definer set search_path='' as $$
declare c uuid;actor uuid;k text;u text;
begin
  if tg_table_name='daily_feedback' then
    select couple_id into c from public.daily_sessions where id=new.session_id;
    actor:=new.user_id;k:=case when new.content='♥' then 'reaction' else 'reply' end;u:='/daily';
  elsif tg_table_name='activity_sessions' then
    c:=new.couple_id;actor:=new.user_id;
    k:=case new.rating when 1 then 'activity_like' when -1 then 'activity_dislike' else 'activity' end;u:='/activities';
  elsif tg_table_name='moods' then
    if new.mood not in ('hug','love','rest','more') then return null;end if;
    c:=new.couple_id;actor:=new.user_id;k:='care';u:='/home';
  elsif tg_table_name='notes' then
    if new.visibility='private' then return null;end if;
    if tg_op='UPDATE' then
      if old.visibility=new.visibility and old.title=new.title and old.content=new.content then return null;end if;
    end if;
    c:=new.couple_id;actor:=new.author_id;k:='note';u:='/notes';
  end if;
  perform private.queue_partner(c,actor,k,u,k||':'||new.id::text||':'||clock_timestamp()::text);
  return null;
end$$;
create trigger feedback_notification after insert on public.daily_feedback for each row execute function private.notify_interaction();
create trigger activity_notification after insert on public.activity_sessions for each row execute function private.notify_interaction();
create trigger care_notification after insert on public.moods for each row execute function private.notify_interaction();
create trigger note_notification after insert or update on public.notes for each row execute function private.notify_interaction();
revoke all on function private.notify_interaction() from public,anon,authenticated;
alter publication supabase_realtime add table public.notifications;
notify pgrst,'reload schema';
commit;
