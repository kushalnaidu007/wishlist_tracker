-- Fixes 42P17 "infinite recursion detected in policy for relation
-- group_members". The group_members SELECT policy queried group_members
-- from within its own USING clause — evaluating the policy required
-- evaluating the policy again, looping forever. Any other policy that
-- queried group_members (wishlist_items, balance_entries, contributions)
-- inherited the same failure, since it has to evaluate group_members' own
-- RLS to read from it.
--
-- Fix: move the group-membership checks into SECURITY DEFINER functions.
-- Because they're owned by the migration role (which owns the tables),
-- their internal queries bypass RLS instead of re-triggering it — breaking
-- the recursion.
--
-- (Historical file, named for when this table was called household_members
-- — kept as-is since Supabase migration filenames are tracked by the CLI
-- and shouldn't be renamed after the fact. Harmless to run on a fresh
-- install too: 0001_init.sql already ships this fix, so this just
-- re-creates identical objects.)

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

drop policy "Members can view their groups" on groups;
create policy "Members can view their groups"
on groups for select
using (
  created_by = auth.uid()
  or is_group_member(id)
);

drop policy "Members can view their group's membership rows" on group_members;
create policy "Members can view their group's membership rows"
on group_members for select
using (
  user_id = auth.uid()
  or is_group_member(group_id)
);

drop policy "Users can view their own or group items" on wishlist_items;
create policy "Users can view their own or group items"
on wishlist_items for select
using (
  owner_id = auth.uid()
  or is_group_member(group_id)
);

drop policy "Users can update their own or group items" on wishlist_items;
create policy "Users can update their own or group items"
on wishlist_items for update
using (
  owner_id = auth.uid()
  or is_group_member(group_id)
);

drop policy "Users can view their own balance entries" on balance_entries;
create policy "Users can view their own balance entries"
on balance_entries for select
using (
  user_id = auth.uid()
  or shares_group_with(user_id)
);

drop policy "Users can view contributions on visible items" on contributions;
create policy "Users can view contributions on visible items"
on contributions for select
using (
  wishlist_item_id in (
    select id from wishlist_items
    where owner_id = auth.uid()
    or is_group_member(group_id)
  )
);
