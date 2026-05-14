import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const querySchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  limit: z.coerce.number().int().min(1).max(20).optional().default(8),
})

export type SearchKind =
  | 'cve'
  | 'research'
  | 'scholarship'
  | 'arsenal'
  | 'resource'
  | 'page'
  | 'tool'

export interface SearchHit {
  kind: SearchKind
  id: string
  title: string
  subtitle?: string | null
  href: string
}

export interface SearchResponse {
  hits: SearchHit[]
}

/**
 * Static surface area  these are always returned regardless of `q` and
 * filtered client-side by `cmdk`'s built-in fuzzy match. Keeping them in
 * the payload (rather than only client-side) lets the API stay the
 * single source of truth for the palette.
 */
const STATIC_HITS: SearchHit[] = [
  { kind: 'page', id: 'p:home', title: 'Home', href: '/' },
  {
    kind: 'page',
    id: 'p:intelligence',
    title: 'Intelligence',
    subtitle: 'Live CVE feed',
    href: '/intelligence',
  },
  {
    kind: 'page',
    id: 'p:ransomware',
    title: 'Ransomware Tracker',
    subtitle: 'KEV ransomware-flagged CVEs',
    href: '/intelligence/ransomware',
  },
  {
    kind: 'page',
    id: 'p:digest',
    title: 'Weekly Digest',
    subtitle: 'Per-week threat summaries',
    href: '/digest',
  },
  {
    kind: 'page',
    id: 'p:news',
    title: 'News',
    subtitle: 'Threat intel + Nepal cyber wires',
    href: '/news',
  },
  {
    kind: 'page',
    id: 'p:scholarships',
    title: 'Scholarships',
    href: '/scholarships',
  },
  {
    kind: 'page',
    id: 'p:research',
    title: 'Writings',
    subtitle: 'Notes, writeups, and analysis',
    href: '/research',
  },
  {
    kind: 'page',
    id: 'p:about',
    title: 'About',
    subtitle: 'Operator profile',
    href: '/about',
  },
  {
    kind: 'page',
    id: 'p:resources',
    title: 'Resources',
    href: '/resources',
  },
  {
    kind: 'page',
    id: 'p:arsenal',
    title: 'Arsenal',
    subtitle: 'Operator commands & playbooks',
    href: '/arsenal',
  },
  { kind: 'tool', id: 't:tools', title: 'Tools index', href: '/tools' },
  { kind: 'tool', id: 't:jwt', title: 'JWT decoder', href: '/tools/jwt' },
  { kind: 'tool', id: 't:base64', title: 'Base64', href: '/tools/base64' },
  { kind: 'tool', id: 't:url', title: 'URL encode/decode', href: '/tools/url' },
  { kind: 'tool', id: 't:hash', title: 'Hash generator', href: '/tools/hash' },
  { kind: 'tool', id: 't:cvss', title: 'CVSS calculator', href: '/tools/cvss' },
  {
    kind: 'tool',
    id: 't:lookup',
    title: 'CVE / IP / domain lookup',
    href: '/tools/lookup',
  },
  {
    kind: 'page',
    id: 'p:feed',
    title: 'Atom feed',
    subtitle: '/feed.xml',
    href: '/feed.xml',
  },
]

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
  const { q, limit } = parsed.data

  // Empty query: surface only the static catalog so the palette is
  // useful "out of the gate" without a network round-trip per keystroke.
  if (!q || q.length < 2) {
    return NextResponse.json(
      { hits: STATIC_HITS } satisfies SearchResponse,
      { headers: { 'cache-control': 's-maxage=300, stale-while-revalidate=600' } },
    )
  }

  if (!supabaseConfigured()) {
    return NextResponse.json(
      { hits: STATIC_HITS } satisfies SearchResponse,
      { headers: { 'cache-control': 's-maxage=60' } },
    )
  }

  const safe = q.replace(/[%_]/g, '\\$&')
  const hits: SearchHit[] = [...STATIC_HITS]

  try {
    const supabase = await createServerSupabaseClient()
    const [cveRes, researchRes, scholarshipRes, arsenalRes, resourceRes] =
      await Promise.all([
        supabase
          .from('cve_cache')
          .select('cve_id, cvss_severity, description')
          .or(`cve_id.ilike.%${safe}%,description.ilike.%${safe}%`)
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(limit),
        // Research: search title + summary + body content so that
        // typing a phrase that only appears mid-article still surfaces
        // the post. Body matches will be deep-linked with
        // `?highlight=<q>` so the detail page scrolls to and marks the
        // first occurrence.
        supabase
          .from('research_posts')
          .select('slug, title, summary, content')
          .eq('published', true)
          .or(
            `title.ilike.%${safe}%,summary.ilike.%${safe}%,content.ilike.%${safe}%`,
          )
          .limit(limit),
        supabase
          .from('scholarship_news')
          .select('id, title, source')
          .or(`title.ilike.%${safe}%,summary.ilike.%${safe}%`)
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(limit),
        // Arsenal: search title / description / command / mitre id so that
        // typing e.g. "nmap", "T1046", or "subdomain" surfaces the right
        // playbook entry. Only published rows are returned (RLS would
        // enforce this anyway, but we belt-and-brace it here).
        supabase
          .from('arsenal_entries')
          .select('id, title, description, category, difficulty')
          .eq('published', true)
          .or(
            `title.ilike.%${safe}%,description.ilike.%${safe}%,command.ilike.%${safe}%,mitre_id.ilike.%${safe}%`,
          )
          .order('pinned', { ascending: false })
          .order('usage_count', { ascending: false })
          .limit(limit),
        supabase
          .from('resources')
          .select('id, title, summary, category, url')
          .eq('published', true)
          .or(`title.ilike.%${safe}%,summary.ilike.%${safe}%`)
          .limit(limit),
      ])

    for (const row of cveRes.data ?? []) {
      const cveId = row.cve_id as string
      const severity = (row.cvss_severity as string | null) ?? null
      hits.push({
        kind: 'cve',
        id: `cve:${cveId}`,
        title: cveId,
        subtitle:
          [severity, ((row.description as string | null) ?? '').slice(0, 80)]
            .filter(Boolean)
            .join('  ') || null,
        href: `/intelligence/cve/${cveId}`,
      })
    }

    for (const row of researchRes.data ?? []) {
      const slug = row.slug as string
      const title = (row.title as string) ?? slug
      const summary = (row.summary as string | null) ?? null
      const content = (row.content as string | null) ?? null
      // Detect body-only match: the query doesn't appear in title or
      // summary but does appear in content. If so, attach the
      // `?highlight=` deep-link AND surface a 80-char excerpt around
      // the first occurrence so the palette previews the match.
      const lq = q.toLowerCase()
      const inHeader =
        title.toLowerCase().includes(lq) ||
        (summary ?? '').toLowerCase().includes(lq)
      let subtitle: string | null = summary
      let href = `/research/${slug}`
      if (!inHeader && content) {
        const idx = content.toLowerCase().indexOf(lq)
        if (idx >= 0) {
          const start = Math.max(0, idx - 30)
          const end = Math.min(content.length, idx + lq.length + 50)
          const snippet =
            (start > 0 ? '…' : '') +
            content.slice(start, end).replace(/\s+/g, ' ').trim() +
            (end < content.length ? '…' : '')
          subtitle = snippet
          href = `/research/${slug}?highlight=${encodeURIComponent(q)}`
        }
      }
      hits.push({
        kind: 'research',
        id: `research:${slug}`,
        title,
        subtitle,
        href,
      })
    }

    for (const row of scholarshipRes.data ?? []) {
      const id = row.id as string
      hits.push({
        kind: 'scholarship',
        id: `scholarship:${id}`,
        title: (row.title as string) ?? '(untitled)',
        subtitle: (row.source as string | null) ?? null,
        href: '/scholarships',
      })
    }

    for (const row of arsenalRes.data ?? []) {
      const id = row.id as string
      const cat = (row.category as string | null) ?? null
      const diff = (row.difficulty as string | null) ?? null
      hits.push({
        kind: 'arsenal',
        id: `arsenal:${id}`,
        title: (row.title as string) ?? '(untitled)',
        subtitle:
          [cat, diff, ((row.description as string | null) ?? '').slice(0, 60)]
            .filter(Boolean)
            .join(' · ') || null,
        // Deep-link the /arsenal page with a query that pre-fills the
        // search input so the user lands directly on this entry.
        href: `/arsenal?q=${encodeURIComponent((row.title as string) ?? '')}`,
      })
    }

    for (const row of resourceRes.data ?? []) {
      const id = row.id as string
      hits.push({
        kind: 'resource',
        id: `resource:${id}`,
        title: (row.title as string) ?? '(untitled)',
        subtitle:
          ((row.category as string | null) ?? null) ??
          ((row.summary as string | null) ?? null),
        href: '/resources',
      })
    }
  } catch {
    /* fall back to whatever we have so far */
  }

  return NextResponse.json(
    { hits } satisfies SearchResponse,
    { headers: { 'cache-control': 's-maxage=30, stale-while-revalidate=120' } },
  )
}
