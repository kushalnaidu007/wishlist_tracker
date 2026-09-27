# Wishpri — group wishlist tracker

Phase 0–3 of the [project brief](./household-wishlist-project-brief.md): add
items you want to buy, mark them purchased, enter your real monthly balance,
see what's affordable now vs. later, and share a wishlist with a group of
people (the brief calls this "household sharing" — renamed to "group" in
the app itself, since it's not actually tied to living in the same house).

## Stack

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres,
email/password auth, RLS), Resend (not wired up yet — Phase 4).

## Setup

1. Install dependencies: `npm install`
2. Create a Supabase project, then copy `.env.local.example` to `.env.local`
   and fill in the URL/anon key from **Project Settings → API**.
3. Run the schema against your project — paste each file in
   `supabase/migrations/` (in order) into the Supabase SQL Editor, or
   `supabase db push` with the CLI. If you've already run some of these
   against a live project, you only need to run the ones you haven't —
   each is additive and safe to skip once applied. If you already applied
   `0001`–`0007` before the group rename, you additionally need `0008`,
   which renames the existing `household_*` tables/columns/functions in
   place — a fresh install running the (now-updated) `0001`–`0007` gets
   `group_*` naming from the start and should skip `0008` entirely.
4. `npm run dev` and open [http://localhost:3000](http://localhost:3000).

Without `.env.local` set, the app renders a "Connect Supabase" notice instead
of crashing — everything else (build, lint, routing) works standalone.

Supabase's free tier auto-pauses projects after 7 days idle — set up a
scheduled ping (GitHub Actions or UptimeRobot) before sharing this beyond
yourself.

## What's built

- **Phase 0** — add item (name, cost, priority), list view, mark purchased.
- **Phase 1** — full data model (`groups`, `group_members`,
  `wishlist_items`, `balance_entries`, `contributions`) with RLS, scoped to
  personal (non-group) items for now.
- **Phase 2** — manual monthly balance entry, editable inline on the
  dashboard, and the affordability calculator
  (`src/lib/affordability.ts`), rendered as a ledger tape: items in
  priority order, running balance, a perforated divider where the balance
  runs out. The stored balance is a true running total, not a static
  ceiling — marking an item purchased deducts its cost from the current
  month's balance (and un-purchasing, deleting a purchased item, or editing
  its cost afterward all adjust it back to stay correct), so the
  affordability split always reflects what's actually left to spend. Items
  can also be drag-reordered (grip handle on hover) to change their
  priority directly, live-recomputing affordability as you drag.

- **Phase 3** — group sharing (`/group`). Create a group, generate a
  shareable invite link (no email-sending — the owner copies and sends it
  themselves; see below), and a shared wishlist view pooling balances
  entered separately for the group. Reuses the exact same ledger UI and
  affordability calculator as the personal dashboard — it's fed the group
  pool instead. **Group balance is its own thing, entirely separate from
  personal balance** — each member enters their own contribution on the
  group page (`group_balance_entries`, a dedicated table, not a sum of
  personal balances), with a breakdown showing what everyone's put in.
  Marking a shared item purchased deducts from the *purchaser's group
  entry*, not their personal balance — so a personal purchase never shrinks
  group spending power and vice versa. Contributions (a separate, explicit
  "chip in $X toward this" action per item) are a different concept still —
  tracking who chipped in toward one specific item, shown as a progress bar
  per item. Membership is managed from the group page: any member can
  leave, the owner can remove members or transfer ownership. A `profiles`
  table (kept in sync via a DB trigger on `auth.users`) makes other
  members' identities visible under RLS — needed to show who's in the
  group and who purchased a shared item, since Supabase never exposes
  `auth.users` to the client directly. Rather than showing raw email
  addresses, everyone has a display name — auto-set at signup from their
  email's local part so nobody's ever shown a gap, and editable from
  `/profile`.

Auth is Supabase email/password (`/login`, with a Sign in / Create account
tab) since `wishlist_items.owner_id` requires a real `auth.users` row.
Switched from magic-link because Supabase's default auth email service caps
out at a handful of emails/hour on the free tier — fine for production once
Resend is wired up as custom SMTP (Phase 4), but a blocker during dev
iteration. Account creation still sends one confirmation email per signup by
default; if that's still too much friction while testing, disable "Confirm
email" under Authentication → Providers → Email in the Supabase dashboard.

Phase 4 (email notifications via Resend) isn't built yet — invites in
Phase 3 deliberately stayed link-only rather than pulling Resend forward,
per the same email-infra tradeoff above.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
