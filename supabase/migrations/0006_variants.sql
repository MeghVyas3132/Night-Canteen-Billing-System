-- ============================================================================
-- 0006_variants.sql  —  Night Canteen (size variants)
-- Optional per-item sizes (e.g. Small / Large). An item with variants makes the
-- customer pick one; an item with none uses its base price_paise as today.
-- Money stays INTEGER PAISE. Run after 0005_ops.sql.
-- ============================================================================

create table if not exists public.menu_item_variants (
  id           uuid        primary key default gen_random_uuid(),
  item_id      uuid        not null references public.menu_items(id) on delete cascade,
  name         text        not null,
  price_paise  int         not null check (price_paise >= 0),
  sort_order   int         not null default 0,
  is_available boolean     not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists menu_item_variants_item_idx
  on public.menu_item_variants(item_id);

-- Which variant an order line was for (nullable — most items have no variants).
alter table public.order_items
  add column if not exists variant_id uuid
  references public.menu_item_variants(id) on delete set null;

-- RLS: public read (like the menu), admin write.
alter table public.menu_item_variants enable row level security;

drop policy if exists "menu_item_variants public read" on public.menu_item_variants;
create policy "menu_item_variants public read"
  on public.menu_item_variants for select to anon, authenticated using (true);

drop policy if exists "menu_item_variants admin write" on public.menu_item_variants;
create policy "menu_item_variants admin write"
  on public.menu_item_variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Realtime so size/price changes reflect on the live menu.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'menu_item_variants'
  ) then
    alter publication supabase_realtime add table public.menu_item_variants;
  end if;
end $$;
