begin;

-- Preserve item identity and completion when metadata or unchanged lines are saved.
create or replace function public.save_note(p_title text,p_content text,p_type text,p_visibility text,p_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  c uuid := private.my_couple();
  n uuid;
  kept uuid[] := array[]::uuid[];
  item_id uuid;
  line record;
begin
  if c is null then raise exception 'not_paired'; end if;
  if p_id is null then
    insert into public.notes(couple_id,author_id,title,content,type,visibility)
    values(c,auth.uid(),trim(p_title),trim(p_content),p_type,p_visibility) returning id into n;
  else
    -- Lock the parent so concurrent saves cannot reconcile the same list twice.
    perform 1 from public.notes where id=p_id and couple_id=c and author_id=auth.uid() for update;
    if not found then raise exception 'forbidden'; end if;
    update public.notes set title=trim(p_title),content=trim(p_content),type=p_type,visibility=p_visibility,updated_at=now()
    where id=p_id returning id into n;
  end if;
  if p_type='checklist' then
    for line in select item,ord::integer as position
      from unnest(string_to_array(trim(p_content),E'\n')) with ordinality as lines(item,ord)
      where trim(item)<>'' loop
      -- Match repeated lines one occurrence at a time; reordering preserves IDs.
      select id into item_id from public.note_items
      where note_id=n and content=line.item and not(id=any(kept))
      order by position,id limit 1 for update;
      if item_id is null then
        insert into public.note_items(note_id,content,position)
        values(n,line.item,line.position) returning id into item_id;
      else
        update public.note_items set position=line.position where id=item_id;
      end if;
      kept:=array_append(kept,item_id);
    end loop;
    delete from public.note_items where note_id=n and not(id=any(kept));
  else
    delete from public.note_items where note_id=n;
  end if;
  if p_visibility='private' then
    delete from public.memories where type='note' and source_id=n;
  else
    insert into public.memories(couple_id,author_id,type,source_id) values(c,auth.uid(),'note',n) on conflict do nothing;
  end if;
  return n;
end$$;

revoke all on function public.save_note(text,text,text,text,uuid) from public,anon;
grant execute on function public.save_note(text,text,text,text,uuid) to authenticated,service_role;
notify pgrst, 'reload schema';
commit;
