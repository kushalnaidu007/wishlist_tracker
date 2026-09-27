-- Renames "household" to "group" throughout — a product decision, not a
-- correctness fix: "group" is a more accurate name for what this feature
-- actually is (any set of people sharing a wishlist, not necessarily
-- people who live together).
--
-- Only needed if you already applied the pre-0008 migrations, which used
-- "household" naming throughout. A fresh install running the (now-updated)
-- 0001–0007 already gets "group" naming from the start and should skip
-- this file — it will error, since the old names won't exist to rename.
--
-- Order matters: tables first (so column renames below can target them by
-- their new names), then columns, then constraint/index names, then
-- function bodies, then the functions' own names, then policy names
-- (purely cosmetic, listed last).

-- 1. Tables
alter table households rename to groups;
alter table household_members rename to group_members;
alter table household_invites rename to group_invites;
alter table household_balance_entries rename to group_balance_entries;

-- 2. Columns
alter table group_members rename column household_id to group_id;
alter table wishlist_items rename column household_id to group_id;
alter table contributions rename column household_member_id to group_member_id;
alter table group_invites rename column household_id to group_id;
alter table group_invites rename column household_name to group_name;
alter table group_balance_entries rename column household_id to group_id;

-- 3. Explicitly-named constraints/indexes from earlier migrations. (Not
-- chasing Postgres's own auto-generated names like households_pkey or the
-- unique(group_id, user_id) constraint's implicit name — those are
-- invisible in normal usage and appear nowhere in application code.)
alter table wishlist_items rename constraint wishlist_items_household_id_fkey to wishlist_items_group_id_fkey;
alter index wishlist_items_household_id_idx rename to wishlist_items_group_id_idx;
alter index household_members_user_id_idx rename to group_members_user_id_idx;

-- 4. Function bodies. Postgres SQL-language functions store their body as
-- text, re-resolved by name on every call — renaming the underlying
-- tables/columns above does NOT update references inside these bodies.
-- CREATE OR REPLACE under the OLD function name first, so any policy
-- already depending on it (by OID, not by name) keeps resolving correctly
-- through the rename in step 5.
--
-- The parameter is kept as `target_household_id` here (not renamed to
-- target_group_id) because CREATE OR REPLACE FUNCTION cannot change an
-- input parameter's name (Postgres error 42P13) — only DROP+CREATE can,
-- and dropping would cascade-fail against the policies that already
-- depend on this function by OID. The parameter name is purely internal
-- to the function body and never visible to application code, so this is
-- cosmetic only.
create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from group_members
    where group_id = target_household_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.shares_household_with(target_user_id uuid)
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

create or replace function public.is_household_owner(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = target_household_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

-- 5. Function names. Renaming a function (like renaming a table) is
-- transparent to anything that calls it — policies reference it by OID,
-- not by text — so this is safe now that the bodies above are correct.
alter function public.is_household_member(uuid) rename to is_group_member;
alter function public.shares_household_with(uuid) rename to shares_group_with;
alter function public.is_household_owner(uuid) rename to is_group_owner;

-- 6. Policy names — cosmetic only; policies keep working across all of the
-- above regardless, tracked by the table's OID rather than by text.
alter policy "Members can view their households" on groups rename to "Members can view their groups";
alter policy "Users can create households" on groups rename to "Users can create groups";
alter policy "Members can delete their household" on groups rename to "Members can delete their group";

alter policy "Members can view their household's membership rows" on group_members rename to "Members can view their group's membership rows";
alter policy "Users can join households" on group_members rename to "Users can join groups";
alter policy "Owners can update roles in their household" on group_members rename to "Owners can update roles in their group";

alter policy "Users can view their own or household items" on wishlist_items rename to "Users can view their own or group items";
alter policy "Users can update their own or household items" on wishlist_items rename to "Users can update their own or group items";

alter policy "Household members can contribute" on contributions rename to "Group members can contribute";

alter policy "Household members can create invites" on group_invites rename to "Group members can create invites";

alter policy "Users can view profiles of people they share a household with" on profiles rename to "Users can view profiles of people they share a group with";

alter policy "Household members can view all balance entries for their household" on group_balance_entries rename to "Group members can view all balance entries for their group";
alter policy "Users can set their own household balance entry" on group_balance_entries rename to "Users can set their own group balance entry";
alter policy "Users can update their own household balance entry" on group_balance_entries rename to "Users can update their own group balance entry";
