begin;
alter table public.notes drop constraint notes_title_check;
alter table public.notes add constraint notes_title_check check(length(trim(title))<=120);
alter table public.notes add column lifetime text not null default 'forever' check(lifetime in ('15m','1h','1d','1w','forever'));
alter table public.notes add column expires_at timestamptz;
create index notes_expiration on public.notes(expires_at) where expires_at is not null;

-- Restrictive policy also applies if future read policies are added.
create policy notes_not_expired on public.notes as restrictive for select to authenticated
using(expires_at is null or expires_at>now());

-- Security-definer mutations bypass read policies; guard those writes too.
create function private.guard_expired_note() returns trigger
language plpgsql set search_path='' as $$begin
 if old.expires_at is not null and old.expires_at<=clock_timestamp() then raise exception 'not_found';end if;
 return new;
end$$;
create trigger guard_expired_note before update on public.notes for each row execute function private.guard_expired_note();
create function private.guard_expired_note_item() returns trigger
language plpgsql security definer set search_path='' as $$begin
 if exists(select 1 from public.notes where id=new.note_id and expires_at<=clock_timestamp()) then raise exception 'not_found';end if;
 return new;
end$$;
create trigger guard_expired_note_item before insert or update on public.note_items for each row execute function private.guard_expired_note_item();

create function public.save_note_timed(p_title text,p_content text,p_type text,p_visibility text,p_lifetime text,p_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare n uuid;previous text;duration interval;begin
 if auth.uid() is null then raise exception 'unauthorized';end if;
 if p_lifetime is null or p_lifetime not in ('15m','1h','1d','1w','forever') then raise exception 'invalid';end if;
 if p_id is not null then
  select lifetime into previous from public.notes
  where id=p_id and author_id=auth.uid() and couple_id=private.my_couple()
  and (expires_at is null or expires_at>clock_timestamp()) for update;
  if not found then raise exception 'not_found';end if;
 end if;
 n:=public.save_note(p_title,p_content,p_type,p_visibility,p_id);
 if p_id is null or previous is distinct from p_lifetime then
  duration:=case p_lifetime when '15m' then interval '15 minutes' when '1h' then interval '1 hour' when '1d' then interval '1 day' when '1w' then interval '7 days' else null end;
  update public.notes set lifetime=p_lifetime,expires_at=case when duration is null then null else clock_timestamp()+duration end where id=n;
 end if;
 return n;
end$$;
revoke all on function public.save_note_timed(text,text,text,text,text,uuid) from public,anon;
grant execute on function public.save_note_timed(text,text,text,text,text,uuid) to authenticated,service_role;
do $$declare definition text;begin
 select pg_get_functiondef('public.perform_authorized_action(text,jsonb,uuid)'::regprocedure) into definition;
 definition:=replace(definition,'''save_note''','''save_note'',''save_note_timed''');
 execute definition;
end$$;

create function public.cleanup_expired_notes() returns integer
language plpgsql security definer set search_path='' as $$declare total integer;begin
 -- Keep retry tombstones but remove expired content from their stored arguments.
 update private.action_receipts r set args=r.args-'p_content'-'p_title'
 where r.action in ('save_note','save_note_timed') and r.result in
 (select to_jsonb(id) from public.notes where expires_at<=now());
 delete from public.memories where type='note' and source_id in (select id from public.notes where expires_at<=now());
 delete from public.notes where expires_at<=now();
 get diagnostics total=row_count;
 return total;
end$$;
revoke all on function public.cleanup_expired_notes() from public,anon,authenticated;
grant execute on function public.cleanup_expired_notes() to service_role;
notify pgrst,'reload schema';
commit;
