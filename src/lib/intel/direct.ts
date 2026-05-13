import { fetchNVD, normalizeNVDCve } from '@/lib/api/nvd'
import { fetchCISAKev } from '@/lib/api/cisa'
import type { Severity } from '@/lib/utils/severity'
import type { CosmosCVE } from '@/types/cve'
import type {
  KevHighlight,
  PreviewCVE,
  SeverityBreakdown,
  TickerCVE,
} from '@/lib/intel/server-data-types'
import type { IntelStats } from '@/types/intel'

const REVALIDATE_SECONDS = 5 * 60

function fromIso(d: Date): string {
  // NVD rejects the trailing Z in its date format; strip it.
  return d.toISOString().replace('Z', '')
}

function hoursAgoIso(hours: number): string {
  return fromIso(new Date(Date.now() - hours * 60 * 60 * 1000))
}

export interface DirectFeedRow {
  id: string
  cve_id: string
  description: string | null
  cvss_score: number | null
  cvss_severity: Severity | null
  published_at: string | null
  is_kev: boolean
  kev_added_at: string | null
  kev_action: string | null
  references: string[]
}

function toFeedRow(
  cve: CosmosCVE,
  kevLookup: Map<string, { dateAdded: string | null; requiredAction: string | null }>,
): DirectFeedRow {
  const kev = kevLookup.get(cve.id)
  return {
    id: cve.id,
    cve_id: cve.id,
    description: cve.description,
    cvss_score: cve.cvssScore,
    cvss_severity: cve.severity === 'NONE' ? null : cve.severity,
    published_at: cve.publishedAt,
    is_kev: cve.isKev || !!kev,
    kev_added_at: cve.kevAddedAt ?? kev?.dateAdded ?? null,
    kev_action: cve.kevAction ?? kev?.requiredAction ?? null,
    references: cve.references,
  }
}

/**
 * Fetch a slice of recent CVEs direct from NVD. When a severity is provided,
 * pushes the filter server-side via the NVD query param.
 */
export async function fetchRecentCVEsDirect(opts: {
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  limit?: number
  lookbackHours?: number
}): Promise<CosmosCVE[]> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200)
  const lookbackHours = opts.lookbackHours ?? 24 * 14 // 2 weeks default
  const res = await fetchNVD(
    {
      resultsPerPage: limit,
      startIndex: 0,
      pubStartDate: hoursAgoIso(lookbackHours),
      pubEndDate: fromIso(new Date()),
      noRejected: true,
      ...(opts.severity ? { cvssV3Severity: opts.severity } : {}),
    },
    { revalidateSeconds: REVALIDATE_SECONDS },
  )
  return res.vulnerabilities.map((v) => normalizeNVDCve(v.cve))
}

export async function fetchCriticalCountDirect(): Promise<number> {
  const res = await fetchNVD(
    {
      resultsPerPage: 1,
      pubStartDate: hoursAgoIso(24),
      pubEndDate: fromIso(new Date()),
      noRejected: true,
      cvssV3Severity: 'CRITICAL',
    },
    { revalidateSeconds: REVALIDATE_SECONDS },
  )
  return res.totalResults
}

export async function fetchTotalTrackedDirect(): Promise<number> {
  // Lightweight: ask NVD for 1 record to get the total count.
  const res = await fetchNVD(
    {
      resultsPerPage: 1,
      noRejected: true,
    },
    { revalidateSeconds: REVALIDATE_SECONDS },
  )
  return res.totalResults
}

export interface KevLookup {
  map: Map<string, { dateAdded: string | null; requiredAction: string | null; description: string | null }>
  total: number
  highlights: KevHighlight[]
}

