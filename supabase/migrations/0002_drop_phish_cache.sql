-- COSMOS  Drop phish_cache table
--
-- Only needed on deployments that already applied the initial schema
-- with phish_cache included. The table + its RLS policies are dropped
-- because PhishTank integration has been removed (upstream unavailable).
--
-- This migration is idempotent: `DROP POLICY ... ON <table>` errors out
-- in Postgres when the table itself doesn't exist (parser resolves the
-- qualified name before `IF EXISTS` is honored). Wrap the policy drops
-- in a guard that only fires when the table is actually present.

DO $$
BEGIN
  IF to_regclass('public.phish_cache') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "phish_public_read" ON public.phish_cache';
    EXECUTE 'DROP POLICY IF EXISTS "phish_admin_write" ON public.phish_cache';
  END IF;
END $$;

DROP TABLE IF EXISTS public.phish_cache;

-- Retire the phish_urls_24h counter if present.
DELETE FROM public.intel_stats WHERE stat_key = 'phish_urls_24h';
