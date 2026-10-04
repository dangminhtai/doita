begin;
drop function public.answer_daily(text);
create function public.answer_daily(p_content text,p_session_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$declare s uuid;c uuid;d date;st public.streaks;v integer;begin
 if length(trim(p_content)) not between 1 and 3000 then raise exception 'invalid';end if;
 if c is null then c:=private.my_couple();end if;
 if c is null then raise exception 'not_paired';end if;
 perform pg_advisory_xact_lock(hashtext(c::text));
 if p_session_id is null or not exists(select 1 from public.daily_sessions ds join public.couples cp on cp.id=ds.couple_id where ds.id=p_session_id and ds.couple_id=c and ds.date=(now() at time zone cp.timezone)::date) then raise exception 'stale_session';end if;
 s:=public.ensure_daily();select couple_id,date into c,d from public.daily_sessions where id=s for update;
 insert into public.daily_answers(session_id,user_id,content) values(s,auth.uid(),trim(p_content)) on conflict do nothing;
 perform private.queue_partner(c,auth.uid(),'daily','/daily','daily:'||s::text||':'||auth.uid()::text);
 if (select count(*) from public.couple_members where couple_id=c)=2 and (select count(*) from public.daily_answers a join public.couple_members m on m.user_id=a.user_id and m.couple_id=c where a.session_id=s)=2 and (select status from public.daily_sessions where id=s)<>'completed' then
 update public.daily_sessions set status='completed' where id=s;
 select * into st from public.streaks where couple_id=c for update;
 v:=case when st.last_completed_date=d then st.current_streak when st.last_completed_date=d-1 then st.current_streak+1 else 1 end;
 update public.streaks set current_streak=v,longest_streak=greatest(longest_streak,v),last_completed_date=d,updated_at=now() where couple_id=c;
 insert into public.streak_events(couple_id,date,type) values(c,d,'completed') on conflict do nothing;
 insert into public.memories(couple_id,type,source_id) values(c,'daily',s) on conflict do nothing;
 end if;return s;end$$;

create or replace function public.save_prayer(p_content text,p_visibility text,p_resurface boolean,p_status text default 'released',p_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$declare c uuid:=private.my_couple();n uuid;begin
 if c is null or p_status not in ('draft','released') then raise exception 'invalid';end if;
 if p_id is null then insert into public.prayers(couple_id,author_id,content,visibility,status,released_at,resurface_at) values(c,auth.uid(),trim(p_content),p_visibility,p_status,case when p_status='released' then now() end,case when p_resurface and p_status='released' then now()+interval '30 days' end) returning id into n;
 else update public.prayers set content=trim(p_content),visibility=p_visibility,status=p_status,released_at=case when p_status='released' then now() end,resurface_at=case when p_resurface and p_status='released' then now()+interval '30 days' end where id=p_id and couple_id=c and author_id=auth.uid() and status='draft' returning id into n;if n is null then raise exception 'forbidden';end if;end if;
 update public.prayers set metadata=metadata||jsonb_build_object('resurface',p_resurface) where id=n;
 if p_status='released' then insert into public.prayer_events(prayer_id,type) values(n,'released');if p_visibility='partner' then perform private.queue_partner(c,auth.uid(),'prayer','/prayer','prayer:'||n::text);end if;end if;return n;end$$;

revoke all on function public.answer_daily(text,uuid) from public,anon;
grant execute on function public.answer_daily(text,uuid) to authenticated,service_role;
alter table public.daily_sessions add column updated_at timestamptz not null default now();
alter table public.couples add column updated_at timestamptz not null default now();
create function private.touch_membership() returns trigger language plpgsql security definer set search_path='' as $$begin
 update public.couples set updated_at=clock_timestamp() where id=case when tg_op='DELETE' then old.couple_id else new.couple_id end;
 return null;
end$$;
create trigger membership_touch after insert or update or delete on public.couple_members for each row execute function private.touch_membership();
revoke all on function private.touch_membership() from public,anon,authenticated;
create function private.touch_parent() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='note_items' then
  update public.notes set updated_at=clock_timestamp() where id=case when tg_op='DELETE' then old.note_id else new.note_id end;
 else
  update public.daily_sessions set updated_at=clock_timestamp() where id=case when tg_op='DELETE' then old.session_id else new.session_id end;
 end if;
 return null;
end$$;
create trigger items_touch after insert or update or delete on public.note_items for each row execute function private.touch_parent();
create trigger answers_touch after insert or update or delete on public.daily_answers for each row execute function private.touch_parent();
create trigger feedback_touch after insert or update or delete on public.daily_feedback for each row execute function private.touch_parent();
revoke all on function private.touch_parent() from public,anon,authenticated;
do $$declare t text;begin foreach t in array array['couples','couple_members','profiles','special_dates','streaks','streak_events','activity_sessions'] loop
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then execute format('alter publication supabase_realtime add table public.%I',t);end if;
end loop;end$$;
drop policy items_read on public.note_items;
create policy items_read on public.note_items for select to authenticated using(exists(select 1 from public.notes n where n.id=note_id and private.is_member(n.couple_id) and (n.author_id=auth.uid() or n.visibility<>'private')));
drop policy prayer_events_read on public.prayer_events;
create policy prayer_events_read on public.prayer_events for select to authenticated using(exists(select 1 from public.prayers p where p.id=prayer_id and private.is_member(p.couple_id) and (p.author_id=auth.uid() or (p.visibility='partner' and p.status<>'draft'))));
create function public.memories_on_this_day() returns setof public.memories language sql stable security invoker set search_path='' as $$
 select m.* from public.memories m join public.couples c on c.id=m.couple_id
 where m.couple_id=private.my_couple()
 and (m.created_at at time zone c.timezone)::date < (now() at time zone c.timezone)::date
 and to_char(m.created_at at time zone c.timezone,'MM-DD')=to_char(now() at time zone c.timezone,'MM-DD')
 order by m.created_at desc
$$;
revoke all on function public.memories_on_this_day() from public,anon;
grant execute on function public.memories_on_this_day() to authenticated,service_role;
notify pgrst,'reload schema';
commit;
