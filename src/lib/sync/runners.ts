import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { fetchCISAKev } from '@/lib/api/cisa'
import { fetchNVD, normalizeNVDCve, sleep } from '@/lib/api/nvd'
import { supabaseConfigured } from '@/lib/api/sync-auth'
import type { SyncResult } from '@/types/intel'

const CVE_PAGE_SIZE = 2000
// Tuned for an NVD API key holder. Without a key NVD throttles to 5
// req/30s, so 30 pages would take ~3 min  operators on the free tier
// should drop CVE_MAX_PAGES to ~5 via env.
const CVE_MAX_PAGES = Number(process.env.CVE_SYNC_MAX_PAGES ?? 30)
// Default rolling window: 30 days. NVD's `pubStartDate` filter accepts
// up to 120 days, so this still leaves headroom for backfills via env.
const CVE_LOOKBACK_HOURS = Number(
  process.env.CVE_SYNC_LOOKBACK_HOURS ?? 24 * 30,
)

function isoHoursAgo(hours: number): string {
  const d = new Date(Date.now() - hours * 60 * 60 * 1000)
  return d.toISOString().replace('Z', '')
}

export type SyncRunError = {
  code: 'missing_config'
  message: string
}

export type SyncRunOutcome =
  | { ok: true; result: SyncResult }
  | { ok: false; error: SyncRunError }

/**
 * Sync the last `CVE_LOOKBACK_HOURS` of CVEs from NVD into Supabase.
 * Returns either a SyncResult (even if partial  errors[] will be populated)
 * or a config error when required env is missing.
 */
export async function runCveSync(): Promise<SyncRunOutcome> {
  if (!supabaseConfigured()) {
    return {
      ok: false,
      error: {
        code: 'missing_config',
        message: 'Supabase service role not configured.',
      },
    }
  }

  const started = Date.now()
  const errors: string[] = []
  let synced = 0

  const pubStartDate = isoHoursAgo(CVE_LOOKBACK_HOURS)
  const pubEndDate = new Date().toISOString().replace('Z', '')
  const hasKey = Boolean(process.env.NVD_API_KEY)
  const rateLimitMs = hasKey ? 1100 : 6100

  let supabase
  try {
    supabase = createServiceRoleClient()
  } catch (err) {
    return {
      ok: false,
      error: {
        code: 'missing_config',
        message:
          err instanceof Error ? err.message : 'Supabase client failed',
      },
    }
  }

  for (let page = 0; page < CVE_MAX_PAGES; page += 1) {
    try {
      const startIndex = page * CVE_PAGE_SIZE
      const payload = await fetchNVD(
        {
          resultsPerPage: CVE_PAGE_SIZE,
          startIndex,
          pubStartDate,
          pubEndDate,
          noRejected: true,
        },
        // Sync pages are large (up to 2000 CVEs each) so the response can
        // take 10–30s on a cold NVD edge. The default 3.5s page-render
        // timeout would abort here  give bulk sync 60s headroom.
        { timeoutMs: 60_000 },
      )

      const normalized = payload.vulnerabilities.map((v) =>
        normalizeNVDCve(v.cve),
      )
      if (normalized.length === 0) break

      const rows = normalized.map((n, idx) => ({
        cve_id: n.id,
        description: n.description,
        cvss_score: n.cvssScore,
        cvss_severity: n.severity === 'NONE' ? null : n.severity,
        cvss_version: n.cvssVersion,
        published_at: n.publishedAt,
        modified_at: n.modifiedAt,
        is_kev: n.isKev,
        kev_added_at: n.kevAddedAt,
        kev_action: n.kevAction,
        references: n.references,
        weaknesses: n.weaknesses,
        raw_nvd: payload.vulnerabilities[idx]?.cve ?? null,
        synced_at: new Date().toISOString(),
      }))

      const { error: upsertErr } = await supabase
        .from('cve_cache')
        .upsert(rows, { onConflict: 'cve_id' })

      if (upsertErr) {
        errors.push(`page ${page}: ${upsertErr.message}`)
      } else {
        synced += rows.length
      }

      const hasMore =
        payload.totalResults > startIndex + payload.resultsPerPage &&
        payload.resultsPerPage > 0
      if (!hasMore) break

      await sleep(rateLimitMs)
    } catch (err) {
      if (err instanceof z.ZodError) {
        errors.push(`zod: ${err.issues.map((i) => i.message).join('; ')}`)
      } else if (err instanceof Error) {
        errors.push(err.message)
      } else {
        errors.push('unknown error')
      }
      break
    }
  }

  try {
    const sinceIso = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString()
    const [
      { count: totalCount },
      { count: criticalCount },
      { count: kevCount },
    ] = await Promise.all([
      supabase.from('cve_cache').select('*', { count: 'exact', head: true }),
      supabase
        .from('cve_cache')
        .select('*', { count: 'exact', head: true })
        .eq('cvss_severity', 'CRITICAL')
        .gte('published_at', sinceIso),
      supabase
        .from('cve_cache')
        .select('*', { count: 'exact', head: true })
        .eq('is_kev', true),
    ])

    await supabase.from('intel_stats').upsert(
      [
        { stat_key: 'total_cves_tracked', stat_value: totalCount ?? 0 },
        { stat_key: 'critical_cves_24h', stat_value: criticalCount ?? 0 },
        { stat_key: 'kev_total', stat_value: kevCount ?? 0 },
      ],
      { onConflict: 'stat_key' },
    )
  } catch (err) {
    errors.push(
      `stats update failed: ${
        err instanceof Error ? err.message : 'unknown'
      }`,
    )
  }

  return {
    ok: true,
    result: { synced, errors, durationMs: Date.now() - started },
  }
}

/**
 * Pull the full CISA KEV catalogue and upsert into cve_cache.
 * Refreshes the `kev_total` stat counter.
 */
export async function runKevSync(): Promise<SyncRunOutcome> {
  if (!supabaseConfigured()) {
    return {
      ok: false,
      error: {
        code: 'missing_config',
        message: 'Supabase service role not configured.',
      },
    }
  }

  const started = Date.now()
  const errors: string[] = []
  let synced = 0

  let supabase
  try {
    supabase = createServiceRoleClient()
  } catch (err) {
    return {
      ok: false,
      error: {
        code: 'missing_config',
        message:
          err instanceof Error ? err.message : 'Supabase client failed',
      },
    }
  }

  try {
    const payload = await fetchCISAKev()
    const rows = payload.vulnerabilities.map((item) => ({
      cve_id: item.cveID,
      description: item.shortDescription ?? null,
      is_kev: true,
      kev_added_at: item.dateAdded ?? null,
      kev_action: item.requiredAction ?? null,
      synced_at: new Date().toISOString(),
    }))

    const { error: upsertErr } = await supabase
      .from('cve_cache')
      .upsert(rows, { onConflict: 'cve_id', ignoreDuplicates: false })

    if (upsertErr) errors.push(upsertErr.message)
    else synced = rows.length

    const { count } = await supabase
      .from('cve_cache')
      .select('*', { count: 'exact', head: true })
      .eq('is_kev', true)

    await supabase.from('intel_stats').upsert(
      [{ stat_key: 'kev_total', stat_value: count ?? rows.length }],
      { onConflict: 'stat_key' },
    )
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'unknown error')
  }

  return {
    ok: true,
    result: { synced, errors, durationMs: Date.now() - started },
  }
}
