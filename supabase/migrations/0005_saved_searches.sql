-- COSMOS  Saved searches for CVE digest emails.
--
-- Anonymous, email-only subscriptions: no account required. Users pick
-- a filter on /intelligence, hand over an email, confirm via emailed
-- token, then receive a weekly digest of newly-matching CVEs.
--
-- RLS: ENABLED with zero policies = deny-all for anon + authenticated keys.
-- The service-role key bypasses RLS, so server route handlers and the
-- cron-protected digest job keep working unchanged. Public access to
-- this table happens exclusively through our own token-gated endpoints,
-- never via Supabase's auto-generated REST/PostgREST interface.

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email                TEXT NOT NULL,
  label                TEXT,
  filters              JSONB NOT NULL,
  verified             BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token   TEXT NOT NULL UNIQUE,
  unsubscribe_token    TEXT NOT NULL UNIQUE,
  last_sent_at         TIMESTAMPTZ,
  verified_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_email
  ON public.saved_searches (email);

-- Partial index for the digest cron: only verified rows are scanned.
CREATE INDEX IF NOT EXISTS idx_saved_searches_verified
  ON public.saved_searches (verified)
  WHERE verified = TRUE;

-- Tokens are uniformly random; lookups always equality-match them.
CREATE INDEX IF NOT EXISTS idx_saved_searches_verify_token
  ON public.saved_searches (verification_token);
CREATE INDEX IF NOT EXISTS idx_saved_searches_unsub_token
  ON public.saved_searches (unsubscribe_token);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
-- No policies defined  this is intentional. With RLS on and zero
-- policies, anon/authenticated PostgREST access is fully denied. The
-- service-role key (used server-side) bypasses RLS, so our route
-- handlers continue to read/write normally.
