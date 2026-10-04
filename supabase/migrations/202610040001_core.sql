begin;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public;

create table public.profiles(id uuid primary key references auth.users on delete cascade,display_name text not null default '' check(length(display_name)<=60),avatar_path text,timezone text not null default 'Asia/Ho_Chi_Minh',resurfacing boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.couples(id uuid primary key default gen_random_uuid(),relationship_start_date date,timezone text not null default 'Asia/Ho_Chi_Minh',invite_code text not null unique default encode(extensions.gen_random_bytes(12),'hex'),invite_expires_at timestamptz not null default now()+interval '7 days',created_at timestamptz not null default now());
create table public.couple_members(couple_id uuid not null references public.couples on delete cascade,user_id uuid not null unique references public.profiles on delete cascade,role text not null default 'member' check(role in ('owner','member')),primary key(couple_id,user_id));
create table public.daily_prompts(id text primary key,prompt text not null,category text not null,difficulty integer not null default 1,is_active boolean not null default true,created_at timestamptz not null default now());
create table public.daily_sessions(id uuid primary key default gen_random_uuid(),couple_id uuid not null references public.couples on delete cascade,prompt_id text not null references public.daily_prompts,date date not null,status text not null default 'pending' check(status in ('pending','completed')),unique(couple_id,date));
create table public.daily_answers(session_id uuid not null references public.daily_sessions on delete cascade,user_id uuid not null references public.profiles on delete cascade,content text not null check(length(trim(content)) between 1 and 3000),submitted_at timestamptz not null default now(),primary key(session_id,user_id));
create table public.daily_feedback(id uuid primary key default gen_random_uuid(),session_id uuid not null references public.daily_sessions on delete cascade,user_id uuid not null references public.profiles on delete cascade,content text not null check(length(content)<=500),created_at timestamptz not null default now());
create table public.streaks(couple_id uuid primary key references public.couples on delete cascade,current_streak integer not null default 0,longest_streak integer not null default 0,last_completed_date date,repair_tokens integer not null default 2,token_month date not null default date_trunc('month',now())::date,updated_at timestamptz not null default now());
create table public.streak_events(id uuid primary key default gen_random_uuid(),couple_id uuid not null references public.couples on delete cascade,date date not null,type text not null check(type in ('completed','missed','repaired','protected')),metadata jsonb not null default '{}',unique(couple_id,date,type));
create table public.notes(id uuid primary key default gen_random_uuid(),couple_id uuid not null references public.couples on delete cascade,author_id uuid not null references public.profiles on delete cascade,title text not null check(length(trim(title)) between 1 and 120),content text not null check(length(trim(content)) between 1 and 5000),type text not null check(type in ('text','checklist')),visibility text not null check(visibility in ('private','partner','couple')),is_pinned boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.note_items(id uuid primary key default gen_random_uuid(),note_id uuid not null references public.notes on delete cascade,content text not null check(length(content)<=5000),completed boolean not null default false,position integer not null default 0);
create table public.prayers(id uuid primary key default gen_random_uuid(),couple_id uuid not null references public.couples on delete cascade,author_id uuid not null references public.profiles on delete cascade,content text not null check(length(trim(content)) between 1 and 1000),visibility text not null check(visibility in ('private','partner')),status text not null check(status in ('draft','released','archived')),created_at timestamptz not null default now(),released_at timestamptz,resurface_at timestamptz,metadata jsonb not null default '{}');
create table public.prayer_events(id uuid primary key default gen_random_uuid(),prayer_id uuid not null references public.prayers on delete cascade,type text not null,created_at timestamptz not null default now(),unique(prayer_id,type));
create table public.memories(id uuid primary key default gen_random_uuid(),couple_id uuid not null references public.couples on delete cascade,author_id uuid references public.profiles on delete cascade,type text not null,source_id uuid,content text not null default '' check(length(content)<=5000),photo_path text,created_at timestamptz not null default now(),unique(couple_id,type,source_id));
create table public.memory_items(id uuid primary key default gen_random_uuid(),memory_id uuid not null references public.memories on delete cascade,content text not null,metadata jsonb not null default '{}');
create table public.moods(id uuid primary key default gen_random_uuid(),couple_id uuid not null references public.couples on delete cascade,user_id uuid not null references public.profiles on delete cascade,mood text not null check(mood in ('happy','tired','sad','stressed','calm','busy','hug','love','rest','more')),created_at timestamptz not null default now());
create table public.activities(id text primary key,title text not null,description text not null,category text not null,duration integer not null check(duration in (5,15,30,60)),energy text not null check(energy in ('low','normal','high')),relationship_stage text not null default 'any',long_distance boolean not null default true,tags jsonb not null default '[]',enabled boolean not null default true);
create table public.activity_sessions(id uuid primary key default gen_random_uuid(),couple_id uuid not null references public.couples on delete cascade,user_id uuid not null references public.profiles on delete cascade,activity_id text not null references public.activities,rating integer check(rating in (-1,0,1)),created_at timestamptz not null default now());
create table public.push_subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles on delete cascade,endpoint text not null unique,keys jsonb not null,created_at timestamptz not null default now());
create table public.special_dates(id uuid primary key default gen_random_uuid(),couple_id uuid not null references public.couples on delete cascade,author_id uuid not null references public.profiles on delete cascade,title text not null check(length(trim(title)) between 1 and 120),date date not null,kind text not null check(kind in ('meetup','birthday','anniversary','custom')),created_at timestamptz not null default now());
create table public.system_jobs(name text primary key,last_started_at timestamptz,last_completed_at timestamptz,status text not null default 'idle',duration_ms integer,error text);
create table private.invite_attempts(user_id uuid primary key references auth.users on delete cascade,attempts integer not null default 0,window_at timestamptz not null default now());
create table public.notification_outbox(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles on delete cascade,actor_id uuid references public.profiles on delete cascade,kind text not null,url text not null default '/home',dedupe text not null unique,sent_at timestamptz,lease_until timestamptz,attempts integer not null default 0,created_at timestamptz not null default now());
create index on public.notes(couple_id,created_at desc);create index on public.prayers(couple_id,created_at desc);create index on public.memories(couple_id,created_at desc);create index on public.daily_sessions(couple_id,date desc);create index on public.moods(couple_id,created_at desc);create index on public.notification_outbox(created_at) where sent_at is null;

create function private.is_member(c uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.couple_members where couple_id=c and user_id=auth.uid())$$;
create function private.my_couple() returns uuid language sql stable security definer set search_path='' as $$select couple_id from public.couple_members where user_id=auth.uid()$$;
create function private.daily_revealed(s uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.daily_sessions where id=s and status='completed' and private.is_member(couple_id))$$;
grant usage on schema private to authenticated;
grant execute on function private.is_member(uuid),private.my_couple(),private.daily_revealed(uuid) to authenticated;
create function private.new_user() returns trigger language plpgsql security definer set search_path='' as $$begin insert into public.profiles(id,display_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),60));return new;end$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.new_user();

