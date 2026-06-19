-- ============================================================
-- SettleAm — Full Supabase Setup Script
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE
-- ────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  first_name    text default '',
  last_name     text default '',
  phone         text default '',
  craft         text default '',
  location      text default '',
  services      text[] default '{}',
  experience    text default '1 yr exp',
  price         text default '₦5,000',
  description   text default '',
  profile_image text default '',          -- Cloudinary optimized image URL
  portfolio     text[] default '{}',      -- Cloudinary optimized image URLs
  rating        numeric(3,1) default 5.0,
  reviews       integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);


-- ────────────────────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY (RLS) — Profiles
-- ────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- Anyone can read all profiles (needed for the public artisan directory)
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

-- A user can only insert/update their own profile
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- ────────────────────────────────────────────────────────────
-- 3. AUTO-UPDATE updated_at TRIGGER
-- ────────────────────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();


-- ────────────────────────────────────────────────────────────
-- Done! ✅
-- ────────────────────────────────────────────────────────────
