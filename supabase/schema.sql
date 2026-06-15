-- Dandy Sync (Sprint 13) schema
--
-- Run this once in your Supabase project's SQL editor (Database > SQL Editor).
-- Stores each signed-in user's entire app state (tags, tasks, schedule, week
-- states, theme - the same shape as storage.js's exportData()/importData())
-- as a single JSON blob per user, mirroring the GitHub "Bring Your Own Sync"
-- adapter's single-file-per-account approach.
--
-- `updated_at` is used for optimistic-concurrency conflict detection
-- (equivalent to the sha/ETag check in GitHubAdapter): a write only succeeds
-- if `updated_at` still matches the value the client last read.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

-- Each user may only ever see and modify their own row.
create policy "Users can read their own data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own data"
  on public.user_data for delete
  using (auth.uid() = user_id);
