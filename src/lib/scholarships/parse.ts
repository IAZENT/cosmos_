/**
 * Lightweight RSS 2.0 + EURAXESS parsers. We deliberately avoid pulling
 * in a full XML parser dependency: the only formats we accept here are
 * (a) RSS 2.0 (regular, easy to slice) and (b) EURAXESS JSON. If we ever
 * need real XML parsing for a more complex source, swap to fast-xml-parser.
 *
 * The parser is intentionally permissive: malformed-but-recognisable
 * items are kept; unrecoverable items are dropped. We never throw on a
 * single bad item  one ugly post shouldn't kill the whole sync.
 */

export interface RawNewsItem {
  source: string
  sourceUrl: string // canonical link to the post
  externalGuid: string | null
  title: string
  summary: string | null
  publishedAt: string | null // ISO
}

const FETCH_TIMEOUT_MS = 12_000
// Several sources (Studying-in-Germany, some Cloudflare-fronted feeds)
// reject obvious bot UAs with a 405. Presenting as a recent Chrome on
// Linux gets us through the WAF without lying about who we are  RSS
// is public data; the User-Agent string is purely a courtesy header.
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/* ------------------------------------------------------------------ *
 * Tiny extractor helpers
 * ------------------------------------------------------------------ */

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 10)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    )
}

function stripHtml(s: string): string {
  return decodeEntities(
    s
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}

function getTagContent(block: string, tag: string): string | null {
  // Match either CDATA-wrapped content or plain inner text. Greedy on
  // the inner so a CDATA section with embedded ">" survives intact.
  const re = new RegExp(
    `<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*</${tag}>`,
    'i',
  )
  const m = block.match(re)
  if (!m) return null
  return (m[1] ?? m[2] ?? '').trim()
}

function parseDateLoose(raw: string | null): string | null {
  if (!raw) return null
  const t = Date.parse(raw)
  if (Number.isNaN(t)) return null
  return new Date(t).toISOString()
}

/* ------------------------------------------------------------------ *
 * RSS 2.0
 * ------------------------------------------------------------------ */

export function parseRss(xml: string, sourceName: string): RawNewsItem[] {
  const items: RawNewsItem[] = []
  // Iterate all <item>…</item> blocks. Greedy-but-non-overlapping.
  const itemRe = /<item[\s>][\s\S]*?<\/item>/gi
  const blocks = xml.match(itemRe) ?? []
  for (const block of blocks) {
    try {
      const title = getTagContent(block, 'title')
      const link = getTagContent(block, 'link')
      const description =
        getTagContent(block, 'description') ??
        getTagContent(block, 'content:encoded')
      const guid = getTagContent(block, 'guid')
      const pubDate = getTagContent(block, 'pubDate')
      if (!title || !link) continue

      const cleanLink = stripHtml(link)
      // Some feeds put HTML inside <link>  if so, trust the first URL.
      const urlMatch = cleanLink.match(/https?:\/\/[^\s"'<>]+/)
      const sourceUrl = urlMatch ? urlMatch[0] : cleanLink
      if (!sourceUrl.startsWith('http')) continue

      items.push({
        source: sourceName,
        sourceUrl,
        externalGuid: guid ? stripHtml(guid).slice(0, 256) : null,
        title: stripHtml(title).slice(0, 500),
        summary: description ? stripHtml(description).slice(0, 800) : null,
        publishedAt: parseDateLoose(pubDate),
      })
    } catch {
      // Don't let one busted item poison the whole feed.
    }
  }
  return items
}

/* ------------------------------------------------------------------ *
 * Generic fetcher with timeout
 * ------------------------------------------------------------------ */

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept:
          'application/rss+xml, application/xml, text/xml, application/atom+xml, */*;q=0.5',
      },
      // Server-side only  no caching at the fetch layer; the sync job
      // controls cadence.
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`fetch ${url} -> ${res.status}`)
    }
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}

export async function fetchRssSource(
  name: string,
  url: string,
): Promise<{ items: RawNewsItem[]; error?: string }> {
  try {
    const xml = await fetchText(url)
    return { items: parseRss(xml, name) }
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : 'unknown rss error',
    }
  }
}

/* ------------------------------------------------------------------ *
 * EURAXESS  EU researcher mobility portal.
 *
 * They expose a public Drupal-backed JSON search endpoint. The contract
 * is undocumented but stable since 2021: the `view_display_id` of
 * `block_2` returns the funding/jobs feed used on euraxess.ec.europa.eu.
 *
 * If the endpoint shape ever changes we'll see it as zero items + an
 * error in sync logs, not a crash.
 * ------------------------------------------------------------------ */

interface EuraxessRawItem {
  title?: { processed?: string } | string
  field_research_area?: unknown
  body?: { processed?: string; summary?: string } | string
  field_application_deadline?: { value?: string } | string
  created?: string
  changed?: string
  view_node?: string // canonical URL
  field_organisation_name?: { processed?: string } | string
}

function pickText(
  v: { processed?: string; summary?: string } | string | undefined,
): string | null {
  if (!v) return null
  if (typeof v === 'string') return stripHtml(v)
  return stripHtml(v.processed ?? v.summary ?? '')
}

export async function fetchEuraxess(): Promise<{
  items: RawNewsItem[]
  error?: string
}> {
  // Tighter scope = fewer false-positives. We ask only for funding
  // (grants/fellowships); job postings are out of scope for a
  // scholarship feed.
  const url =
    'https://euraxess.ec.europa.eu/jsonapi/views/funding/block_2?page[limit]=50'
  try {
    const text = await fetchText(url)
    const json = JSON.parse(text) as {
      data?: Array<{
        id: string
        attributes?: EuraxessRawItem
      }>
    }
    const items: RawNewsItem[] = []
    for (const node of json.data ?? []) {
      try {
        const a = node.attributes ?? {}
        const titleStr = pickText(
          a.title as { processed?: string } | string | undefined,
        )
        const link = a.view_node
        if (!titleStr || !link || !link.startsWith('http')) continue
        const summary = pickText(
          a.body as { processed?: string; summary?: string } | string | undefined,
        )
        items.push({
          source: 'EURAXESS',
          sourceUrl: link,
          externalGuid: node.id,
          title: titleStr.slice(0, 500),
          summary: summary ? summary.slice(0, 800) : null,
          publishedAt: parseDateLoose(a.created ?? a.changed ?? null),
        })
      } catch {
        /* skip this row only */
      }
    }
    return { items }
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : 'unknown euraxess error',
    }
  }
}
