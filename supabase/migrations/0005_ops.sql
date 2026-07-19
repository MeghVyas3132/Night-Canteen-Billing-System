-- ============================================================================
-- 0005_ops.sql  —  Night Canteen (Milestone M5 — Operations v2)
-- Cash payments, store open/closed switch, and Realtime for orders + menu.
-- Run in the Supabase SQL editor after 0004_payment.sql.
-- ============================================================================

-- Payment method on orders ('upi' verified upfront, 'cash' confirmed by staff) --
alter table public.orders
  add column if not exists payment_method text
  check (payment_method in ('upi', 'cash'));

-- Store open/closed (single row) -----------------------------------------------
create table if not exists public.store_settings (
  id         int         primary key default 1 check (id = 1),
  is_open    boolean     not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid        references auth.users(id) on delete set null
);
insert into public.store_settings (id, is_open) values (1, true)
  on conflict (id) do nothing;

alter table public.store_settings enable row level security;

drop policy if exists "store_settings public read" on public.store_settings;
create policy "store_settings public read"
  on public.store_settings for select to anon, authenticated using (true);

drop policy if exists "store_settings admin update" on public.store_settings;
create policy "store_settings admin update"
  on public.store_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Realtime: publish changes for the live board (orders) + live menu (menu_items).
-- Idempotent — only add if not already in the publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'menu_items'
  ) then
    alter publication supabase_realtime add table public.menu_items;
  end if;
end $$;
