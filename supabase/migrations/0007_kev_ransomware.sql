-- COSMOS  Capture CISA KEV ransomware-campaign metadata.
--
-- The KEV catalogue exposes a `knownRansomwareCampaignUse` field plus
-- vendor / product / vulnerability_name / dueDate. We were dropping all
-- of these on the floor; the /intelligence/ransomware page needs them.
--
-- Safe to re-run: every column uses IF NOT EXISTS. After applying,
-- trigger /api/sync/kev manually to backfill existing rows.

ALTER TABLE public.cve_cache
  ADD COLUMN IF NOT EXISTS kev_ransomware       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS kev_vendor_project   TEXT,
  ADD COLUMN IF NOT EXISTS kev_product          TEXT,
  ADD COLUMN IF NOT EXISTS kev_vulnerability_name TEXT,
  ADD COLUMN IF NOT EXISTS kev_due_date         TIMESTAMPTZ;

-- Partial index: ransomware-flagged rows are a small fraction of KEV
-- (~30%), so a partial index is dramatically smaller than a full one
-- and serves the /intelligence/ransomware feed in O(log n).
CREATE INDEX IF NOT EXISTS idx_cve_kev_ransomware
  ON public.cve_cache (kev_added_at DESC NULLS LAST)
  WHERE kev_ransomware = true;
