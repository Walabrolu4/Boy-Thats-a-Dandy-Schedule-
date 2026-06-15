-- Dandy Sync early-access lock
--
-- This project's Supabase backend (URL + anon key) is baked into the built
-- app, which is public/open-source - so the client-side email check in
-- SupabaseAdapter.js is only a UI convenience, not real security. Anyone
-- could call the Supabase auth API directly with the published anon key and
-- sign up for their own account on this project.
--
-- This trigger rejects new auth.users sign-ups (including magic-link OTP,
-- which creates a user on first request) whose email doesn't match the
-- allowed address below, so only the project owner can use this managed
-- backend while it's in early access.
--
-- Run this once in your Supabase project's SQL editor (Database > SQL Editor).
-- Replace the email below with your own before running.

create or replace function public.restrict_dandy_sync_signup()
returns trigger as $$
begin
  if new.email is distinct from 'kaushikpaddy@gmail.com' then
    raise exception 'Dandy Sync is currently limited to the project owner during early access.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists restrict_dandy_sync_signup on auth.users;

create trigger restrict_dandy_sync_signup
  before insert on auth.users
  for each row execute function public.restrict_dandy_sync_signup();

-- To remove this restriction later (e.g. once Dandy Sync is open to everyone):
--   drop trigger if exists restrict_dandy_sync_signup on auth.users;
--   drop function if exists public.restrict_dandy_sync_signup();
