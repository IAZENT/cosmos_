-- COSMOS  Enable Postgres full-text search on research_posts.
--
-- Adds a generated tsvector column (title + summary + content, weighted)
-- and a GIN index. The /api/research/search route uses websearch_to_tsquery
-- via supabase-js textSearch().

ALTER TABLE public.research_posts
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_research_search_tsv
  ON public.research_posts USING GIN (search_tsv);
