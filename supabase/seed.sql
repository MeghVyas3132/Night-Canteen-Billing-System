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
