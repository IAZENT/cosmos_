import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Severity } from '@/lib/utils/severity'

/* ------------------------------------------------------------------ *
 * ISO-week helpers
 * ------------------------------------------------------------------ *
 * ISO 8601 weeks: weeks start on Monday and week 1 is the week
 * containing the year's first Thursday. Format used here is
 * `YYYY-Www` (e.g. `2026-W19`)  the same one Postgres uses with
 * `to_char(date, 'IYYY-"W"IW')`.
 */

export interface IsoWeek {
  year: number
  week: number
  /** UTC midnight Monday of the week. */
  start: Date
  /** UTC end-of-Sunday of the week. */
  end: Date
  /** Canonical `YYYY-Www` slug. */
  slug: string
}

const SLUG_RE = /^(\d{4})-W(\d{2})$/

/** Parse a `YYYY-Www` slug. Returns null if malformed or out of range. */
export function parseIsoWeekSlug(input: string): IsoWeek | null {
  const m = SLUG_RE.exec(input.trim())
  if (!m) return null
  const year = Number(m[1])
  const week = Number(m[2])
  if (!Number.isFinite(year) || year < 1970 || year > 9999) return null
  if (week < 1 || week > 53) return null
  return weekFromIsoOrdinals(year, week)
}

/**
 * Build an IsoWeek from (year, week) pair using the Monday-anchored
 * algorithm (no Date timezone surprises  every step uses UTC).
 */
export function weekFromIsoOrdinals(year: number, week: number): IsoWeek {
  // Jan 4 is always in ISO week 1.
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Dow = jan4.getUTCDay() || 7 // Sun=0 → 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Dow - 1))
  const start = new Date(week1Monday)
  start.setUTCDate(start.getUTCDate() + (week - 1) * 7)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)
  end.setUTCHours(23, 59, 59, 999)
  return {
    year,
    week,
    start,
    end,
    slug: `${year}-W${String(week).padStart(2, '0')}`,
  }
}

/** Compute the IsoWeek that contains `date` (defaults to now, UTC). */
export function isoWeekOf(date: Date = new Date()): IsoWeek {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
  // Thursday of the current week (Mon=1..Sun=7).
  const dow = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dow)
  const year = d.getUTCFullYear()
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const week =
    Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
    )
  return weekFromIsoOrdinals(year, week)
}

/** Return the IsoWeek `n` weeks before `from` (defaults to current week). */
export function previousIsoWeek(
  from: IsoWeek = isoWeekOf(),
  weeksBack = 1,
): IsoWeek {
  const anchor = new Date(from.start)
  anchor.setUTCDate(anchor.getUTCDate() - weeksBack * 7 + 3) // pick Thursday
  return isoWeekOf(anchor)
}

/** Most recent N completed weeks (excluding the current one). */
export function recentCompletedWeeks(count: number): IsoWeek[] {
  const out: IsoWeek[] = []
  let w = previousIsoWeek(isoWeekOf(), 1)
  for (let i = 0; i < count; i += 1) {
    out.push(w)
    w = previousIsoWeek(w, 1)
  }
  return out
}

/* ------------------------------------------------------------------ *
 * Digest data
 * ------------------------------------------------------------------ */

export interface DigestCveRow {
  cveId: string
  description: string | null
  cvssScore: number | null
  severity: Severity | null
  publishedAt: string | null
  isKev: boolean
}

export interface DigestSnapshot {
  week: IsoWeek
  topCritical: DigestCveRow[]
  topHigh: DigestCveRow[]
  newKev: DigestCveRow[]
  counts: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
    kev: number
  }
}

const EMPTY_COUNTS = {
  total: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  kev: 0,
}

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

/**
 * Snapshot a week's intelligence from `cve_cache`. All queries are
 * scoped to `published_at` within the week, except `newKev` which uses
 * `kev_added_at`. The top-N feeds are ranked by CVSS score so the
 * digest reads like a "biggest hits" list.
 */
export const getDigestSnapshot = cache(async function getDigestSnapshotImpl(
  week: IsoWeek,
): Promise<DigestSnapshot> {
  const empty: DigestSnapshot = {
    week,
    topCritical: [],
    topHigh: [],
    newKev: [],
    counts: { ...EMPTY_COUNTS },
  }
  if (!supabaseConfigured()) return empty

  try {
    const supabase = await createServerSupabaseClient()
    const fromIso = week.start.toISOString()
    const toIso = week.end.toISOString()

    const select =
      'cve_id, description, cvss_score, cvss_severity, published_at, is_kev'

    const [
      criticalRes,
      highRes,
      kevRes,
      totalCount,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      kevCount,
    ] = await Promise.all([
      supabase
        .from('cve_cache')
        .select(select)
        .gte('published_at', fromIso)
        .lte('published_at', toIso)
        .eq('cvss_severity', 'CRITICAL')
        .order('cvss_score', { ascending: false, nullsFirst: false })
        .limit(5),
      supabase
        .from('cve_cache')
        .select(select)
        .gte('published_at', fromIso)
        .lte('published_at', toIso)
        .eq('cvss_severity', 'HIGH')
        .order('cvss_score', { ascending: false, nullsFirst: false })
        .limit(5),
      supabase
        .from('cve_cache')
        .select(select)
        .gte('kev_added_at', fromIso)
        .lte('kev_added_at', toIso)
        .eq('is_kev', true)
        .order('kev_added_at', { ascending: false, nullsFirst: false })
        .limit(10),
      supabase
        .from('cve_cache')
        .select('*', { count: 'exact', head: true })
        .gte('published_at', fromIso)
        .lte('published_at', toIso),
      supabase
        .from('cve_cache')
        .select('*', { count: 'exact', head: true })
        .gte('published_at', fromIso)
        .lte('published_at', toIso)
        .eq('cvss_severity', 'CRITICAL'),
      supabase
        .from('cve_cache')
        .select('*', { count: 'exact', head: true })
        .gte('published_at', fromIso)
        .lte('published_at', toIso)
        .eq('cvss_severity', 'HIGH'),
      supabase
        .from('cve_cache')
        .select('*', { count: 'exact', head: true })
        .gte('published_at', fromIso)
        .lte('published_at', toIso)
        .eq('cvss_severity', 'MEDIUM'),
      supabase
        .from('cve_cache')
        .select('*', { count: 'exact', head: true })
        .gte('published_at', fromIso)
        .lte('published_at', toIso)
        .eq('cvss_severity', 'LOW'),
      supabase
        .from('cve_cache')
        .select('*', { count: 'exact', head: true })
        .gte('kev_added_at', fromIso)
        .lte('kev_added_at', toIso)
        .eq('is_kev', true),
    ])

    const map = (data: unknown): DigestCveRow[] => {
      const rows = (data as Array<Record<string, unknown>> | null) ?? []
      return rows.map((r) => ({
        cveId: r.cve_id as string,
        description: (r.description as string | null) ?? null,
        cvssScore: (r.cvss_score as number | null) ?? null,
        severity: (r.cvss_severity as Severity | null) ?? null,
        publishedAt: (r.published_at as string | null) ?? null,
        isKev: Boolean(r.is_kev),
      }))
    }

    return {
      week,
      topCritical: map(criticalRes.data),
      topHigh: map(highRes.data),
      newKev: map(kevRes.data),
      counts: {
        total: totalCount.count ?? 0,
        critical: criticalCount.count ?? 0,
        high: highCount.count ?? 0,
        medium: mediumCount.count ?? 0,
        low: lowCount.count ?? 0,
        kev: kevCount.count ?? 0,
      },
    }
  } catch {
    return empty
  }
})
