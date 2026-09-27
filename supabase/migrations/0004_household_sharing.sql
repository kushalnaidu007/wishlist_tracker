-- Invite links, plus the membership-management RLS that's currently
-- missing entirely: group_members only had SELECT/INSERT policies from
-- 0001_init.sql, so leaving, removing a member, and transferring ownership
-- were all impossible until this migration.
--
-- (Historical filename from when groups were called households — kept
-- as-is since Supabase migration filenames are tracked by the CLI.)

create table group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  -- Denormalized at creation time. groups SELECT is gated to members —
  -- someone viewing a fresh invite isn't a member yet, so a live join would
  -- silently return nothing under RLS. The name itself isn't sensitive.
  group_name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

alter table group_invites enable row level security;

-- The id itself (an unguessable UUID) is the access control, same model as
-- Slack/Notion invite links. proxy.ts forces sign-in before /invite/[id] is
-- ever reached, so no anon-role policy is needed.
create policy "Authenticated users can view invites by id"
on group_invites for select to authenticated using (true);

create policy "Group members can create invites"
on group_invites for insert
with check (is_group_member(group_id));

create or replace function public.is_group_owner(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = target_group_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

grant execute on function public.is_group_owner(uuid) to authenticated;

-- Leave: delete your own row. Remove: owner deletes someone else's row.
create policy "Users can leave, owners can remove members"
on group_members for delete
using (user_id = auth.uid() or is_group_owner(group_id));

-- Transfer ownership needs to flip `role` on two rows.
create policy "Owners can update roles in their group"
on group_members for update
using (is_group_owner(group_id));

-- A group with its last member gone gets deleted by the app (see
-- leaveGroup) — needs a DELETE policy, which didn't exist before.
create policy "Members can delete their group"
on groups for delete
using (is_group_member(id));

-- wishlist_items.group_id had no ON DELETE behavior specified, which would
-- make deleting an empty group fail with a FK violation the moment any
-- item still referenced it. Falling back to personal (null) is much less
-- surprising than blocking the delete or cascading into deleting someone's
-- items.
alter table wishlist_items
  drop constraint wishlist_items_group_id_fkey,
  add constraint wishlist_items_group_id_fkey
    foreign key (group_id) references groups(id) on delete set null;

-- addItem can now set group_id on insert (previously always null), but the
-- original INSERT policy from 0001_init.sql only checked owner_id — it
-- never validated that the caller actually belongs to the group they're
-- targeting. Without this, anyone could insert an item into any group's
-- shared list just by knowing its id.
drop policy "Users can insert their own items" on wishlist_items;
create policy "Users can insert their own items"
on wishlist_items for insert
with check (
  owner_id = auth.uid()
  and (group_id is null or is_group_member(group_id))
);
