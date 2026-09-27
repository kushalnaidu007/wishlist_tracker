-- Optional link to where an item can actually be bought. Stored as the
-- raw URL the user pasted in — any affiliate-tag rewriting happens at
-- render time (see src/lib/product-link.ts), not by mutating this value,
-- so existing links start earning commission the moment that logic lands
-- with no backfill needed.

alter table wishlist_items add column product_url text;
