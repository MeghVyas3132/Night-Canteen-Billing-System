-- ============================================================
-- Night Canteen — one-paste setup (0001 menu + 0002 admin + 0003 orders + 0004 payment + seed)
-- Paste this whole file into the Supabase SQL Editor and press Run.
-- Safe to re-run (idempotent).
-- ============================================================

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

-- ============================================================================
-- 0002_admin.sql  —  Night Canteen (Milestone M1)
-- Admin identity + audit trail + admin write access to the menu.
-- Run in the Supabase SQL editor after 0001_menu.sql. Then create a staff
-- account (see SETUP.md → "Create an admin account").
-- ============================================================================

-- --------------------------------------------------------------------------
-- Admin profiles: one row per staff member, linked to a Supabase Auth user.
-- --------------------------------------------------------------------------
create table if not exists public.admin_profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text        not null default 'Staff',
  role         text        not null default 'staff' check (role in ('staff', 'owner')),
  created_at   timestamptz not null default now()
);

-- Is the current request an admin? SECURITY DEFINER so it can read
-- admin_profiles regardless of that table's own RLS (avoids recursion).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.admin_profiles enable row level security;

drop policy if exists "admin_profiles self read" on public.admin_profiles;
create policy "admin_profiles self read"
  on public.admin_profiles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- --------------------------------------------------------------------------
-- Admin write access to the menu (public read policies stay from 0001).
-- --------------------------------------------------------------------------
drop policy if exists "menu_categories admin write" on public.menu_categories;
create policy "menu_categories admin write"
  on public.menu_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "menu_items admin write" on public.menu_items;
create policy "menu_items admin write"
  on public.menu_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --------------------------------------------------------------------------
