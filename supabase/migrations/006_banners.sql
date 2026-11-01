-- =====================================================================
-- Better Health — 006 Home banners
-- NOTE: this file is NOT run automatically. Run it once in the Supabase
-- SQL editor (after 001–005) before banners can appear: until then the
-- home screen simply hides the banner section and the admin banners
-- screen will show a database error.
-- Banners are NOT day-specific: every active banner shows on the home
-- screen, ordered by sort_order, with no weekday/Monday filter.
-- =====================================================================
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  link_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table banners enable row level security;

-- Same style as services in 003_rls.sql: active banners are readable by
-- anyone (patients see them on home), admin manages everything.
create policy banners_select on banners for select to anon, authenticated
  using (is_active or is_admin());
create policy banners_admin_all on banners for all to authenticated
  using (is_admin()) with check (is_admin());
