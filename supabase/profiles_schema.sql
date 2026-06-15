-- Dandy Sync (Sprint 13.5) profile schema
--
-- Run this once in your Supabase project's SQL editor (Database > SQL Editor).
-- Adds a per-user profile (display name + avatar) alongside the existing
-- `user_data` table, plus a public `avatars` storage bucket so avatar images
-- can be displayed without a signed URL.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- Avatars bucket: publicly readable, but each user can only write under
-- their own `<user_id>/...` path prefix.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
