-- In-app feedback form. Insert-only: no cap on submissions per user, no
-- update/delete policies since submissions are meant to be immutable.
-- No cross-user select policy either — there's no in-app admin view,
-- reviewing submissions happens directly via the Supabase SQL editor
-- (service role bypasses RLS anyway).

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  overall_satisfaction int not null check (overall_satisfaction between 1 and 5),
  affordability_clarity int not null check (affordability_clarity between 1 and 5),
  most_used_feature text,
  confusing_or_broken text,
  additional_comments text,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

create policy "Users can submit their own feedback"
on feedback for insert
with check (user_id = auth.uid());

create policy "Users can view their own feedback"
on feedback for select
using (user_id = auth.uid());
