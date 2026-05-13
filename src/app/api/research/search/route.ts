import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { ResearchPostRow } from '@/types/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const querySchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  category: z.string().trim().max(80).optional().default(''),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

export interface ResearchSearchResponse {
  items: ResearchPostRow[]
  mode: 'textsearch' | 'ilike' | 'none'
}

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export async function GET(request: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({
      items: [],
      mode: 'none',
    } satisfies ResearchSearchResponse)
  }
  const url = new URL(request.url)
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams),
  )
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { q, category, limit } = parsed.data

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('research_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (category) query = query.eq('category', category)

    if (q) {
      // Prefer Postgres full-text search (websearch syntax). Fall back to
      // ILIKE if `textSearch` isn't available on this client version or
      // the column has no tsvector.
      try {
        query = query.textSearch('title', q, {
          type: 'websearch',
          config: 'english',
        })
        const { data, error } = await query
        if (!error) {
          return NextResponse.json({
            items: (data ?? []) as ResearchPostRow[],
            mode: 'textsearch',
          } satisfies ResearchSearchResponse)
        }
      } catch {
        /* fall through to ILIKE */
      }

      // ILIKE fallback.
      const safe = q.replace(/[%_]/g, '\\$&')
      const { data, error } = await supabase
        .from('research_posts')
        .select('*')
        .eq('published', true)
        .or(
          `title.ilike.%${safe}%,summary.ilike.%${safe}%,content.ilike.%${safe}%`,
        )
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(limit)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({
        items: (data ?? []) as ResearchPostRow[],
        mode: 'ilike',
      } satisfies ResearchSearchResponse)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({
      items: (data ?? []) as ResearchPostRow[],
      mode: q ? 'textsearch' : 'none',
    } satisfies ResearchSearchResponse)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
