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
