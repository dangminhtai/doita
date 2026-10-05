-- Require an explicit choice on new accounts; leave existing profiles intact.
create or replace function private.new_user() returns trigger
language plpgsql security definer set search_path='' as $$
declare selected_gender text := new.raw_user_meta_data->>'gender';
begin
 if selected_gender is null or selected_gender not in ('male','female','other','undisclosed') then
  raise exception 'gender_required';
 end if;
 insert into public.profiles(id,display_name,gender)
 values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),60),selected_gender);
 return new;
end$$;
