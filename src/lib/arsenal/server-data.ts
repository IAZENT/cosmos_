import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { ArsenalEntry } from '@/types/arsenal'

export interface ArsenalListFilters {
  category?: string | undefined
  platform?: string | undefined
  difficulty?: string | undefined
  use_case?: string | undefined
  q?: string | undefined
  pinned?: boolean | undefined
  publishedOnly?: boolean | undefined
  limit?: number | undefined
  offset?: number | undefined
}

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

/**
 * Reads arsenal_entries with optional filters. Always returns an array,
 * never throws  the page degrades to an empty list when Supabase is not
 * configured or the table is missing (migration 0008 not applied yet).
 */
export async function listArsenal(
  filters: ArsenalListFilters = {},
): Promise<{ entries: ArsenalEntry[]; total: number }> {
  if (!supabaseConfigured()) return { entries: [], total: 0 }

  const {
    category,
    platform,
    difficulty,
    use_case,
    q,
    pinned,
    publishedOnly = true,
    limit = 100,
    offset = 0,
  } = filters

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('arsenal_entries')
      .select('*', { count: 'exact' })

    if (publishedOnly) query = query.eq('published', true)
    if (category && category !== 'all') query = query.eq('category', category)
    if (difficulty && difficulty !== 'all')
      query = query.eq('difficulty', difficulty)
    if (use_case && use_case !== 'all') query = query.eq('use_case', use_case)
    if (platform && platform !== 'all')
      query = query.contains('platform', [platform])
    if (typeof pinned === 'boolean') query = query.eq('pinned', pinned)

    if (q && q.trim()) {
      query = query.textSearch('fts', q.trim(), {
        type: 'websearch',
        config: 'english',
      })
    }

    query = query
      .order('pinned', { ascending: false })
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) return { entries: [], total: 0 }
    return {
      entries: (data ?? []) as ArsenalEntry[],
      total: count ?? data?.length ?? 0,
    }
  } catch {
    return { entries: [], total: 0 }
  }
}

export async function listArsenalAdmin(): Promise<ArsenalEntry[]> {
  const { entries } = await listArsenal({ publishedOnly: false, limit: 500 })
  return entries
}

export async function getArsenalEntry(id: string): Promise<ArsenalEntry | null> {
  if (!supabaseConfigured()) return null
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('arsenal_entries')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    return (data as ArsenalEntry | null) ?? null
  } catch {
    return null
  }
}

export interface ArsenalCategoryCount {
  category: string
  count: number
}

export async function getArsenalCategoryCounts(): Promise<{
  total: number
  perCategory: ArsenalCategoryCount[]
}> {
  if (!supabaseConfigured()) return { total: 0, perCategory: [] }
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('arsenal_entries')
      .select('category')
      .eq('published', true)
    if (error || !data) return { total: 0, perCategory: [] }
    const counts = new Map<string, number>()
    for (const row of data as { category: string }[]) {
      counts.set(row.category, (counts.get(row.category) ?? 0) + 1)
    }
    const perCategory = Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
    return { total: data.length, perCategory }
  } catch {
    return { total: 0, perCategory: [] }
  }
}

export async function getArsenalCopyTotal(): Promise<number> {
  if (!supabaseConfigured()) return 0
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('arsenal_stats')
      .select('stat_value')
      .eq('stat_key', 'total_copies')
      .maybeSingle()
    return Number((data as { stat_value: number } | null)?.stat_value ?? 0)
  } catch {
    return 0
  }
}
