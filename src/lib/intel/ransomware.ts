import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Severity } from '@/lib/utils/severity'

export interface RansomwareRow {
  cveId: string
  description: string | null
  cvssScore: number | null
  severity: Severity | null
  kevAddedAt: string | null
  kevDueDate: string | null
  kevAction: string | null
  vendorProject: string | null
  product: string | null
  vulnerabilityName: string | null
}

export interface RansomwareSummary {
  total: number
  last30d: number
  topVendors: Array<{ vendor: string; count: number }>
  topProducts: Array<{ product: string; count: number }>
  rows: RansomwareRow[]
}

const EMPTY: RansomwareSummary = {
  total: 0,
  last30d: 0,
  topVendors: [],
  topProducts: [],
  rows: [],
}

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

/**
 * Fetch ransomware-flagged KEV entries from Supabase, plus aggregate
 * counts. Falls back to an empty summary on error / missing migration
 * so the page never crashes.
 */
export const getRansomwareSummary = cache(
  async function getRansomwareSummaryImpl(
    limit = 100,
  ): Promise<RansomwareSummary> {
    if (!supabaseConfigured()) return { ...EMPTY }
    try {
      const supabase = await createServerSupabaseClient()
      const sinceIso = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString()

      const [feed, totalRes, recentRes] = await Promise.all([
        supabase
          .from('cve_cache')
          .select(
            'cve_id, description, cvss_score, cvss_severity, kev_added_at, kev_due_date, kev_action, kev_vendor_project, kev_product, kev_vulnerability_name',
          )
          .eq('kev_ransomware', true)
          .order('kev_added_at', { ascending: false, nullsFirst: false })
          .limit(limit),
        supabase
          .from('cve_cache')
          .select('*', { count: 'exact', head: true })
          .eq('kev_ransomware', true),
        supabase
          .from('cve_cache')
          .select('*', { count: 'exact', head: true })
          .eq('kev_ransomware', true)
          .gte('kev_added_at', sinceIso),
      ])

      // Migration not yet applied  any of these queries can fail with a
      // "column does not exist" error. Treat as empty summary.
      if (feed.error || totalRes.error || recentRes.error) {
        return { ...EMPTY }
      }

      const rows = (feed.data ?? []).map(
        (r): RansomwareRow => ({
          cveId: r.cve_id as string,
          description: (r.description as string | null) ?? null,
          cvssScore: (r.cvss_score as number | null) ?? null,
          severity: (r.cvss_severity as Severity | null) ?? null,
          kevAddedAt: (r.kev_added_at as string | null) ?? null,
          kevDueDate: (r.kev_due_date as string | null) ?? null,
          kevAction: (r.kev_action as string | null) ?? null,
          vendorProject: (r.kev_vendor_project as string | null) ?? null,
          product: (r.kev_product as string | null) ?? null,
          vulnerabilityName:
            (r.kev_vulnerability_name as string | null) ?? null,
        }),
      )

      const tally = (key: 'vendorProject' | 'product') => {
        const counts = new Map<string, number>()
        for (const row of rows) {
          const v = row[key]
          if (!v) continue
          counts.set(v, (counts.get(v) ?? 0) + 1)
        }
        return Array.from(counts.entries())
          .map(([k, v]) => ({ vendor: k, product: k, count: v }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      }

      return {
        total: totalRes.count ?? 0,
        last30d: recentRes.count ?? 0,
        topVendors: tally('vendorProject').map((x) => ({
          vendor: x.vendor,
          count: x.count,
        })),
        topProducts: tally('product').map((x) => ({
          product: x.product,
          count: x.count,
        })),
        rows,
      }
    } catch {
      return { ...EMPTY }
    }
  },
)
