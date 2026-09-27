-- Adds a mandatory display name so group member lists and purchase
-- attribution never show raw email addresses. Auto-populated at signup
-- (handle_new_user trigger, redefined below) from the email's local part —
-- deliberately plain, not prettified, since any heuristic to make it nicer
-- will guess wrong often enough not to be worth it. Users personalize it
-- from /profile; nobody is blocked or shown a gap in the meantime.
--
-- Guarded with existence checks throughout: 0003_profiles.sql now creates
-- display_name and its update policy directly, so a fresh install applying
-- every migration in sequence would otherwise hit "column/policy already
-- exists" here. This file only has real work left to do against a database
-- that ran the pre-display_name version of 0003.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles' and policyname = 'Users can update their own profile'
  ) then
    create policy "Users can update their own profile"
    on profiles for update
    using (id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'display_name'
  ) then
    alter table profiles add column display_name text;
  end if;
end $$;

update profiles
set display_name = split_part(email, '@', 1)
where display_name is null;

alter table profiles alter column display_name set not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;
