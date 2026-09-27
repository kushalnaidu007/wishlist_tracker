# Household purchase wishlist — project brief

## What this is

A webapp where users add items they want to buy (name, cost, priority), track them
against their real monthly balance, and decide what's affordable now vs. later. The
differentiator vs. existing wishlist/budgeting apps: it's **item-first, not
category-first** — you're ranking specific things you want to buy (sofa, TV,
dishwasher), not tracking spending categories — and it supports **household-shared
wishlists** with per-member contribution tracking, not just personal lists.

## Explicitly out of scope for now

- PWA / installable app features (no manifest, no service worker, no push)
- Native mobile app
- Open Banking / live bank account connection — balance is entered manually
- Real-time live updates — notifications go out via email, not push/websockets

Don't build any of the above unless asked. These were deliberately deferred until
the core product is validated.

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend / DB / Auth:** Supabase (Postgres, Auth via email magic link, Row Level
  Security for household permissions, auto-generated REST API)
- **Email:** Resend (+ React Email for templates)
- **Hosting:** Vercel

Notes on Supabase free tier: fine for MVP on storage/MAU/egress/functions, but free
projects **auto-pause after 7 days of inactivity**. Set up a scheduled GitHub
Actions ping (or UptimeRobot) on day one so a quiet week doesn't take the beta
offline. No automated backups on free tier — back up manually before schema
migrations.

## Data model

Auth/users are handled by Supabase's built-in `auth.users` — don't create a
separate users table, reference `auth.users(id)` directly.

```sql
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text not null default 'member', -- 'owner' | 'member'
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  household_id uuid references households(id), -- null = personal item
  name text not null,
  cost numeric(10,2) not null,
  priority int not null default 3, -- 1 = highest priority
  status text not null default 'wanted', -- 'wanted' | 'purchased' | 'deferred'
  target_month date,
  created_at timestamptz not null default now()
);

create table balance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  amount numeric(10,2) not null,
  month date not null, -- store as first-of-month
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

create table contributions (
  id uuid primary key default gen_random_uuid(),
  wishlist_item_id uuid not null references wishlist_items(id) on delete cascade,
  household_member_id uuid not null references household_members(id),
  amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);
```

Example RLS policy (the pattern to replicate across tables — household access is
always gated through `household_members`):

```sql
alter table wishlist_items enable row level security;

create policy "Users can view their own or household items"
on wishlist_items for select
using (
  owner_id = auth.uid()
  or household_id in (
    select household_id from household_members where user_id = auth.uid()
  )
);
```

## Core feature: the "affordability" calculator

This is the differentiated logic — get it right before anything else.

1. Fetch the user's (or household's) active items where `status = 'wanted'`,
   sorted by `priority` ascending (1 = highest).
2. Compute remaining balance for the current month: sum of `balance_entries` for
   the user, plus — if it's a household item — the balance entries of all
   household members for that month.
3. Walk the sorted list. For each item: if `cost <= remaining_balance`, mark it
   affordable and subtract its cost from the running balance. If not, mark it
   deferred to next month.
4. Return two lists: affordable this month, and deferred.

## Build phases

- **Phase 0:** Core loop only — add item (name, cost, priority), list view, mark
  purchased. No sharing, no balance logic.
- **Phase 1:** Solidify the data model above for a single user.
- **Phase 2:** Manual monthly balance entry + the affordability calculator.
- **Phase 3:** Household sharing — invite via email link, shared wishlist view,
  contribution tracking. Highest complexity — don't start until Phase 1–2 have
  real users.
- **Phase 4:** Email notifications (Resend) — e.g. "X added an item to your
  household wishlist" — instead of push.
- **Phase 5:** Soft-launch Phase 1–2 to a small audience (e.g. a landing page +
  waitlist link) to validate the core loop before investing in Phase 3.

## Validation approach

Distribution is via a shareable web link (e.g. posted to an existing audience),
not an app store listing — this is a deliberate reason the stack is a webapp, not
native. Prioritize a fast, shippable Phase 0/1 over completeness.
