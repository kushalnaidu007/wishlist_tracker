-- Minimal public-schema mirror of auth.users, kept in sync via trigger.
-- auth.users isn't exposed to the client/RLS at all by Supabase design, but
-- group features need to show other members' identities (member list,
-- "purchased by X"). This is the standard Supabase pattern for that.
--
-- display_name is mandatory but auto-populated from the email's local part
-- at signup — never a raw email shown in the UI, never a blocking
-- onboarding step either. Users personalize it from /profile.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
on profiles for select
using (id = auth.uid());

create policy "Users can view profiles of people they share a group with"
on profiles for select
using (shares_group_with(id));

create policy "Users can update their own profile"
on profiles for update
using (id = auth.uid());

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

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill accounts created before this migration.
insert into public.profiles (id, email, display_name)
select id, email, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;
