-- Enables real account deletion. Deleting a Supabase Auth user cascades
-- through the schema via these foreign keys — before this migration,
-- most had no `on delete` behavior specified at all, so deleting a user
-- would fail with a FK violation on the very first table it hit.
--
-- Only needed if you already applied the pre-existing migrations, which
-- created these foreign keys without an on-delete behavior. A fresh
-- install running the (now-updated) 0001/0004/0005/0007 already gets the
-- correct behavior from the start and should skip this file — it will
-- error, since the old (unnamed-behavior) constraints it expects to drop
-- won't exist to be dropped.
--
-- Each one gets the behavior that actually fits, not a blanket cascade:
-- - owner_id / user_id columns that represent "this row is yours" cascade
--   (deleting your account removes what you personally added or entered).
-- - purchased_by (someone else's item, you just bought it) sets null —
--   losing attribution is fine, deleting someone else's item is not.
-- - groups.created_by sets null — that's "who originally made this,"
--   separate from current ownership (group_members.role); a group
--   shouldn't be destroyed because its long-departed creator deleted
--   their account years later.
--
-- group_members.user_id is deliberately left alone — removing a
-- membership row needs the same owner-promotion decision leaveGroup()
-- already makes, which a DB-level cascade can't do. That's handled in
-- application code instead, before the auth user is ever deleted.
--
-- contributions.group_member_id's fix here also resolves a pre-existing,
-- independent bug: leaveGroup() already deletes group_members rows
-- directly and would fail the same way today if that member ever made a
-- contribution.

alter table wishlist_items
  drop constraint wishlist_items_owner_id_fkey,
  add constraint wishlist_items_owner_id_fkey
    foreign key (owner_id) references auth.users(id) on delete cascade;

alter table wishlist_items
  drop constraint wishlist_items_purchased_by_fkey,
  add constraint wishlist_items_purchased_by_fkey
    foreign key (purchased_by) references auth.users(id) on delete set null;

alter table balance_entries
  drop constraint balance_entries_user_id_fkey,
  add constraint balance_entries_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table group_balance_entries
  drop constraint group_balance_entries_user_id_fkey,
  add constraint group_balance_entries_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table group_invites
  drop constraint group_invites_created_by_fkey,
  add constraint group_invites_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete cascade;

alter table groups
  alter column created_by drop not null;

alter table groups
  drop constraint groups_created_by_fkey,
  add constraint groups_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;

alter table contributions
  drop constraint contributions_group_member_id_fkey,
  add constraint contributions_group_member_id_fkey
    foreign key (group_member_id) references group_members(id) on delete cascade;
