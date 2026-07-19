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
