-- COSMOS  allow anonymous users to submit resource drafts.
--
-- The existing `resources_public_read` policy restricts SELECT to
-- `published = true`. This migration adds an INSERT policy for anon
-- that *only* permits rows with `published = false`. Admins still
-- publish via the service-role path.

DROP POLICY IF EXISTS "resources_public_submit" ON public.resources;
CREATE POLICY "resources_public_submit" ON public.resources
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (published = false);
