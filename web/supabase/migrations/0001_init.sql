-- BPMap initial schema.
-- Mirrors the TypeScript domain types in src/lib/types.ts.
-- The MVP UI reads from the static seed (src/data/festivals.ts); this schema is
-- the target the ingestion pipeline will populate (DATAtourisme, OpenAgenda,
-- Wikidata) so the app can switch from the seed to Supabase without UI changes.

create extension if not exists postgis;
create extension if not exists pgcrypto; -- gen_random_uuid()

-- Controlled genre vocabulary.
create table if not exists genres (
  slug  text primary key,
  label text not null
);

-- Enums wrapped so the migration can be re-run safely.
do $$ begin
  create type size_tier as enum ('S', 'M', 'L', 'XL');
exception when duplicate_object then null; end $$;

-- 'passed' is usually derived from end_date in the app, but the daily job may
-- also persist it. See the lifecycle helpers in src/lib/festivals.ts.
do $$ begin
  create type festival_status as enum ('announced', 'confirmed', 'cancelled', 'passed');
exception when duplicate_object then null; end $$;

create table if not exists festivals (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  description  text not null default '',
  start_date   date,                     -- null when "dates à confirmer"
  end_date     date,                     -- null when "dates à confirmer"
  -- Keep raw lat/lng for convenience and a generated PostGIS point for geo queries.
  lat          double precision not null,
  lng          double precision not null,
  geom         geography(Point, 4326)
                 generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,
  city         text not null,
  region       text not null,
  organizer    text,                     -- null when unknown
  capacity     integer,                  -- null when unknown
  size_tier    size_tier,                -- derived from capacity; null when unknown
  price_day    numeric(8, 2),            -- null when unknown / no day pass
  price_full   numeric(8, 2),            -- null when unknown
  currency     text not null default 'EUR',
  ticket_url   text,
  official_url text,
  image_url    text,
  status       festival_status not null default 'announced',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint festivals_dates_chk check (end_date >= start_date)
);

-- Many-to-many: festival <-> genre.
create table if not exists festival_genres (
  festival_id uuid not null references festivals(id) on delete cascade,
  genre_slug  text not null references genres(slug) on delete restrict,
  primary key (festival_id, genre_slug)
);

-- Provenance / dedup tracking: which source(s) a festival came from.
create table if not exists festival_sources (
  festival_id uuid not null references festivals(id) on delete cascade,
  source      text not null,            -- 'datatourisme' | 'openagenda' | 'wikidata' | 'manual' | ...
  source_id   text not null,            -- the id within that source
  last_seen   timestamptz not null default now(),
  raw         jsonb,                     -- original payload for re-normalisation
  primary key (source, source_id)
);

-- Indexes for the filter facets and geo queries.
create index if not exists festivals_geom_gix     on festivals using gist (geom);
create index if not exists festivals_dates_idx    on festivals (start_date, end_date);
create index if not exists festivals_size_idx     on festivals (size_tier);
create index if not exists festivals_price_idx    on festivals (price_day, price_full);
create index if not exists festival_genres_genre  on festival_genres (genre_slug);

-- Keep updated_at fresh.
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists festivals_set_updated_at on festivals;
create trigger festivals_set_updated_at
  before update on festivals
  for each row execute function set_updated_at();
