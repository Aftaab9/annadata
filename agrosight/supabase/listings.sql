-- Annadata / AgroSight — Marketplace listings (Supabase free tier)
-- Paste into: Supabase Dashboard → SQL Editor → New query → Run
-- Free, no credit card. Enables multi-device farmer ↔ buyer listings.

create extension if not exists "pgcrypto";

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  farmer_name text not null,
  crop text not null,
  grade text not null check (grade in ('A', 'B', 'C')),
  quantity_quintals numeric not null check (quantity_quintals > 0),
  district text not null,
  state text not null,
  price_per_quintal numeric not null check (price_per_quintal > 0),
  mandi_modal numeric,
  grade_card_id text,
  grade_card_json jsonb,
  contact text,
  interests integer not null default 0,
  farmer_id text,
  created_at timestamptz not null default now()
);

create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_crop_grade_idx on public.listings (crop, grade);
create index if not exists listings_state_idx on public.listings (state);

alter table public.listings enable row level security;

-- Demo policies: anon can read/write (presentation demo).
-- For production, replace with auth.uid() = farmer_id style policies.
drop policy if exists "listings_select_anon" on public.listings;
drop policy if exists "listings_insert_anon" on public.listings;
drop policy if exists "listings_update_anon" on public.listings;

create policy "listings_select_anon"
  on public.listings for select
  to anon, authenticated
  using (true);

create policy "listings_insert_anon"
  on public.listings for insert
  to anon, authenticated
  with check (true);

create policy "listings_update_anon"
  on public.listings for update
  to anon, authenticated
  using (true)
  with check (true);

-- Optional: enable Realtime for live buyer refresh
-- Dashboard → Database → Publications → supabase_realtime → add `listings`
