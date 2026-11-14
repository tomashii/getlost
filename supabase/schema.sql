-- Get Lost: schéma databáze. Spusť v Supabase → SQL Editor, potom spusť seed.sql.

create extension if not exists pgcrypto;

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null check (char_length(name) between 3 and 80),
  category text not null check (category in ('nature','view','culture','hidden','chill')),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  description text not null check (char_length(description) between 10 and 400),
  tip text check (tip is null or char_length(tip) <= 200),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists places_status_idx on public.places (status);

create table if not exists public.place_likes (
  place_id uuid not null references public.places (id) on delete cascade,
  device_id text not null check (char_length(device_id) <= 64),
  created_at timestamptz not null default now(),
  primary key (place_id, device_id)
);

alter table public.places enable row level security;
alter table public.place_likes enable row level security;

-- Kdokoliv čte jen schválená místa.
drop policy if exists "read approved places" on public.places;
create policy "read approved places" on public.places
  for select using (status = 'approved');

-- Kdokoliv může navrhnout místo, ale vždy jen jako pending.
-- Schvaluješ ručně v Table Editoru (status → approved).
drop policy if exists "suggest pending place" on public.places;
create policy "suggest pending place" on public.places
  for insert with check (status = 'pending');

-- Lajky: vkládat může kdokoliv, číst přes API nikdo (počty později přes view).
drop policy if exists "insert like" on public.place_likes;
create policy "insert like" on public.place_likes
  for insert with check (true);
