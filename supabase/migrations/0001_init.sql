-- Phase 1: core data model. Auth/users are Supabase's built-in auth.users —
-- no separate users table.

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Nullable + set null on delete: this is just "who originally made
  -- this," separate from current ownership (group_members.role) — a
  -- group shouldn't be destroyed because its long-departed creator
  -- deleted their account years later.
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text not null default 'member', -- 'owner' | 'member'
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid references groups(id), -- null = personal item
  name text not null,
  cost numeric(10,2) not null check (cost >= 0),
  priority int not null default 3, -- 1 = highest priority
  status text not null default 'wanted', -- 'wanted' | 'purchased' | 'deferred'
  target_month date,
  created_at timestamptz not null default now()
);

create table balance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  month date not null, -- store as first-of-month
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

create table contributions (
  id uuid primary key default gen_random_uuid(),
  wishlist_item_id uuid not null references wishlist_items(id) on delete cascade,
  group_member_id uuid not null references group_members(id) on delete cascade,
  amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index wishlist_items_owner_id_idx on wishlist_items(owner_id);
create index wishlist_items_group_id_idx on wishlist_items(group_id);
create index balance_entries_user_id_month_idx on balance_entries(user_id, month);
create index group_members_user_id_idx on group_members(user_id);

-- Row Level Security. Pattern: group access is always gated through
-- group_members. Personal rows are gated by owner_id / user_id = auth.uid().
--
-- Membership checks go through SECURITY DEFINER functions rather than
-- inline subqueries against group_members. A policy on group_members that
-- subqueries group_members from within its own USING clause causes
-- Postgres error 42P17 (infinite recursion) — the subquery re-triggers the
-- same policy, which re-triggers the subquery, forever. Wrapping the check
-- in a SECURITY DEFINER function (owned by the migration role, which owns
-- the tables) makes its internal query bypass RLS, breaking the loop — and
-- any other table's policy that needs the same check inherits the fix by
-- calling the same function.

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from group_members
    where group_id = target_group_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.shares_group_with(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from group_members gm1
    join group_members gm2 on gm2.group_id = gm1.group_id
    where gm1.user_id = auth.uid()
      and gm2.user_id = target_user_id
  );
$$;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.shares_group_with(uuid) to authenticated;

alter table groups enable row level security;
alter table group_members enable row level security;
alter table wishlist_items enable row level security;
alter table balance_entries enable row level security;
alter table contributions enable row level security;

create policy "Members can view their groups"
on groups for select
using (
  created_by = auth.uid()
  or is_group_member(id)
);

create policy "Users can create groups"
on groups for insert
with check (created_by = auth.uid());

create policy "Members can view their group's membership rows"
on group_members for select
using (
  user_id = auth.uid()
  or is_group_member(group_id)
);

create policy "Users can join groups"
on group_members for insert
with check (user_id = auth.uid());

create policy "Users can view their own or group items"
on wishlist_items for select
using (
  owner_id = auth.uid()
  or is_group_member(group_id)
);

create policy "Users can insert their own items"
on wishlist_items for insert
with check (owner_id = auth.uid());

create policy "Users can update their own or group items"
on wishlist_items for update
using (
  owner_id = auth.uid()
  or is_group_member(group_id)
);

create policy "Users can delete their own items"
on wishlist_items for delete
using (owner_id = auth.uid());

create policy "Users can view their own balance entries"
on balance_entries for select
using (
  user_id = auth.uid()
  or shares_group_with(user_id)
);

create policy "Users can manage their own balance entries"
on balance_entries for insert
with check (user_id = auth.uid());

create policy "Users can update their own balance entries"
on balance_entries for update
using (user_id = auth.uid());

create policy "Users can view contributions on visible items"
on contributions for select
using (
  wishlist_item_id in (
    select id from wishlist_items
    where owner_id = auth.uid()
    or is_group_member(group_id)
  )
);

create policy "Group members can contribute"
on contributions for insert
with check (
  group_member_id in (
    select id from group_members where user_id = auth.uid()
  )
);
