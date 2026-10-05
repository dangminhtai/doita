-- Gender is editable without leaving the couple, per the revised product rule.
-- Keep profile validation, ownership and request receipts unchanged.
drop trigger if exists profile_gender_guard on public.profiles;
drop function if exists private.guard_profile_gender();