export async function fetchKevLookupDirect(
  highlightLimit = 5,
): Promise<KevLookup> {
  try {
    const payload = await fetchCISAKev({ revalidateSeconds: REVALIDATE_SECONDS })
    const map = new Map<
      string,
      { dateAdded: string | null; requiredAction: string | null; description: string | null }
    >()
    for (const v of payload.vulnerabilities) {
      map.set(v.cveID, {
        dateAdded: v.dateAdded ?? null,
        requiredAction: v.requiredAction ?? null,
        description: v.shortDescription ?? null,
      })
    }
    // Newest KEV entries first.
    const sorted = [...payload.vulnerabilities].sort((a, b) => {
      const ad = a.dateAdded ? Date.parse(a.dateAdded) : 0
      const bd = b.dateAdded ? Date.parse(b.dateAdded) : 0
      return bd - ad
    })
    const highlights: KevHighlight[] = sorted
      .slice(0, highlightLimit)
      .map((v) => ({
        id: v.cveID,
        cveId: v.cveID,
        kevAddedAt: v.dateAdded ?? null,
        description: v.shortDescription ?? null,
        kevAction: v.requiredAction ?? null,
      }))
    return { map, total: payload.vulnerabilities.length, highlights }
  } catch {
    return { map: new Map(), total: 0, highlights: [] }
  }
}

export async function getStatsDirect(): Promise<IntelStats> {
  const [total, critical, kev] = await Promise.all([
    fetchTotalTrackedDirect().catch(() => 0),
    fetchCriticalCountDirect().catch(() => 0),
    fetchKevLookupDirect(0)
      .then((r) => r.total)
      .catch(() => 0),
  ])
  return {
    total_cves_tracked: total,
    critical_cves_24h: critical,
    kev_total: kev,
  }
}

export async function getRecentCVEsDirect(
  limit = 6,
): Promise<PreviewCVE[]> {
  const [cves, kev] = await Promise.all([
    fetchRecentCVEsDirect({ limit: Math.max(limit, 20) }).catch(
      () => [] as CosmosCVE[],
    ),
    fetchKevLookupDirect(0),
  ])
  // Prefer critical/high with most-recent first; fall back to whatever NVD gave us.
  const filtered = cves
    .filter((c) => c.severity === 'CRITICAL' || c.severity === 'HIGH')
    .slice(0, limit)
  const source = filtered.length > 0 ? filtered : cves.slice(0, limit)
  return source.map((c) => ({
    id: c.id,
    cveId: c.id,
    description: c.description,
    cvssScore: c.cvssScore,
    severity: c.severity === 'NONE' ? null : c.severity,
    publishedAt: c.publishedAt,
    isKev: c.isKev || kev.map.has(c.id),
  }))
}

export async function getTickerCVEsDirect(
  limit = 20,
): Promise<TickerCVE[]> {
  const cves = await fetchRecentCVEsDirect({ limit }).catch(
    () => [] as CosmosCVE[],
  )
  return cves.slice(0, limit).map((c) => ({
    cveId: c.id,
    severity: c.severity === 'NONE' ? null : c.severity,
    cvssScore: c.cvssScore,
  }))
}

export async function getLastSyncedAtDirect(): Promise<string | null> {
  // No sync in direct mode  return "now" as a proxy for "fresh from upstream".
  return new Date().toISOString()
}

export async function getSeverityBreakdownDirect(): Promise<SeverityBreakdown> {
  const levels: Array<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = [
    'CRITICAL',
    'HIGH',
    'MEDIUM',
    'LOW',
  ]
  try {
    const results = await Promise.all(
      levels.map((sev) =>
        fetchNVD(
          {
            resultsPerPage: 1,
            pubStartDate: hoursAgoIso(24 * 7),
            pubEndDate: fromIso(new Date()),
            noRejected: true,
            cvssV3Severity: sev,
          },
          { revalidateSeconds: REVALIDATE_SECONDS },
        ).catch(() => ({ totalResults: 0 }) as { totalResults: number }),
      ),
    )
    return {
      critical: results[0]?.totalResults ?? 0,
      high: results[1]?.totalResults ?? 0,
      medium: results[2]?.totalResults ?? 0,
      low: results[3]?.totalResults ?? 0,
    }
  } catch {
    return { critical: 0, high: 0, medium: 0, low: 0 }
  }
}

