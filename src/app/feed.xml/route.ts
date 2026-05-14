import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRecentCVEsServer } from '@/lib/intel/server-data'
import type { PreviewCVE } from '@/lib/intel/server-data-types'

export const runtime = 'nodejs'
// 10-min server cache  feed readers (Feedly, Inoreader) typically poll
// every 30–60 min, so this is more than fresh enough.
export const revalidate = 600

const FEED_LIMIT = 50

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  )
}

interface FeedItem extends PreviewCVE {
  link: string
  updatedAt: string
}

async function loadCVEs(): Promise<FeedItem[]> {
  const base = appUrl()
  // Try a wider Supabase query first  the existing server helper caps at 6.
  // We want up to 50 items prioritising CRITICAL+HIGH+KEV in the last 30d.
  try {
    const supabase = await createServerSupabaseClient()
    const sinceIso = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString()
    const { data } = await supabase
      .from('cve_cache')
      .select(
        'id, cve_id, description, cvss_score, cvss_severity, published_at, modified_at, is_kev',
      )
      .gte('published_at', sinceIso)
      .in('cvss_severity', ['CRITICAL', 'HIGH'])
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(FEED_LIMIT)
    if (data && data.length > 0) {
      return data.map((r) => ({
        id: r.id as string,
        cveId: r.cve_id as string,
        description: (r.description as string | null) ?? null,
        cvssScore: (r.cvss_score as number | null) ?? null,
        severity: (r.cvss_severity as PreviewCVE['severity']) ?? null,
        publishedAt: (r.published_at as string | null) ?? null,
        isKev: Boolean(r.is_kev),
        link: `${base}/intelligence/cve/${r.cve_id}`,
        updatedAt:
          ((r.modified_at as string | null) ??
            (r.published_at as string | null)) ??
          new Date().toISOString(),
      }))
    }
  } catch {
    /* fall through */
  }
  // Fallback: cached server helper (smaller window, may be fewer rows).
  const recent = await getRecentCVEsServer(FEED_LIMIT).catch(() => [])
  return recent.map((c) => ({
    ...c,
    link: `${base}/intelligence/cve/${c.cveId}`,
    updatedAt: c.publishedAt ?? new Date().toISOString(),
  }))
}

function buildAtom(items: FeedItem[]): string {
  const base = appUrl()
  const updated =
    items[0]?.updatedAt ?? new Date().toISOString()
  const entries = items
    .map((item) => {
      const sev = (item.severity ?? '').toString().toUpperCase()
      const score =
        item.cvssScore != null ? ` CVSS ${item.cvssScore.toFixed(1)}` : ''
      const kev = item.isKev ? ' [KEV]' : ''
      const titleLine = `${item.cveId}${kev} ${sev ? `[${sev}]` : ''}${score}`.trim()
      const summary = (item.description ?? '').slice(0, 600)
      return `  <entry>
    <id>${escapeXml(item.link)}</id>
    <title>${escapeXml(titleLine)}</title>
    <link href="${escapeXml(item.link)}" />
    <updated>${escapeXml(item.updatedAt)}</updated>
    ${item.publishedAt ? `<published>${escapeXml(item.publishedAt)}</published>` : ''}
    ${sev ? `<category term="${escapeXml(sev)}" />` : ''}
    ${item.isKev ? `<category term="KEV" />` : ''}
    <summary type="text">${escapeXml(summary)}</summary>
  </entry>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${escapeXml(base)}/feed.xml</id>
  <title>COSMOS  Threat Intelligence Feed</title>
  <subtitle>Recent high-severity CVEs and KEV additions, normalised from NVD + CISA.</subtitle>
  <link rel="self" type="application/atom+xml" href="${escapeXml(base)}/feed.xml" />
  <link rel="alternate" type="text/html" href="${escapeXml(base)}/intelligence" />
  <updated>${escapeXml(updated)}</updated>
  <author><name>COSMOS</name></author>
  <generator uri="${escapeXml(base)}">COSMOS Platform</generator>
${entries}
</feed>
`
}

export async function GET() {
  const items = await loadCVEs()
  const xml = buildAtom(items)
  return new Response(xml, {
    headers: {
      'content-type': 'application/atom+xml; charset=utf-8',
      'cache-control': 's-maxage=600, stale-while-revalidate=1800',
    },
  })
}
