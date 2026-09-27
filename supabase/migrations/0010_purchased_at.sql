-- Records when an item was actually marked purchased — separate from
-- created_at (when it was first added to the wishlist, which can predate
-- the purchase by months). Needed to correctly scope purchase-revert
-- eligibility and balance corrections to the month the purchase actually
-- happened in, instead of always touching "whatever month it is right now."
-- No backfill: existing purchased rows get null, treated by the app as
-- "not this month" — we genuinely don't know when they were bought.

alter table wishlist_items add column purchased_at timestamptz;
