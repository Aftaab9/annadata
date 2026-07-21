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

-- Demo seed (safe to re-run — fixed UUIDs). Prices ~ Agmarknet MH Jul 2026.
-- App also auto-seeds when the table is empty.
insert into public.listings (
  id, farmer_name, crop, grade, quantity_quintals, district, state,
  price_per_quintal, mandi_modal, grade_card_id, contact, interests, farmer_id
) values
  ('a0000001-0000-4000-8000-000000000001', 'Ramesh Patil', 'Tomato', 'A', 85, 'Nashik', 'Maharashtra', 1906, 1733, 'gc-demo-tomato-a', 'ramesh@annadata.demo', 4, 'seed-demo'),
  ('a0000001-0000-4000-8000-000000000002', 'Sunita Devi', 'Maize', 'B', 140, 'Pune', 'Maharashtra', 2182, 2182, 'gc-demo-maize-b', 'sunita@annadata.demo', 2, 'seed-demo'),
  ('a0000001-0000-4000-8000-000000000003', 'FPC Solapur Collective', 'Onion', 'A', 220, 'Solapur', 'Maharashtra', 2159, 1963, 'gc-demo-onion-a', 'fpc@annadata.demo', 6, 'seed-demo'),
  ('a0000001-0000-4000-8000-000000000004', 'Kiran Jadhav', 'Potato', 'C', 70, 'Pune', 'Maharashtra', 1146, 1433, null, 'kiran@annadata.demo', 1, 'seed-demo'),
  ('a0000001-0000-4000-8000-000000000005', 'Lakshmi Farms', 'Tomato', 'B', 95, 'Bengaluru', 'Karnataka', 1733, 1733, 'gc-demo-tomato-b', 'lakshmi@annadata.demo', 3, 'seed-demo'),
  ('a0000001-0000-4000-8000-000000000006', 'Anjali More', 'Tomato', 'A', 120, 'Nashik', 'Maharashtra', 1906, 1733, 'gc-demo-tomato-a2', 'anjali@annadata.demo', 5, 'seed-demo'),
  ('a0000001-0000-4000-8000-000000000007', 'Green Valley FPC', 'Tomato', 'A', 180, 'Nashik', 'Maharashtra', 1906, 1733, 'gc-demo-tomato-a3', 'greenvalley@annadata.demo', 8, 'seed-demo'),
  ('a0000001-0000-4000-8000-000000000008', 'Vikram Singh', 'Apple', 'A', 35, 'Nashik', 'Maharashtra', 17482, 15893, 'gc-demo-apple-a', 'vikram@annadata.demo', 7, 'seed-demo'),
  ('a0000001-0000-4000-8000-000000000009', 'Meena Cooperative', 'Soybean', 'B', 200, 'Pune', 'Maharashtra', 7167, 7167, 'gc-demo-soy-b', 'meena@annadata.demo', 2, 'seed-demo'),
  ('a0000001-0000-4000-8000-00000000000a', 'Prakash Kale', 'Pepper', 'A', 28, 'Kolhapur', 'Maharashtra', 4620, 4200, 'gc-demo-pepper-a', 'prakash@annadata.demo', 3, 'seed-demo'),
  ('a0000001-0000-4000-8000-00000000000b', 'Sai Potato Growers', 'Potato', 'B', 110, 'Satara', 'Maharashtra', 1433, 1433, 'gc-demo-potato-b', 'sai@annadata.demo', 1, 'seed-demo'),
  ('a0000001-0000-4000-8000-00000000000c', 'Nashik Tomato Hub', 'Tomato', 'A', 150, 'Nashik', 'Maharashtra', 1906, 1733, 'gc-demo-tomato-a4', 'hub@annadata.demo', 9, 'seed-demo')
on conflict (id) do update set
  farmer_name = excluded.farmer_name,
  crop = excluded.crop,
  grade = excluded.grade,
  quantity_quintals = excluded.quantity_quintals,
  district = excluded.district,
  state = excluded.state,
  price_per_quintal = excluded.price_per_quintal,
  mandi_modal = excluded.mandi_modal,
  grade_card_id = excluded.grade_card_id,
  contact = excluded.contact,
  interests = excluded.interests;

