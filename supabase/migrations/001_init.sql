-- SHK Lead Scraper — Kernschema (Supabase SQL Editor ausführen)
-- Zusätzlich: discovery_state für Fortschritt der URL-Discovery

-- Tabelle 1: Rohe URLs die noch gescrapt werden müssen
create table scrape_queue (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  source text not null, -- 'gelbeseiten', 'dasoertliche', 'cylex', 'manual'
  city text,
  status text not null default 'pending',
  -- pending | processing | done | failed | duplicate | too_new | quality_fail
  created_at timestamptz default now(),
  processed_at timestamptz,
  error_msg text
);

-- Tabelle 2: Fertige qualifizierte Leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  url text unique not null,
  first_name text,
  last_name text,
  title text,
  email text,
  phone text,
  position text,
  address text,
  city text,
  state text,
  zip text,
  country text default 'Deutschland',
  branche text default 'Sanitär-, Heizungs- und Klimatechnik (SHK)',
  website_age_years int,
  quality_issues jsonb, -- Array: ["kein_https","kein_viewport","kein_analytics","kein_cookie"]
  source_url text,
  created_at timestamptz default now(),
  exported_at timestamptz
);

-- Tabelle 3: Statistiken pro Scraper-Run (für das Dashboard)
create table scraper_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz default now(),
  finished_at timestamptz,
  urls_found int default 0,
  urls_qualified int default 0,
  leads_added int default 0,
  leads_failed int default 0,
  run_type text -- 'discovery' | 'scrape'
);

-- Index für Performance
create index idx_queue_status on scrape_queue(status);
create index idx_leads_created on leads(created_at desc);
create index idx_leads_exported on leads(exported_at);

-- Discovery-Fortschritt (ein Datensatz, id = 1)
create table discovery_state (
  id int primary key default 1 check (id = 1),
  term_index int not null default 0,
  city_index int not null default 0,
  updated_at timestamptz default now()
);

insert into discovery_state (id) values (1) on conflict do nothing;
