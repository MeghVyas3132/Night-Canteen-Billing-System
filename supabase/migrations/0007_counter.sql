-- ============================================================================
-- 0007_counter.sql  —  Night Canteen (staff-side counter billing)
-- Tags where an order came from so staff can bill walk-up/verbal customers who
-- don't scan the QR. Run after 0006_variants.sql.
-- ============================================================================

alter table public.orders
  add column if not exists source text not null default 'qr'
  check (source in ('qr', 'counter'));
