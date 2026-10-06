begin;

-- New memberships share their introduction by default.
alter table public.couple_members alter column public_profile_consent set default true;

-- Old false values were also the default. Keep an explicit opt-out recorded
-- by the UI's authorized action; enable memberships with no recorded opt-out.
update public.couple_members m
set public_profile_consent=true
where not m.public_profile_consent
and not exists (
 select 1 from private.action_receipts r
 where r.user_id=m.user_id and r.couple_id=m.couple_id
 and r.action='set_public_consent' and r.args->>'p_enabled'='false'
);

notify pgrst,'reload schema';
commit;
