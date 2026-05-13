import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  SCHOLARSHIP_COUNTRIES,
  SCHOLARSHIP_LEVELS,
  type ScholarshipNewsRow,
} from '@/types/scholarship'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const querySchema = z.object({
  country: z
    .enum(['ALL', ...SCHOLARSHIP_COUNTRIES] as [string, ...string[]])
    .optional()
    .default('ALL'),
  level: z
    .enum(['ALL', ...SCHOLARSHIP_LEVELS] as [string, ...string[]])
    .optional()
    .default('ALL'),
  funding: z
    .enum(['ALL', 'FULL', 'PARTIAL', 'UNKNOWN'])
    .optional()
    .default('ALL'),
  search: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export interface ScholarshipFeedResponse {
  items: ScholarshipNewsRow[]
  total: number
  limit: number
  offset: number
  configured: boolean
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
  const { country, level, funding, search, limit, offset } = parsed.data

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
  if (!configured) {
    return NextResponse.json(
      {
        items: [],
        total: 0,
        limit,
        offset,
        configured: false,
      } satisfies ScholarshipFeedResponse,
      {
        headers: { 'cache-control': 's-maxage=60, stale-while-revalidate=300' },
      },
    )
  }

  try {
    const supabase = await createServerSupabaseClient()
    const wantCount = offset === 0
    let q = supabase
      .from('scholarship_news')
      .select(
        'id, source, source_url, external_guid, title, summary, countries, levels, funding, deadline_at, published_at, fetched_at, created_at',
        wantCount ? { count: 'exact' } : undefined,
      )
      .order('published_at', { ascending: false, nullsFirst: false })

    if (country !== 'ALL') q = q.contains('countries', [country])
    if (level !== 'ALL') q = q.contains('levels', [level])
    if (funding !== 'ALL') q = q.eq('funding', funding)
    if (search && search.length > 0) {
      const safe = search.replace(/[%_]/g, '\\$&')
      q = q.or(`title.ilike.%${safe}%,summary.ilike.%${safe}%`)
    }
    q = q.range(offset, offset + limit - 1)

    const { data, error, count } = await q
    if (error) {
      // Migration not yet applied  the table doesn't exist. Return an
      // empty feed with `configured: false` so the UI can render an
      // informative empty state instead of a scary error toast.
      const looksLikeMissingTable =
        /scholarship_news/.test(error.message) &&
        /(does not exist|could not find|schema cache)/i.test(error.message)
      if (looksLikeMissingTable) {
        return NextResponse.json(
          {
            items: [],
            total: 0,
            limit,
            offset,
            configured: false,
          } satisfies ScholarshipFeedResponse,
          {
            headers: {
              'cache-control': 's-maxage=60, stale-while-revalidate=300',
            },
          },
        )
      }
      return NextResponse.json(
        { error: `db: ${error.message}` },
        { status: 500 },
      )
    }
    const rows = (data ?? []) as unknown as ScholarshipNewsRow[]
    const response: ScholarshipFeedResponse = {
      items: rows,
      total: typeof count === 'number' ? count : rows.length,
      limit,
      offset,
      configured: true,
    }
    return NextResponse.json(response, {
      headers: { 'cache-control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 },
    )
  }
}