-- Audit log: sensitive admin actions (menu changes, etc.).
-- --------------------------------------------------------------------------
create table if not exists public.audit_log (
  id             uuid primary key default gen_random_uuid(),
  actor_user_id  uuid references auth.users(id) on delete set null,
  action         text        not null,          -- e.g. 'menu_item.create'
  entity_type    text        not null,          -- e.g. 'menu_item'
  entity_id      uuid,
  summary        text,                            -- human-readable one-liner
  before         jsonb,
  after          jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists audit_log_created_idx on public.audit_log(created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log admin read" on public.audit_log;
create policy "audit_log admin read"
  on public.audit_log for select
  to authenticated
  using (public.is_admin());

drop policy if exists "audit_log admin insert" on public.audit_log;
create policy "audit_log admin insert"
  on public.audit_log for insert
  to authenticated
  with check (public.is_admin() and actor_user_id = auth.uid());

-- ============================================================================
-- 0003_orders.sql  —  Night Canteen (Milestone M2)
-- Customer sessions + cart→order. Money stays INTEGER PAISE, computed server-side.
-- Customers are NOT Supabase-authed: they carry an opaque session token in an
-- httpOnly cookie. So customer order access happens only server-side via the
-- service role, scoped by that token in app code. RLS therefore gives customers
-- NO direct access; staff (authenticated admins) can read orders + set status.
-- Run in the Supabase SQL editor after 0002_admin.sql.
-- ============================================================================

-- Enums (guard against re-run) -------------------------------------------------
do $$ begin
  create type public.order_status as enum
    ('pending_payment', 'new', 'preparing', 'ready', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum
    ('created', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- Customer sessions ------------------------------------------------------------
create table if not exists public.customer_sessions (
  id           uuid        primary key default gen_random_uuid(),
  token        text        not null unique,          -- opaque bearer, in httpOnly cookie
  name         text        not null,
  phone        text,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '30 days')
);

-- Orders -----------------------------------------------------------------------
create table if not exists public.orders (
  id                 uuid                  primary key default gen_random_uuid(),
  daily_order_number int,                                       -- assigned on payment (M3)
  session_id         uuid                  references public.customer_sessions(id) on delete set null,
  customer_name      text                  not null,
  customer_phone     text,
  status             public.order_status   not null default 'pending_payment',
  payment_status     public.payment_status not null default 'created',
  subtotal_paise     int                   not null check (subtotal_paise >= 0),
  total_paise        int                   not null check (total_paise >= 0),
  idempotency_key    text                  unique,              -- blocks duplicate submits
  razorpay_order_id  text,
  razorpay_payment_id text,
  created_at         timestamptz           not null default now(),
  updated_at         timestamptz           not null default now(),
  paid_at            timestamptz
);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_status_idx  on public.orders(status);
create index if not exists orders_session_idx on public.orders(session_id);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Order items (price snapshots at order time) ----------------------------------
create table if not exists public.order_items (
  id                        uuid primary key default gen_random_uuid(),
  order_id                  uuid not null references public.orders(id) on delete cascade,
  menu_item_id              uuid references public.menu_items(id) on delete set null,
  name_snapshot             text not null,
  unit_price_paise_snapshot int  not null check (unit_price_paise_snapshot >= 0),
  quantity                  int  not null check (quantity > 0),
  line_total_paise          int  not null check (line_total_paise >= 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- Daily human-facing order numbers (used at payment, M3) -----------------------
create table if not exists public.daily_counters (
  day               date primary key,
  last_order_number int  not null default 0
);

-- Row Level Security -----------------------------------------------------------
alter table public.customer_sessions enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.daily_counters    enable row level security;

-- Staff can read orders + items and update order status. No anon/customer
-- policies anywhere here → those tables are reachable only via the service role
-- (server-side), which is exactly how customer order flows run.
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read"
  on public.orders for select to authenticated using (public.is_admin());

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update"
  on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_items admin read" on public.order_items;
create policy "order_items admin read"
  on public.order_items for select to authenticated using (public.is_admin());

-- ============================================================================
-- 0004_payment.sql  —  Night Canteen (Milestone M3)
-- Atomic per-day human order number, assigned when an order is paid.
-- Run in the Supabase SQL editor after 0003_orders.sql.
-- ============================================================================

-- Returns the next order number for today, incrementing atomically. The upsert
-- takes a row lock, so concurrent payments never get the same number.
create or replace function public.next_daily_order_number()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  insert into public.daily_counters (day, last_order_number)
  values (current_date, 1)
  on conflict (day)
    do update set last_order_number = daily_counters.last_order_number + 1
  returning last_order_number into n;
  return n;
end;
$$;

revoke all on function public.next_daily_order_number() from public, anon, authenticated;

-- ============================================================================
-- seed.sql  —  Sample Night Canteen menu for local/dev.
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING, so it's safe to re-run.
-- Run in the Supabase SQL editor after 0001_menu.sql (see SETUP.md).
-- Prices are in paise (₹1 = 100 paise).
-- ============================================================================

insert into public.menu_categories (id, name, sort_order) values
  ('11111111-1111-1111-1111-111111111111', 'Maggi & Noodles',   1),
  ('22222222-2222-2222-2222-222222222222', 'Sandwiches & Toast', 2),
  ('33333333-3333-3333-3333-333333333333', 'Snacks',            3),
  ('44444444-4444-4444-4444-444444444444', 'Beverages',         4)
on conflict (id) do nothing;

insert into public.menu_items (id, category_id, name, description, price_paise, is_available, sort_order) values
  ('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Classic Masala Maggi', 'The 2-minute canteen staple, done right',            5000, true,  1),
  ('a0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Cheese Maggi',         'Classic Maggi loaded with melted cheese',            7000, true,  2),
  ('a0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Veg Hakka Noodles',    'Stir-fried noodles with veggies',                    9000, false, 3),
  ('a0000002-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Veg Grilled Sandwich', 'Grilled sandwich with veggies and chutney',          6000, true,  1),
  ('a0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Cheese Grilled Toast', 'Extra-cheesy grilled toast',                         8000, true,  2),
  ('a0000003-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Bread Pakora',         'Crispy fried bread pakora (2 pcs)',                  4000, true,  1),
  ('a0000003-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'French Fries',         'Salted fries with ketchup',                          9000, true,  2),
  ('a0000004-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Masala Chai',          'Hot cutting-style masala chai',                      2000, true,  1),
  ('a0000004-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'Cold Coffee',          'Chilled, frothy cold coffee',                        8000, true,  2),
  ('a0000004-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', 'Bottled Water',        '500ml',                                              2000, true,  3)
on conflict (id) do nothing;
