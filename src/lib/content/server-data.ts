import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { ResourceRow, ResearchPostRow } from '@/types/supabase'

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export async function listPublishedResources(): Promise<ResourceRow[]> {
  if (!supabaseConfigured()) return []
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
    return (data ?? []) as ResourceRow[]
  } catch {
    return []
  }
}

export async function listAllResources(): Promise<ResourceRow[]> {
  if (!supabaseConfigured()) return []
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })
    return (data ?? []) as ResourceRow[]
  } catch {
    return []
  }
}

export async function listPublishedResearch(): Promise<ResearchPostRow[]> {
  if (!supabaseConfigured()) return []
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('research_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false, nullsFirst: false })
    return (data ?? []) as ResearchPostRow[]
  } catch {
    return []
  }
}

export async function listAllResearch(): Promise<ResearchPostRow[]> {
  if (!supabaseConfigured()) return []
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('research_posts')
      .select('*')
      .order('created_at', { ascending: false })
    return (data ?? []) as ResearchPostRow[]
  } catch {
    return []
  }
}

export async function getResearchBySlug(
  slug: string,
  opts: { publishedOnly?: boolean } = { publishedOnly: true },
): Promise<ResearchPostRow | null> {
  if (!supabaseConfigured()) return null
  try {
    const supabase = await createServerSupabaseClient()
    let q = supabase
      .from('research_posts')
      .select('*')
      .eq('slug', slug)
    if (opts.publishedOnly !== false) q = q.eq('published', true)
    const { data } = await q.maybeSingle()
    return (data as ResearchPostRow | null) ?? null
  } catch {
    return null
  }
}
