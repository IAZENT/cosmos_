-- COSMOS  Scholarship news cache.
--
-- Items are aggregated from public RSS/JSON sources by the
-- /api/sync/scholarships cron job, normalised, and de-duplicated.
-- This table is read-only from the client's perspective; mutations
-- happen exclusively via the service-role key on the server.
--
-- Country/level/funding are derived at sync-time via tag.ts and stored
-- as text arrays so the UI can filter without re-tagging on every read.

CREATE TABLE IF NOT EXISTS public.scholarship_news (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source          TEXT NOT NULL,            -- 'OpportunityDesk' | 'EURAXESS' | etc.
  source_url      TEXT NOT NULL,            -- canonical link to the original post
  external_guid   TEXT,                     -- RSS guid / EURAXESS id  used for dedup
  title           TEXT NOT NULL,
  summary         TEXT,
  countries       TEXT[] NOT NULL DEFAULT '{}',  -- ISO-ish names, e.g. {"Germany","EU"}
  levels          TEXT[] NOT NULL DEFAULT '{}',  -- {"Bachelor","Master","PhD","Postdoc"}
  funding         TEXT,                     -- 'FULL' | 'PARTIAL' | 'UNKNOWN'
  deadline_at     TIMESTAMPTZ,              -- when extractable from text
  published_at    TIMESTAMPTZ,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per source-item: the canonical URL is the dedup key. RSS
-- aggregators sometimes republish the same opportunity with different
-- titles, so we also de-dupe by title prefix in app code, but the URL
-- uniqueness here catches the common case cheaply.
CREATE UNIQUE INDEX IF NOT EXISTS uq_scholarship_news_source_url
  ON public.scholarship_news (source_url);

CREATE INDEX IF NOT EXISTS idx_scholarship_news_published_at
  ON public.scholarship_news (published_at DESC NULLS LAST);

-- GIN indexes for the array filters; without them Supabase would
-- sequential-scan the whole table on every country filter.
CREATE INDEX IF NOT EXISTS idx_scholarship_news_countries
  ON public.scholarship_news USING GIN (countries);
CREATE INDEX IF NOT EXISTS idx_scholarship_news_levels
  ON public.scholarship_news USING GIN (levels);

-- Full-text search index across title + summary for the UI search box.
CREATE INDEX IF NOT EXISTS idx_scholarship_news_search
  ON public.scholarship_news
  USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '')));

ALTER TABLE public.scholarship_news ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can read aggregated news. Writes go through the
-- service-role client, which bypasses RLS.
CREATE POLICY "scholarship_news public read"
  ON public.scholarship_news
  FOR SELECT
  TO anon, authenticated
  USING (true);
