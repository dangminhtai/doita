begin;
-- Nullable default keeps old inserts/clients compatible; NULL means legacy kind rule.
alter table public.special_dates add column custom_label text check(length(custom_label)<=60);
alter table public.special_dates add column repeat_rule text check(repeat_rule in ('none','yearly'));
update public.special_dates set repeat_rule=case when kind in ('birthday','anniversary') then 'yearly' else 'none' end;
create function public.save_special_date_details(p_title text,p_date date,p_kind text,p_id uuid default null,p_custom_label text default null,p_repeat_rule text default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare n uuid;r text:=coalesce(p_repeat_rule,case when p_kind in ('birthday','anniversary') then 'yearly' else 'none' end);
begin
 if r not in ('none','yearly') or (p_kind='custom' and (p_custom_label is null or length(trim(p_custom_label)) not between 1 and 60)) then raise exception 'invalid';end if;
 n:=public.save_special_date(p_title,p_date,p_kind,p_id);
 update public.special_dates set custom_label=case when p_kind='custom' then trim(p_custom_label) end,repeat_rule=r where id=n;
 return n;
end$$;
revoke all on function public.save_special_date_details(text,date,text,uuid,text,text) from public,anon;
grant execute on function public.save_special_date_details(text,date,text,uuid,text,text) to authenticated,service_role;
do $$declare definition text;updated text;begin
 select pg_get_functiondef('public.perform_authorized_action(text,jsonb,uuid)'::regprocedure) into definition;
 execute replace(definition,'''save_special_date''','''save_special_date'',''save_special_date_details''');
 select pg_get_functiondef('public.daily_maintenance()'::regprocedure) into definition;
 updated:=replace(definition,
 '(s.date=d or (s.kind in (''birthday'',''anniversary'') and to_char(s.date,''MM-DD'')=to_char(d,''MM-DD'')))',
 '((coalesce(s.repeat_rule,case when s.kind in (''birthday'',''anniversary'') then ''yearly'' else ''none'' end)=''none'' and s.date=d) or (coalesce(s.repeat_rule,case when s.kind in (''birthday'',''anniversary'') then ''yearly'' else ''none'' end)=''yearly'' and to_char(s.date,''MM-DD'')=to_char(d,''MM-DD'')))');
 if definition=updated then raise exception 'Daily date expression changed; inspect migration before applying';end if;
 execute updated;
end$$;
create index memories_cursor_idx on public.memories(couple_id,created_at desc,id desc);
create index notes_cursor_idx on public.notes(couple_id,is_pinned desc,created_at desc,id desc);
create index prayers_cursor_idx on public.prayers(couple_id,status,created_at desc,id desc);
create index special_dates_cursor_idx on public.special_dates(couple_id,date,id);
notify pgrst,'reload schema';
commit;
