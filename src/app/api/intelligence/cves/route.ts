import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchCVEFeedDirect } from '@/lib/intel/direct'
import type { Severity } from '@/lib/utils/severity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const severitySchema = z.enum(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])

const querySchema = z.object({
  severity: severitySchema.optional().default('ALL'),
  kevOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export interface CVEFeedRow {
  id: string
  cve_id: string
  description: string | null
  cvss_score: number | null
  cvss_severity: Severity | null
  published_at: string | null
  is_kev: boolean
  kev_added_at: string | null
  kev_action: string | null
  references: unknown
}

export interface CVEFeedResponse {
  items: CVEFeedRow[]
  total: number
  limit: number
  offset: number
  mode: 'supabase' | 'direct'
}

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { severity, kevOnly, from, to, search, limit, offset } = parsed.data

  // Direct-NVD mode: no Supabase configured, fetch live from upstream.
  if (!supabaseConfigured()) {
    const direct = await fetchCVEFeedDirect({
      severity,
      kevOnly,
      ...(search ? { search } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      limit,
      offset,
    })
    const response: CVEFeedResponse = {
      ...direct,
      items: direct.items as unknown as CVEFeedRow[],
      mode: 'direct',
    }
    return NextResponse.json(response, {
      headers: { 'cache-control': 's-maxage=60, stale-while-revalidate=300' },
    })
  }

  try {
    const supabase = await createServerSupabaseClient()
    // Only ask Postgres for the exact count on the first page  counting
    // every paginated request was the dominant latency on `/api/intelligence/cves`.
    const wantCount = offset === 0
    const buildQuery = () => {
      let q = supabase
        .from('cve_cache')
        .select(
          'id, cve_id, description, cvss_score, cvss_severity, published_at, is_kev, kev_added_at, kev_action, references',
          wantCount ? { count: 'exact' } : undefined,
        )
        .order('published_at', { ascending: false, nullsFirst: false })

      if (severity !== 'ALL') q = q.eq('cvss_severity', severity)
      if (kevOnly) q = q.eq('is_kev', true)
      if (from) q = q.gte('published_at', from)
      if (to) q = q.lte('published_at', to)
      if (search && search.length > 0) {
        const safe = search.replace(/[%_]/g, '\\$&')
        q = q.or(`cve_id.ilike.%${safe}%,description.ilike.%${safe}%`)
      }
      return q.range(offset, offset + limit - 1)
    }

    const { data, error, count } = await buildQuery()
    const directFallback = () =>
      fetchCVEFeedDirect({
        severity,
        kevOnly,
        ...(search ? { search } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        limit,
        offset,
      })

    if (error) {
      const direct = await directFallback()
      return NextResponse.json(
        {
          ...direct,
          items: direct.items as unknown as CVEFeedRow[],
          mode: 'direct',
          degradedReason: error.message,
        },
        { headers: { 'cache-control': 's-maxage=60, stale-while-revalidate=300' } },
      )
    }

    const rows = (data ?? []) as CVEFeedRow[]
    // Supabase only stores the rolling sync window; for non-default severity
    // filters (typically MEDIUM/LOW) the cache is often sparse because
    // freshly-published CVEs ship without a final score. Fall back to
    // direct NVD so the user never sees an empty list.
    const sparse =
      rows.length === 0 &&
      (severity !== 'ALL' || kevOnly || (search?.length ?? 0) > 0)
    if ((rows.length === 0 && (count ?? 0) === 0) || sparse) {
      const direct = await directFallback()
      return NextResponse.json(
        {
          ...direct,
          items: direct.items as unknown as CVEFeedRow[],
          mode: 'direct',
        } satisfies CVEFeedResponse,
        { headers: { 'cache-control': 's-maxage=60, stale-while-revalidate=300' } },
      )
    }

    const response: CVEFeedResponse = {
      items: rows,
      total: count ?? rows.length + offset,
      limit,
      offset,
      mode: 'supabase',
    }
    return NextResponse.json(response, {
      headers: { 'cache-control': 's-maxage=30, stale-while-revalidate=120' },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