export async function fetchCVEFeedDirect(opts: {
  severity: 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  kevOnly: boolean
  search?: string
  from?: string
  to?: string
  limit: number
  offset: number
}): Promise<{
  items: DirectFeedRow[]
  total: number
  limit: number
  offset: number
}> {
  // Strategy: pull one NVD page (up to 200) starting at the requested offset.
  // NVD supports one severity filter natively. KEV / search are applied
  // client-side against the returned page.
  const resultsPerPage = Math.min(Math.max(opts.limit, 1), 200)

  // KEV-only: serve directly from CISA's catalog  KEV entries can be old,
  // and wouldn't appear inside a rolling NVD window.
  if (opts.kevOnly) {
    try {
      const payload = await fetchCISAKev({
        revalidateSeconds: REVALIDATE_SECONDS,
      })
      const allSorted = [...payload.vulnerabilities].sort((a, b) => {
        const ad = a.dateAdded ? Date.parse(a.dateAdded) : 0
        const bd = b.dateAdded ? Date.parse(b.dateAdded) : 0
        return bd - ad
      })
      const search = opts.search?.trim().toLowerCase()
      const filtered = search
        ? allSorted.filter(
            (v) =>
              v.cveID.toLowerCase().includes(search) ||
              (v.shortDescription ?? '').toLowerCase().includes(search) ||
              (v.vendorProject ?? '').toLowerCase().includes(search) ||
              (v.product ?? '').toLowerCase().includes(search) ||
              (v.vulnerabilityName ?? '').toLowerCase().includes(search),
          )
        : allSorted
      const total = filtered.length
      const page = filtered.slice(opts.offset, opts.offset + opts.limit)
      const items: DirectFeedRow[] = page.map((v) => ({
        id: v.cveID,
        cve_id: v.cveID,
        description: v.shortDescription ?? null,
        cvss_score: null,
        cvss_severity: null,
        published_at: v.dateAdded ?? null,
        is_kev: true,
        kev_added_at: v.dateAdded ?? null,
        kev_action: v.requiredAction ?? null,
        references: [],
      }))
      return { items, total, limit: opts.limit, offset: opts.offset }
    } catch {
      return { items: [], total: 0, limit: opts.limit, offset: opts.offset }
    }
  }

  // NVD's "newest first" semantics only kick in when pubStartDate+pubEndDate
  // are set. Default to the last ~120 days for ALL/CRITICAL/HIGH; widen to
  // 1y for MEDIUM/LOW where recent published rows often lack a final score
  // (Awaiting Analysis), so the feed still has substance.
  const wideLookback =
    opts.severity === 'MEDIUM' || opts.severity === 'LOW'
  const DEFAULT_LOOKBACK_DAYS = wideLookback ? 365 : 120
  const now = new Date()
  const fromIsoStr = opts.from
    ? opts.from.replace('Z', '')
    : fromIso(new Date(now.getTime() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000))
  const toIsoStr = opts.to ? opts.to.replace('Z', '') : fromIso(now)

  try {
    const [nvd, kev] = await Promise.all([
      fetchNVD(
        {
          resultsPerPage,
          startIndex: opts.offset,
          pubStartDate: fromIsoStr,
          pubEndDate: toIsoStr,
          noRejected: true,
          ...(opts.severity !== 'ALL'
            ? { cvssV3Severity: opts.severity }
            : {}),
        },
        { revalidateSeconds: REVALIDATE_SECONDS },
      ),
      fetchKevLookupDirect(0),
    ])
    let items = nvd.vulnerabilities.map((v) =>
      toFeedRow(normalizeNVDCve(v.cve), kev.map),
    )
    // When a severity filter is active, force the displayed severity to match
    // the user's request. NVD already filtered server-side on cvssV3Severity;
    // our client normalisation prefers v4, so a v4 metric can otherwise
    // disagree with the v3-based filter. Trust NVD here so the badge matches
    // the filter, and we never silently drop rows.
    if (opts.severity !== 'ALL') {
      items = items.map((r) => ({ ...r, cvss_severity: opts.severity as Severity }))
    }
    const search = opts.search?.trim().toLowerCase()
    if (search) {
      items = items.filter(
        (r) =>
          r.cve_id.toLowerCase().includes(search) ||
          (r.description ?? '').toLowerCase().includes(search),
      )
    }
    items.sort((a, b) => {
      const ad = a.published_at ? Date.parse(a.published_at) : 0
      const bd = b.published_at ? Date.parse(b.published_at) : 0
      return bd - ad
    })
    return {
      items,
      total: nvd.totalResults,
      limit: opts.limit,
      offset: opts.offset,
    }
  } catch {
    return { items: [], total: 0, limit: opts.limit, offset: opts.offset }
  }
}

