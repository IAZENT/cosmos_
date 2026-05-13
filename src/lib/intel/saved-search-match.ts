import { z } from 'zod'
import type { SavedSearchFilters } from '@/types/saved-search'
import type { DigestCveItem } from '@/lib/email/templates'

/**
 * The Supabase client isn't generic-bound to Database here (callers pass
 * service-role *or* anon clients), so the query builder shape is too
 * polymorphic to express precisely. We accept `any` deliberately and
 * narrow the eventual row shape at the bottom of `matchSavedSearch`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any

/**
 * Zod schema for validating filter blobs coming back from the database
 * (saved_searches.filters is JSONB). Anything malformed is downgraded
 * to "match everything since last_sent" rather than blowing up the
 * digest run.
 */
export const savedSearchFiltersSchema = z.object({
  severity: z
    .enum(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO', 'NONE'])
    .default('ALL'),
  kevOnly: z.boolean().default(false),
  search: z.string().max(120).default(''),
  from: z.string().default(''),
  to: z.string().default(''),
})

export function parseFilters(raw: unknown): SavedSearchFilters {
  const result = savedSearchFiltersSchema.safeParse(raw)
  if (result.success) {
    // Cast: zod inferred type already matches but doesn't carry the
    // domain alias.
    return result.data as SavedSearchFilters
  }
  return {
    severity: 'ALL',
    kevOnly: false,
    search: '',
    from: '',
    to: '',
  }
}

const SUPPORTED_SEVERITIES = new Set([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
])

/**
 * Run a saved search against the `cve_cache` table and return the rows
 * matching it. `since` is used to bound the result to "things published
 * after the previous digest" so we don't email the same CVE twice.
 */
export async function matchSavedSearch(
  supabase: SupabaseLike,
  filters: SavedSearchFilters,
  since: Date | null,
  limit = 25,
): Promise<DigestCveItem[]> {
  let q = supabase
    .from('cve_cache')
    .select(
      'cve_id, description, cvss_score, cvss_severity, is_kev, published_at',
    )
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (filters.severity !== 'ALL' && SUPPORTED_SEVERITIES.has(filters.severity)) {
    q = q.eq('cvss_severity', filters.severity)
  }
  if (filters.kevOnly) q = q.eq('is_kev', true)
  if (since) q = q.gt('published_at', since.toISOString())
  if (filters.from) {
    const isoFrom = new Date(`${filters.from}T00:00:00Z`).toISOString()
    q = q.gte('published_at', isoFrom)
  }
  if (filters.to) {
    const isoTo = new Date(`${filters.to}T23:59:59Z`).toISOString()
    q = q.lte('published_at', isoTo)
  }
  if (filters.search.trim()) {
    const safe = filters.search.trim().replace(/[%_]/g, '\\$&')
    q = q.or(`cve_id.ilike.%${safe}%,description.ilike.%${safe}%`)
  }

  const { data, error } = await q
  if (error || !data) return []
  const rows = data as Array<{
    cve_id: string
    description: string | null
    cvss_score: number | null
    cvss_severity: string | null
    is_kev: boolean | null
    published_at: string | null
  }>
  return rows.map((r) => ({
    cveId: r.cve_id,
    description: r.description,
    cvssScore: r.cvss_score,
    cvssSeverity: r.cvss_severity,
    isKev: Boolean(r.is_kev),
    publishedAt: r.published_at,
  }))
}
