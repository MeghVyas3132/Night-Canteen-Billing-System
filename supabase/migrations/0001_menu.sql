-- ============================================================================
-- 0001_menu.sql  —  Night Canteen (Milestone M0)
-- Menu backbone: categories + items. Public read; no public writes.
-- Admin write policies are added in Milestone M1.
-- Money is stored as INTEGER PAISE (never floats).
-- Run this in the Supabase SQL editor (see SETUP.md), then run supabase/seed.sql.
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- Keeps updated_at fresh on row updates.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- Tables
-- --------------------------------------------------------------------------
create table if not exists public.menu_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid        references public.menu_categories(id) on delete set null,
  name         text        not null,
  description  text,
  price_paise  int         not null check (price_paise >= 0),
  is_available boolean     not null default true,
  sort_order   int         not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists menu_items_category_idx on public.menu_items(category_id);

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Row Level Security
-- With RLS enabled and only SELECT policies below, anon/authenticated can read
-- the menu but cannot write. Seeding via the SQL editor runs as a privileged
-- role and bypasses RLS. Admin write policies come in M1.
-- --------------------------------------------------------------------------
alter table public.menu_categories enable row level security;
alter table public.menu_items      enable row level security;

drop policy if exists "menu_categories public read" on public.menu_categories;
create policy "menu_categories public read"
  on public.menu_categories for select
  to anon, authenticated
  using (true);

drop policy if exists "menu_items public read" on public.menu_items;
create policy "menu_items public read"
  on public.menu_items for select
  to anon, authenticated
  using (true);
