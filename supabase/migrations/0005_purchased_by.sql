-- Attributes who marked a group item purchased. Set/cleared by the
-- setItemStatus server action alongside its existing balance-adjustment
-- logic — not enforced at the DB level beyond the FK, since personal items
-- never set it (always purchased by their sole owner, not useful to show).

alter table wishlist_items add column purchased_by uuid references auth.users(id) on delete set null;
