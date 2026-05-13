-- COSMOS  Initial schema (Section 7 of master build prompt)
-- Run in Supabase SQL editor. Order matters.
--
-- Deviation from spec: phish_cache / PhishTank integration removed
-- (PhishTank upstream unavailable). Update COSMOS_BUILD_LOG.md if reinstated.

-- 7.1 Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- 7.2 CVE Cache
CREATE TABLE IF NOT EXISTS public.cve_cache (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cve_id        TEXT NOT NULL UNIQUE,
  description   TEXT,
  cvss_score    NUMERIC(3,1),
  cvss_severity TEXT,
  cvss_version  TEXT,
  published_at  TIMESTAMPTZ,
  modified_at   TIMESTAMPTZ,
  is_kev        BOOLEAN DEFAULT false,
  kev_added_at  TIMESTAMPTZ,
  kev_action    TEXT,
  "references"  JSONB DEFAULT '[]',
  weaknesses    JSONB DEFAULT '[]',
  raw_nvd       JSONB,
  synced_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cve_published ON public.cve_cache (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_cve_severity  ON public.cve_cache (cvss_severity);
CREATE INDEX IF NOT EXISTS idx_cve_is_kev    ON public.cve_cache (is_kev);
CREATE INDEX IF NOT EXISTS idx_cve_score     ON public.cve_cache (cvss_score DESC);

-- 7.4 Intel Stats
CREATE TABLE IF NOT EXISTS public.intel_stats (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stat_key      TEXT NOT NULL UNIQUE,
  stat_value    BIGINT DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.intel_stats (stat_key, stat_value) VALUES
  ('total_cves_tracked', 0),
  ('critical_cves_24h', 0),
  ('kev_total', 0)
ON CONFLICT (stat_key) DO NOTHING;

-- 7.5 Research Posts (Phase 3)
CREATE TABLE IF NOT EXISTS public.research_posts (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  summary          TEXT,
  content          TEXT,
  category         TEXT,
  tags             TEXT[] DEFAULT '{}',
  mitre_techniques TEXT[] DEFAULT '{}',
  published        BOOLEAN DEFAULT false,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 7.6 Resources (Phase 4)
CREATE TABLE IF NOT EXISTS public.resources (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title         TEXT NOT NULL,
  url           TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  tags          TEXT[] DEFAULT '{}',
  trust_rating  INTEGER CHECK (trust_rating BETWEEN 1 AND 5),
  personal_note TEXT,
  published     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 7.7 Row Level Security
ALTER TABLE public.cve_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cve_public_read"  ON public.cve_cache;
DROP POLICY IF EXISTS "cve_admin_write"  ON public.cve_cache;
CREATE POLICY "cve_public_read"  ON public.cve_cache FOR SELECT USING (true);
CREATE POLICY "cve_admin_write"  ON public.cve_cache FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.intel_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stats_public_read" ON public.intel_stats;
DROP POLICY IF EXISTS "stats_admin_write" ON public.intel_stats;
CREATE POLICY "stats_public_read" ON public.intel_stats FOR SELECT USING (true);
CREATE POLICY "stats_admin_write" ON public.intel_stats FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.research_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "research_public_read" ON public.research_posts;
DROP POLICY IF EXISTS "research_admin_all"   ON public.research_posts;
CREATE POLICY "research_public_read" ON public.research_posts FOR SELECT USING (published = true);
CREATE POLICY "research_admin_all"   ON public.research_posts FOR ALL    USING (auth.role() = 'authenticated');

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resources_public_read" ON public.resources;
DROP POLICY IF EXISTS "resources_admin_all"   ON public.resources;
CREATE POLICY "resources_public_read" ON public.resources FOR SELECT USING (published = true);
CREATE POLICY "resources_admin_all"   ON public.resources FOR ALL    USING (auth.role() = 'authenticated');
