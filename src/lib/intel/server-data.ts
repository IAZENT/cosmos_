import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  EMPTY_STATS,
  type IntelStats,
  type IntelStatKey,
} from '@/types/intel'
import type { Severity } from '@/lib/utils/severity'
import {
  EMPTY_VELOCITY,
  type KevHighlight,
  type PreviewCVE,
  type SeverityBreakdown,
  type ThreatVelocity,
  type TickerCVE,
} from '@/lib/intel/server-data-types'
import {
  getLastSyncedAtDirect,
  getRecentCVEsDirect,
  getSeverityBreakdownDirect,
  getStatsDirect,
  getTickerCVEsDirect,
  fetchKevLookupDirect,
} from '@/lib/intel/direct'

export {
  EMPTY_VELOCITY,
  type PreviewCVE,
  type TickerCVE,
  type KevHighlight,
  type SeverityBreakdown,
  type ThreatVelocity,
}

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

const ALLOWED_KEYS: IntelStatKey[] = [
  'total_cves_tracked',
  'critical_cves_24h',
  'kev_total',
]

/**
 * Fast variant: Supabase only, no upstream fallback. Used by the always-on
 * status bar + the cached `/api/intelligence/stats` endpoint. Returning
 * zeros is preferred over making the user wait for NVD's 30s rate-limit
 * window.
 */
export const getIntelStatsServer = cache(async function getIntelStatsServerImpl(): Promise<IntelStats> {
  if (!supabaseConfigured()) return { ...EMPTY_STATS }
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('intel_stats')
      .select('stat_key, stat_value')
    const stats: IntelStats = { ...EMPTY_STATS }
    for (const row of data ?? []) {
      const key = row.stat_key as IntelStatKey
      if (ALLOWED_KEYS.includes(key)) {
        stats[key] = Number(row.stat_value ?? 0)
      }
    }
    return stats
  } catch {
    return { ...EMPTY_STATS }
  }
})

/**
 * Slow variant: tries Supabase first, then falls through to NVD/CISA when
 * the cache is unconfigured/empty. Use sparingly  typically only for the
 * homepage hero stat counter where the user has actively asked to see
 * intelligence numbers.
 */
export async function getIntelStatsLive(): Promise<IntelStats> {
  const cached = await getIntelStatsServer()
  const allZero =
    cached.total_cves_tracked === 0 &&
    cached.critical_cves_24h === 0 &&
    cached.kev_total === 0
  if (!allZero) return cached
  return getStatsDirect().catch(() => cached)
}

export const getRecentCVEsServer = cache(async function getRecentCVEsServerImpl(
  limit = 6,
): Promise<PreviewCVE[]> {
  if (!supabaseConfigured()) {
    return getRecentCVEsDirect(limit).catch(() => [])
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('cve_cache')
      .select(
        'id, cve_id, description, cvss_score, cvss_severity, published_at, is_kev',
      )
      .in('cvss_severity', ['CRITICAL', 'HIGH'])
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit)
    const rows = (data ?? []).map((r) => ({
      id: r.id as string,
      cveId: r.cve_id as string,
      description: (r.description as string | null) ?? null,
      cvssScore: (r.cvss_score as number | null) ?? null,
      severity: (r.cvss_severity as Severity | null) ?? null,
      publishedAt: (r.published_at as string | null) ?? null,
      isKev: Boolean(r.is_kev),
    }))
    if (rows.length === 0) {
      return getRecentCVEsDirect(limit).catch(() => [])
    }
    return rows
  } catch {
    return getRecentCVEsDirect(limit).catch(() => [])
  }
})

export const getTickerCVEsServer = cache(async function getTickerCVEsServerImpl(
  limit = 20,
): Promise<TickerCVE[]> {
  if (!supabaseConfigured()) {
    return getTickerCVEsDirect(limit).catch(() => [])
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('cve_cache')
      .select('cve_id, cvss_severity, cvss_score, published_at')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit)
    const rows = (data ?? []).map((r) => ({
      cveId: r.cve_id as string,
      severity: (r.cvss_severity as Severity | null) ?? null,
      cvssScore: (r.cvss_score as number | null) ?? null,
    }))
    if (rows.length === 0) {
      return getTickerCVEsDirect(limit).catch(() => [])
    }
    return rows
  } catch {
    return getTickerCVEsDirect(limit).catch(() => [])
  }
})

