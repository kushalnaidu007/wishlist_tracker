-- Separates group spending power from personal balance. Previously the
-- group's "pooled balance" was just a sum of everyone's PERSONAL
-- balance_entries — meaning a personal purchase silently shrank the
-- group's pool, and there was no way to contribute less than your entire
-- personal balance to shared spending. This table is the group equivalent
-- of balance_entries, entered separately per member per month.
--
-- A dedicated table rather than a nullable group_id on balance_entries
-- itself — extending balance_entries' existing unique(user_id, month) to
-- include a nullable group_id wouldn't actually enforce "one personal
-- entry per month" any more, since Postgres treats NULL as distinct from
-- itself in uniqueness checks.
--
-- (Historical filename from when groups were called households — kept
-- as-is since Supabase migration filenames are tracked by the CLI.)

create table group_balance_entries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  month date not null,
  created_at timestamptz not null default now(),
  unique (group_id, user_id, month)
);

alter table group_balance_entries enable row level security;

create policy "Group members can view all balance entries for their group"
on group_balance_entries for select
using (is_group_member(group_id));

create policy "Users can set their own group balance entry"
on group_balance_entries for insert
with check (user_id = auth.uid() and is_group_member(group_id));

create policy "Users can update their own group balance entry"
on group_balance_entries for update
using (user_id = auth.uid() and is_group_member(group_id));