-- No table grants for business writes. Atomic validated RPC functions own writes.
do $$declare t text;begin foreach t in array array['profiles','couples','couple_members','daily_prompts','daily_sessions','daily_answers','daily_feedback','streaks','streak_events','notes','note_items','prayers','prayer_events','memories','memory_items','moods','activities','activity_sessions','push_subscriptions','special_dates','system_jobs','notification_outbox'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon, authenticated',t);execute format('grant select on public.%I to authenticated',t);end loop;end$$;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or exists(select 1 from public.couple_members where user_id=profiles.id and private.is_member(couple_id)));
create policy couple_read on public.couples for select to authenticated using(private.is_member(id));
create policy members_read on public.couple_members for select to authenticated using(private.is_member(couple_id));
create policy prompts_read on public.daily_prompts for select to authenticated using(is_active);
create policy sessions_read on public.daily_sessions for select to authenticated using(private.is_member(couple_id));
create policy answers_read on public.daily_answers for select to authenticated using(exists(select 1 from public.daily_sessions s where s.id=session_id and private.is_member(s.couple_id)) and (user_id=auth.uid() or private.daily_revealed(session_id)));
create policy feedback_read on public.daily_feedback for select to authenticated using(private.daily_revealed(session_id));
create policy streak_read on public.streaks for select to authenticated using(private.is_member(couple_id));
create policy events_read on public.streak_events for select to authenticated using(private.is_member(couple_id));
create policy notes_read on public.notes for select to authenticated using(private.is_member(couple_id) and (author_id=auth.uid() or visibility<>'private'));
create policy items_read on public.note_items for select to authenticated using(exists(select 1 from public.notes where id=note_id));
create policy prayers_read on public.prayers for select to authenticated using(private.is_member(couple_id) and (author_id=auth.uid() or (visibility='partner' and status<>'draft')));
create policy prayer_events_read on public.prayer_events for select to authenticated using(exists(select 1 from public.prayers where id=prayer_id));
create policy memories_read on public.memories for select to authenticated using(private.is_member(couple_id) and (type<>'note' or exists(select 1 from public.notes where id=source_id and visibility<>'private')) and (type<>'prayer' or exists(select 1 from public.prayers where id=source_id and visibility='partner')));
create policy memory_items_read on public.memory_items for select to authenticated using(exists(select 1 from public.memories where id=memory_id));
create policy moods_read on public.moods for select to authenticated using(private.is_member(couple_id));
create policy activities_read on public.activities for select to authenticated using(enabled);
create policy activities_sessions_read on public.activity_sessions for select to authenticated using(private.is_member(couple_id));
create policy subscriptions_read on public.push_subscriptions for select to authenticated using(user_id=auth.uid());
create policy dates_read on public.special_dates for select to authenticated using(private.is_member(couple_id));
-- system_jobs and notification_outbox deliberately have no user policies.

create function public.pair_couple(p_code text default null,p_timezone text default 'Asia/Ho_Chi_Minh') returns uuid language plpgsql security definer set search_path='' as $$declare c uuid;n integer;begin
 if auth.uid() is null then raise exception 'unauthorized';end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if private.my_couple() is not null then raise exception 'already_paired';end if;
 if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'invalid_timezone';end if;
 if p_code is null then insert into public.couples(timezone) values(p_timezone) returning id into c;insert into public.couple_members values(c,auth.uid(),'owner');insert into public.streaks(couple_id) values(c);return c;end if;
 insert into private.invite_attempts(user_id) values(auth.uid()) on conflict do nothing;
 update private.invite_attempts set attempts=case when window_at<now()-interval '15 minutes' then 1 else attempts+1 end,window_at=case when window_at<now()-interval '15 minutes' then now() else window_at end where user_id=auth.uid() returning attempts into n;
 -- Invalid codes return NULL rather than throwing, so the attempt counter commits.
 if n>10 or p_code !~ '^[a-fA-F0-9]{24}$' then return null;end if;
 select id into c from public.couples where invite_code=lower(p_code) and invite_expires_at>now() for update;
 if c is null or (select count(*) from public.couple_members where couple_id=c)>=2 then return null;end if;
 insert into public.couple_members values(c,auth.uid(),'member');return c;
end$$;
create function public.leave_couple() returns void language plpgsql security definer set search_path='' as $$begin if auth.uid() is null then raise exception 'unauthorized';end if;delete from public.couple_members where user_id=auth.uid();end$$;
create function public.rotate_invite() returns text language plpgsql security definer set search_path='' as $$declare code text;begin update public.couples set invite_code=encode(extensions.gen_random_bytes(12),'hex'),invite_expires_at=now()+interval '7 days' where id=private.my_couple() returning invite_code into code;return code;end$$;
create function public.update_settings(p_name text,p_timezone text,p_start date,p_resurfacing boolean) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or length(trim(p_name)) not between 1 and 60 or not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'invalid';end if;
 update public.profiles set display_name=trim(p_name),resurfacing=p_resurfacing,updated_at=now() where id=auth.uid();
 -- Shared timezone is fixed after the first daily to prevent duplicate streak credit.
 update public.couples set relationship_start_date=p_start,timezone=case when exists(select 1 from public.daily_sessions where couple_id=couples.id) then timezone else p_timezone end where id=private.my_couple();end$$;
create function public.ensure_daily() returns uuid language plpgsql security definer set search_path='' as $$declare c uuid:=private.my_couple();d date;p text;s uuid;begin
 if c is null then raise exception 'not_paired';end if;
 perform pg_advisory_xact_lock(hashtext(c::text));select (now() at time zone timezone)::date into d from public.couples where id=c;
 select id into s from public.daily_sessions where couple_id=c and date=d;if s is not null then return s;end if;
 select id into p from public.daily_prompts where is_active order by (select max(date) from public.daily_sessions where couple_id=c and prompt_id=daily_prompts.id) asc nulls first,md5(id||d::text||c::text) limit 1;
 if p is null then raise exception 'seed_required';end if;
 insert into public.daily_sessions(couple_id,prompt_id,date) values(c,p,d) returning id into s;return s;end$$;
create function private.queue_partner(c uuid,actor uuid,k text,u text,d text) returns void language sql security definer set search_path='' as $$insert into public.notification_outbox(user_id,actor_id,kind,url,dedupe) select user_id,actor,k,u,d||':'||user_id::text from public.couple_members where couple_id=c and user_id<>actor on conflict(dedupe) do nothing$$;
create function public.answer_daily(p_content text) returns uuid language plpgsql security definer set search_path='' as $$declare s uuid;c uuid;d date;st public.streaks;v integer;begin
 if length(trim(p_content)) not between 1 and 3000 then raise exception 'invalid';end if;
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
create function public.repair_streak() returns void language plpgsql security definer set search_path='' as $$declare c uuid:=private.my_couple();d date;st public.streaks;month date;begin
 if c is null then raise exception 'not_paired';end if;perform pg_advisory_xact_lock(hashtext(c::text));select (now() at time zone timezone)::date into d from public.couples where id=c;month:=date_trunc('month',d)::date;
 update public.streaks set repair_tokens=2,token_month=month where couple_id=c and token_month<>month;
 select * into st from public.streaks where couple_id=c for update;
 if st.last_completed_date<>d-2 or st.last_completed_date is null or st.repair_tokens<1 then raise exception 'repair_unavailable';end if;
 insert into public.streak_events(couple_id,date,type) values(c,d-1,'repaired');
 update public.streaks set repair_tokens=repair_tokens-1,last_completed_date=d-1,updated_at=now() where couple_id=c;
 end$$;
create function public.daily_reply(p_session uuid,p_content text) returns void language plpgsql security definer set search_path='' as $$begin if not private.daily_revealed(p_session) or length(trim(p_content)) not between 1 and 500 then raise exception 'invalid';end if;insert into public.daily_feedback(session_id,user_id,content) values(p_session,auth.uid(),trim(p_content));end$$;

create function public.save_note(p_title text,p_content text,p_type text,p_visibility text,p_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$declare c uuid:=private.my_couple();n uuid;begin
 if c is null then raise exception 'not_paired';end if;
 if p_id is null then insert into public.notes(couple_id,author_id,title,content,type,visibility) values(c,auth.uid(),trim(p_title),trim(p_content),p_type,p_visibility) returning id into n;
 else update public.notes set title=trim(p_title),content=trim(p_content),type=p_type,visibility=p_visibility,updated_at=now() where id=p_id and couple_id=c and author_id=auth.uid() returning id into n;if n is null then raise exception 'forbidden';end if;end if;
 delete from public.note_items where note_id=n;if p_type='checklist' then insert into public.note_items(note_id,content,position) select n,item,ord::int from unnest(string_to_array(trim(p_content),E'\n')) with ordinality as lines(item,ord) where trim(item)<>'';end if;
 if p_visibility='private' then delete from public.memories where type='note' and source_id=n;else insert into public.memories(couple_id,author_id,type,source_id) values(c,auth.uid(),'note',n) on conflict do nothing;end if;return n;end$$;
create function public.note_action(p_id uuid,p_action text) returns void language plpgsql security definer set search_path='' as $$begin
 if not exists(select 1 from public.notes where id=p_id and couple_id=private.my_couple() and author_id=auth.uid()) then raise exception 'forbidden';end if;
 if p_action='delete' then delete from public.memories where type='note' and source_id=p_id;delete from public.notes where id=p_id;elsif p_action='pin' then update public.notes set is_pinned=not is_pinned where id=p_id;else raise exception 'invalid';end if;end$$;
create function public.toggle_note_item(p_id uuid) returns void language plpgsql security definer set search_path='' as $$begin update public.note_items set completed=not completed where id=p_id and exists(select 1 from public.notes n where n.id=note_id and private.is_member(n.couple_id) and (n.author_id=auth.uid() or n.visibility<>'private'));if not found then raise exception 'forbidden';end if;end$$;
create function public.save_prayer(p_content text,p_visibility text,p_resurface boolean,p_status text default 'released',p_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$declare c uuid:=private.my_couple();n uuid;begin
 if c is null or p_status not in ('draft','released') then raise exception 'invalid';end if;
 if p_id is null then insert into public.prayers(couple_id,author_id,content,visibility,status,released_at,resurface_at) values(c,auth.uid(),trim(p_content),p_visibility,p_status,case when p_status='released' then now() end,case when p_resurface and p_status='released' then now()+interval '30 days' end) returning id into n;
 else update public.prayers set content=trim(p_content),visibility=p_visibility,status=p_status,released_at=case when p_status='released' then now() end,resurface_at=case when p_resurface and p_status='released' then now()+interval '30 days' end where id=p_id and couple_id=c and author_id=auth.uid() and status='draft' returning id into n;if n is null then raise exception 'forbidden';end if;end if;
 if p_status='released' then insert into public.prayer_events(prayer_id,type) values(n,'released');if p_visibility='partner' then perform private.queue_partner(c,auth.uid(),'prayer','/prayer','prayer:'||n::text);end if;end if;return n;end$$;
create function public.prayer_action(p_id uuid,p_action text) returns void language plpgsql security definer set search_path='' as $$begin
 if not exists(select 1 from public.prayers where id=p_id and couple_id=private.my_couple() and author_id=auth.uid()) then raise exception 'forbidden';end if;
 if p_action='delete' then delete from public.memories where type='prayer' and source_id=p_id;delete from public.prayers where id=p_id;elsif p_action='archive' then update public.prayers set status='archived',resurface_at=null where id=p_id;else raise exception 'invalid';end if;end$$;
create function public.set_mood(p_mood text) returns void language plpgsql security definer set search_path='' as $$begin if private.my_couple() is null then raise exception 'not_paired';end if;insert into public.moods(couple_id,user_id,mood) values(private.my_couple(),auth.uid(),p_mood);end$$;
create function public.log_activity(p_activity text,p_rating integer) returns void language plpgsql security definer set search_path='' as $$declare n uuid;begin if private.my_couple() is null then raise exception 'not_paired';end if;insert into public.activity_sessions(couple_id,user_id,activity_id,rating) values(private.my_couple(),auth.uid(),p_activity,p_rating) returning id into n;if p_rating=0 then insert into public.memories(couple_id,author_id,type,source_id,content) select private.my_couple(),auth.uid(),'activity',n,title from public.activities where id=p_activity;end if;end$$;
create function public.save_memory(p_content text,p_photo text default null,p_type text default 'moment') returns uuid language plpgsql security definer set search_path='' as $$declare n uuid;c uuid:=private.my_couple();begin
 if c is null or p_type not in ('moment','weekly') or length(trim(p_content)) not between 1 and 5000 or (p_photo is not null and (p_photo not like c::text||'/'||auth.uid()::text||'/%' or p_photo like '%..%')) then raise exception 'invalid';end if;
 insert into public.memories(couple_id,author_id,type,content,photo_path) values(c,auth.uid(),p_type,trim(p_content),p_photo) returning id into n;return n;end$$;
create function public.delete_memory(p_id uuid) returns void language plpgsql security definer set search_path='' as $$begin delete from public.memories where id=p_id and couple_id=private.my_couple() and author_id=auth.uid();if not found then raise exception 'forbidden';end if;end$$;
create function public.save_special_date(p_title text,p_date date,p_kind text,p_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$declare n uuid;begin if private.my_couple() is null then raise exception 'not_paired';end if;if p_id is null then insert into public.special_dates(couple_id,author_id,title,date,kind) values(private.my_couple(),auth.uid(),trim(p_title),p_date,p_kind) returning id into n;else update public.special_dates set title=trim(p_title),date=p_date,kind=p_kind where id=p_id and couple_id=private.my_couple() and author_id=auth.uid() returning id into n;if n is null then raise exception 'forbidden';end if;end if;return n;end$$;
create function public.delete_special_date(p_id uuid) returns void language plpgsql security definer set search_path='' as $$begin delete from public.special_dates where id=p_id and couple_id=private.my_couple() and author_id=auth.uid();end$$;
create function public.save_push(p_endpoint text,p_keys jsonb) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or p_endpoint !~ '^https://' or length(p_endpoint)>2000 or length(coalesce(p_keys->>'auth','')) not between 1 and 200 or length(coalesce(p_keys->>'p256dh','')) not between 1 and 200 then raise exception 'invalid';end if;
 insert into public.push_subscriptions(user_id,endpoint,keys) values(auth.uid(),p_endpoint,p_keys) on conflict(endpoint) do update set user_id=excluded.user_id,keys=excluded.keys;end$$;
create function public.delete_push(p_endpoint text) returns void language plpgsql security definer set search_path='' as $$begin delete from public.push_subscriptions where user_id=auth.uid() and endpoint=p_endpoint;end$$;

create function public.daily_maintenance() returns integer language plpgsql security definer set search_path='' as $$declare c public.couples;d date;p text;pr public.prayers;n integer:=0;started timestamptz:=clock_timestamp();last_ok timestamptz;begin
 -- Transaction scoped lock: retries and overlapping cron runs cannot duplicate events.
 perform pg_advisory_xact_lock(61004001);
 select last_completed_at into last_ok from public.system_jobs where name='daily_maintenance';
 insert into public.system_jobs(name,last_started_at,status) values('daily_maintenance',now(),'running') on conflict(name) do update set last_started_at=excluded.last_started_at,status='running',error=null;
 for c in select * from public.couples where exists(select 1 from public.couple_members where couple_id=couples.id) loop
 d:=(now() at time zone c.timezone)::date;
 select id into p from public.daily_prompts where is_active order by (select max(date) from public.daily_sessions where couple_id=c.id and prompt_id=daily_prompts.id) asc nulls first,md5(id||d::text||c.id::text) limit 1;
 if p is not null then insert into public.daily_sessions(couple_id,prompt_id,date) values(c.id,p,d) on conflict do nothing;end if;
 update public.streaks set repair_tokens=2,token_month=date_trunc('month',d)::date where couple_id=c.id and token_month<>date_trunc('month',d)::date;
 -- Protection only for one missed day across a recorded maintenance outage.
 if last_ok is not null and now()-last_ok>interval '48 hours' then
 insert into public.streak_events(couple_id,date,type,metadata) select c.id,d-1,'protected',jsonb_build_object('reason','maintenance_gap') from public.streaks where couple_id=c.id and last_completed_date=d-2 on conflict do nothing;
 update public.streaks set last_completed_date=d-1 where couple_id=c.id and last_completed_date=d-2 and exists(select 1 from public.streak_events where couple_id=c.id and date=d-1 and type='protected');end if;
 insert into public.streak_events(couple_id,date,type) select c.id,d-1,'missed' where exists(select 1 from public.daily_sessions where couple_id=c.id and date=d-1 and status='pending') on conflict do nothing;
 insert into public.notification_outbox(user_id,kind,url,dedupe) select user_id,'reminder','/daily','reminder:'||c.id::text||':'||d::text||':'||user_id::text from public.couple_members where couple_id=c.id and not exists(select 1 from public.daily_sessions where couple_id=c.id and date=d and status='completed') on conflict do nothing;
 insert into public.notification_outbox(user_id,kind,url,dedupe) select m.user_id,'special','/settings','special:'||s.id::text||':'||d::text||':'||m.user_id::text from public.special_dates s join public.couple_members m on m.couple_id=s.couple_id where s.couple_id=c.id and (s.date=d or (s.kind in ('birthday','anniversary') and to_char(s.date,'MM-DD')=to_char(d,'MM-DD'))) on conflict do nothing;
 insert into public.notification_outbox(user_id,kind,url,dedupe) select cm.user_id,'memory','/memories','memory:'||c.id::text||':'||d::text||':'||cm.user_id::text from public.couple_members cm where cm.couple_id=c.id and exists(select 1 from public.memories where couple_id=c.id and created_at::date<d and to_char(created_at at time zone c.timezone,'MM-DD')=to_char(d,'MM-DD')) on conflict do nothing;
 n:=n+1;end loop;
 for pr in select * from public.prayers where status='released' and resurface_at<=now() for update loop
 insert into public.prayer_events(prayer_id,type) values(pr.id,'resurfaced') on conflict do nothing;
 insert into public.notification_outbox(user_id,kind,url,dedupe) select pr.author_id,'resurface','/prayer','resurface:'||pr.id::text where exists(select 1 from public.profiles where id=pr.author_id and resurfacing) and exists(select 1 from public.couple_members where couple_id=pr.couple_id and user_id=pr.author_id) on conflict do nothing;
 -- Never copy private prayer contents into the shared timeline.
 if pr.visibility='partner' then insert into public.memories(couple_id,type,source_id) values(pr.couple_id,'prayer',pr.id) on conflict do nothing;end if;
 update public.prayers set resurface_at=null where id=pr.id;end loop;
 update public.system_jobs set status='success',last_completed_at=now(),duration_ms=(extract(epoch from clock_timestamp()-started)*1000)::integer,error=null where name='daily_maintenance';return n;end$$;
create function public.claim_notifications(p_actor uuid default null) returns setof public.notification_outbox language sql security definer set search_path='' as $$update public.notification_outbox set lease_until=now()+interval '2 minutes',attempts=attempts+1 where id in(select id from public.notification_outbox where sent_at is null and attempts<5 and (lease_until is null or lease_until<now()) and (p_actor is null or actor_id=p_actor) order by created_at limit 50 for update skip locked) returning *$$;
-- Close PostgreSQL's default PUBLIC execute grant for every definer RPC.
do $$declare f record;begin for f in select p.oid::regprocedure as sig,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef loop execute format('revoke all on function %s from public, anon, authenticated',f.sig);if f.proname not in ('daily_maintenance','claim_notifications') then execute format('grant execute on function %s to authenticated',f.sig);end if;execute format('grant execute on function %s to service_role',f.sig);end loop;end$$;
revoke all on function private.queue_partner(uuid,uuid,text,text,text),private.new_user() from public,anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('memories','memories',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy memory_image_read on storage.objects for select to authenticated using(bucket_id='memories' and exists(select 1 from public.couple_members where couple_id::text=(storage.foldername(name))[1] and user_id=auth.uid()));
create policy memory_image_insert on storage.objects for insert to authenticated with check(bucket_id='memories' and (storage.foldername(name))[2]=auth.uid()::text and exists(select 1 from public.couple_members where couple_id::text=(storage.foldername(name))[1] and user_id=auth.uid()));
create policy memory_image_delete on storage.objects for delete to authenticated using(bucket_id='memories' and (storage.foldername(name))[2]=auth.uid()::text);
-- Subscribe to session status, not hidden answer content. Postgres Changes enforces RLS.
do $$declare t text;begin foreach t in array array['daily_sessions','notes','moods','prayers','memories'] loop if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename=t) then execute format('alter publication supabase_realtime add table public.%I',t);end if;end loop;end$$;
commit;