export const getKevHighlightsServer = cache(async function getKevHighlightsServerImpl(
  limit = 5,
): Promise<KevHighlight[]> {
  if (!supabaseConfigured()) {
    return fetchKevLookupDirect(limit)
      .then((r) => r.highlights)
      .catch(() => [])
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('cve_cache')
      .select('id, cve_id, kev_added_at, description, kev_action')
      .eq('is_kev', true)
      .order('kev_added_at', { ascending: false, nullsFirst: false })
      .limit(limit)
    const rows = (data ?? []).map((r) => ({
      id: r.id as string,
      cveId: r.cve_id as string,
      kevAddedAt: (r.kev_added_at as string | null) ?? null,
      description: (r.description as string | null) ?? null,
      kevAction: (r.kev_action as string | null) ?? null,
    }))
    if (rows.length === 0) {
      return fetchKevLookupDirect(limit)
        .then((r) => r.highlights)
        .catch(() => [])
    }
    return rows
  } catch {
    return fetchKevLookupDirect(limit)
      .then((r) => r.highlights)
      .catch(() => [])
  }
})

export const getLastSyncedAtServer = cache(async function getLastSyncedAtServerImpl(): Promise<string | null> {
  if (!supabaseConfigured()) {
    return getLastSyncedAtDirect()
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('cve_cache')
      .select('synced_at')
      .order('synced_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()
    return (data?.synced_at as string | null) ?? null
  } catch {
    return null
  }
})

/**
 * Compute the current CVE publish-rate vs. the trailing 7-day baseline.
 * Two cheap `count: 'exact', head: true` queries on the indexed
 * `published_at` column  no row data transferred.
 */
export const getThreatVelocityServer = cache(async function getThreatVelocityServerImpl(): Promise<ThreatVelocity> {
  if (!supabaseConfigured()) {
    return { ...EMPTY_VELOCITY, computedAt: new Date().toISOString() }
  }
  try {
    const supabase = await createServerSupabaseClient()
    const now = Date.now()
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [{ count: lastHour }, { count: lastWeek }] = await Promise.all([
      supabase
        .from('cve_cache')
        .select('*', { count: 'exact', head: true })
        .gte('published_at', oneHourAgo),
      supabase
        .from('cve_cache')
        .select('*', { count: 'exact', head: true })
        .gte('published_at', sevenDaysAgo),
    ])

    const ratePerHour = lastHour ?? 0
    const baseline7dPerHour = (lastWeek ?? 0) / (7 * 24)
    const deltaPct =
      baseline7dPerHour > 0
        ? ((ratePerHour - baseline7dPerHour) / baseline7dPerHour) * 100
        : 0
    // "Elevated" requires both a sizeable absolute increase (>= 3 CVEs/hr) and
    // a >50% relative jump  filters out noisy late-night windows where a
    // single extra publish doubles the rate from 1 to 2.
    const elevated = ratePerHour >= 3 && deltaPct >= 50
    return {
      ratePerHour,
      baseline7dPerHour: Math.round(baseline7dPerHour * 10) / 10,
      deltaPct: Math.round(deltaPct),
      elevated,
      computedAt: new Date().toISOString(),
    }
  } catch {
    return { ...EMPTY_VELOCITY, computedAt: new Date().toISOString() }
  }
})

export const getSeverityBreakdownServer = cache(async function getSeverityBreakdownServerImpl(): Promise<SeverityBreakdown> {
  const empty: SeverityBreakdown = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }
  if (!supabaseConfigured()) {
    return getSeverityBreakdownDirect().catch(() => empty)
  }
  try {
    const supabase = await createServerSupabaseClient()
    // We previously tried a single column scan + in-memory tally  that
    // version was wrong: PostgREST caps un-paginated SELECTs at the
    // project's `db.max_rows` (1000 by default), so the breakdown silently
    // undercounted on any cache larger than that and was inconsistent
    // across runs. Use 4 parallel `count: 'exact', head: true` queries:
    // they're tiny (no rows transferred), run on the indexed
    // `cvss_severity` column, and always reflect the full table.
    const labels: Array<keyof SeverityBreakdown> = [
      'critical',
      'high',
      'medium',
      'low',
    ]
    const sql: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    const counts = await Promise.all(
      sql.map((sev) =>
        supabase
          .from('cve_cache')
          .select('*', { count: 'exact', head: true })
          .eq('cvss_severity', sev),
      ),
    )

    const result: SeverityBreakdown = { ...empty }
    for (let i = 0; i < labels.length; i += 1) {
      const key = labels[i]
      const row = counts[i]
      if (key && row && !row.error) result[key] = row.count ?? 0
    }

    const allZero =
      result.critical === 0 &&
      result.high === 0 &&
      result.medium === 0 &&
      result.low === 0
    if (allZero) {
      return getSeverityBreakdownDirect().catch(() => result)
    }
    return result
  } catch {
    return getSeverityBreakdownDirect().catch(() => empty)
  }
})
