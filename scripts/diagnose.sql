-- COSMOS  paste this into your Supabase SQL editor to find out exactly
-- which of the three setup steps you've done. Run the whole block;
-- the result tells you what to fix.

-- 1. Are the tables present?
SELECT
  to_regclass('public.cve_cache')        AS cve_cache_exists,
  to_regclass('public.intel_stats')      AS intel_stats_exists,
  to_regclass('public.resources')        AS resources_exists,
  to_regclass('public.research_posts')   AS research_posts_exists;

-- 2. How many rows in each (zero = sync never ran)?
SELECT
  (SELECT count(*) FROM public.cve_cache)      AS cve_cache_rows,
  (SELECT count(*) FROM public.intel_stats)    AS intel_stats_rows,
  (SELECT count(*) FROM public.resources)      AS resources_rows,
  (SELECT count(*) FROM public.research_posts) AS research_posts_rows;

-- 3. Is the public-submit policy on `resources` present?
SELECT polname
FROM pg_policy
WHERE polrelid = 'public.resources'::regclass
  AND polname = 'resources_public_submit';

-- 4. CVSS severity breakdown (mismatched filters = severity column null/blank)
SELECT cvss_severity, count(*)
FROM public.cve_cache
GROUP BY cvss_severity
ORDER BY count(*) DESC;
