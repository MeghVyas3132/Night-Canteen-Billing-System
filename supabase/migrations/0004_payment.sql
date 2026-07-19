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
